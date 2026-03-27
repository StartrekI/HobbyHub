import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export async function POST(req: NextRequest) {
  const { userId, lat, lng } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  // Check if user has location sharing enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { shareLocation: true },
  });

  const now = new Date();

  if (user?.shareLocation === false) {
    // Still update lastSeenAt/online but don't broadcast location
    await prisma.user.update({
      where: { id: userId },
      data: { online: true, lastSeenAt: now },
    });
    return NextResponse.json({ ok: true, updated: true, locationHidden: true });
  }

  const result = await prisma.user.updateMany({
    where: { id: userId, updatedAt: { lt: new Date(Date.now() - 30000) } },
    data: { online: true, lat, lng, lastSeenAt: now, updatedAt: now },
  });

  // Background: mark stale users as offline (10% of requests)
  if (Math.random() < 0.1) {
    prisma.user.updateMany({
      where: {
        online: true,
        lastSeenAt: { lt: new Date(Date.now() - STALE_THRESHOLD_MS) },
      },
      data: { online: false },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, updated: result.count > 0 });
}

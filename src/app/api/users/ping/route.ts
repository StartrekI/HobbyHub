import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Location heartbeat — updates GPS + keeps lastSeenAt fresh
export async function POST(req: NextRequest) {
  const { userId, lat, lng } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { shareLocation: true },
  });

  const now = new Date();

  if (user?.shareLocation === false) {
    // Keep heartbeat alive but don't share location
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
    return NextResponse.json({ ok: true, updated: true, locationHidden: true });
  }

  // Throttle: only update if last write was > 30s ago
  const result = await prisma.user.updateMany({
    where: { id: userId, updatedAt: { lt: new Date(Date.now() - 30000) } },
    data: { lat, lng, lastSeenAt: now, updatedAt: now },
  });

  return NextResponse.json({ ok: true, updated: result.count > 0 });
}

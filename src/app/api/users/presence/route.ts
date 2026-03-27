import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Instant presence toggle — no throttle, no delay
export async function POST(req: NextRequest) {
  const { userId, online } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      online: !!online,
      lastSeenAt: now,
    },
  });

  return NextResponse.json({ ok: true, online: !!online });
}

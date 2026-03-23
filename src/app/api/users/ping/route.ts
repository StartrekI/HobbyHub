import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId, lat, lng } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { online: true, lat, lng, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, user });
}

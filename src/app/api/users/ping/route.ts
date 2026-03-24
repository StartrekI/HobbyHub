import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId, lat, lng } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const result = await prisma.user.updateMany({
    where: { id: userId, updatedAt: { lt: new Date(Date.now() - 30000) } },
    data: { online: true, lat, lng, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: result.count > 0 });
}

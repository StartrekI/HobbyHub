import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { blockerId, blockedId } = await req.json();

  if (!blockerId || !blockedId) {
    return NextResponse.json({ error: "blockerId and blockedId required" }, { status: 400 });
  }

  const block = await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });

  return NextResponse.json(block, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { blockerId, blockedId } = await req.json();

  await prisma.block.deleteMany({
    where: { blockerId, blockedId },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: true },
  });

  return NextResponse.json(blocks);
}

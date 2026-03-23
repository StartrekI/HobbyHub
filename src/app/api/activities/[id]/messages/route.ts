import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const messages = await prisma.message.findMany({
    where: { activityId: id },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  messages.reverse();

  return NextResponse.json({
    messages,
    nextCursor: hasMore ? messages[0]?.id : null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { text, senderId } = await req.json();

  const message = await prisma.message.create({
    data: { text, senderId, activityId: id },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await prisma.message.findMany({
    where: { activityId: id },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { text, senderId } = await req.json();

  const message = await prisma.message.create({
    data: { text, senderId, activityId: id },
    include: { sender: true },
  });

  return NextResponse.json(message, { status: 201 });
}

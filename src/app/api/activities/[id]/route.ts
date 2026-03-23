import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatar: true, rating: true } },
      participants: {
        include: { user: { select: { id: true, name: true, avatar: true, rating: true } } },
        take: 50,
      },
      messages: {
        include: { sender: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { messages: true, participants: true } },
    },
  });

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reverse messages so they're in chronological order (we fetched latest 50 desc)
  activity.messages.reverse();

  return NextResponse.json(activity);
}

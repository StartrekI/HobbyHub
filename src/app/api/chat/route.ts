import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Get activities the user has joined
  const participations = await prisma.participant.findMany({
    where: { userId },
    include: {
      activity: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: { select: { id: true, name: true, avatar: true } } },
          },
          _count: {
            select: { participants: true, messages: true },
          },
        },
      },
    },
  });

  const chats = participations.map((p) => ({
    activityId: p.activity.id,
    title: p.activity.title,
    type: p.activity.type,
    lastMessage: p.activity.messages[0] || null,
    participantCount: p.activity._count.participants,
    messageCount: p.activity._count.messages,
  }));

  const res = NextResponse.json(chats);
  res.headers.set("Cache-Control", "private, max-age=3, stale-while-revalidate=10");
  return res;
}

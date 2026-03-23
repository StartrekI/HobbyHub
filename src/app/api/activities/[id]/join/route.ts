import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await req.json();

  const existing = await prisma.participant.findUnique({
    where: { userId_activityId: { userId, activityId: id } },
  });

  if (existing) {
    // Leave
    await prisma.participant.delete({ where: { id: existing.id } });
    return NextResponse.json({ joined: false });
  }

  // Join + fetch activity & user in parallel
  const [, activity, joiner] = await Promise.all([
    prisma.participant.create({ data: { userId, activityId: id } }),
    prisma.activity.findUnique({
      where: { id },
      select: { id: true, title: true, creatorId: true, creator: { select: { name: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  if (activity && joiner && activity.creatorId !== userId) {
    // Get all participants to notify (excluding joiner and creator)
    const participants = await prisma.participant.findMany({
      where: { activityId: id, userId: { notIn: [userId, activity.creatorId] } },
      select: { userId: true },
    });

    // Batch create all notifications at once with createMany
    const notifData = [
      // Notify creator
      {
        type: "activity_joined",
        title: "New Participant",
        body: `${joiner.name} joined your activity "${activity.title}"`,
        userId: activity.creatorId,
        data: JSON.stringify({ activityId: id, userId }),
      },
      // Notify other participants
      ...participants.map((p) => ({
        type: "activity_joined",
        title: "New Participant",
        body: `${joiner.name} joined "${activity.title}"`,
        userId: p.userId,
        data: JSON.stringify({ activityId: id }),
      })),
    ];

    // Single batch insert instead of N individual creates
    prisma.notification.createMany({ data: notifData }).catch(() => {});
  }

  return NextResponse.json({ joined: true });
}

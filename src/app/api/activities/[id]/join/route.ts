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

  // Join
  await prisma.participant.create({
    data: { userId, activityId: id },
  });

  // Get activity and user info for notification
  const [activity, joiner] = await Promise.all([
    prisma.activity.findUnique({ where: { id }, include: { creator: true } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  // Notify activity creator that someone joined
  if (activity && joiner && activity.creatorId !== userId) {
    await prisma.notification.create({
      data: {
        type: "activity_joined",
        title: "New Participant",
        body: `${joiner.name} joined your activity "${activity.title}"`,
        userId: activity.creatorId,
        data: JSON.stringify({ activityId: id, userId }),
      },
    });
  }

  // Notify other participants
  if (activity && joiner) {
    const participants = await prisma.participant.findMany({
      where: { activityId: id, userId: { notIn: [userId, activity.creatorId] } },
    });
    for (const p of participants) {
      await prisma.notification.create({
        data: {
          type: "activity_joined",
          title: "New Participant",
          body: `${joiner.name} joined "${activity.title}"`,
          userId: p.userId,
          data: JSON.stringify({ activityId: id }),
        },
      });
    }
  }

  return NextResponse.json({ joined: true });
}

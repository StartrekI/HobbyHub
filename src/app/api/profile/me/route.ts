import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const USER_SUMMARY = { id: true, name: true, avatar: true, online: true } as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const [profile, requests, connections] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          activitiesCreated: {
            select: { id: true, title: true, type: true, status: true, createdAt: true, _count: { select: { participants: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          participants: {
            select: {
              id: true, joinedAt: true,
              activity: {
                select: { id: true, title: true, type: true, status: true, createdAt: true, creator: { select: USER_SUMMARY } },
              },
            },
            orderBy: { joinedAt: "desc" },
            take: 20,
          },
        },
      }),
      prisma.profileRequest.findMany({
        where: { requestedId: userId },
        include: { requester: { select: USER_SUMMARY } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.connection.findMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        include: {
          fromUser: { select: USER_SUMMARY },
          toUser: { select: USER_SUMMARY },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const connectionsWithPartner = connections.map((c) => ({
      ...c,
      partner: c.fromUserId === userId ? c.toUser : c.fromUser,
    }));

    return NextResponse.json({ profile, requests, connections: connectionsWithPartner });
  } catch (error) {
    console.error("GET /api/profile/me error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Combined profile endpoint: user data + profile requests + connections in one request
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
          activitiesCreated: { include: { participants: true } },
          participants: { include: { activity: { include: { creator: true } } } },
        },
      }),
      prisma.profileRequest.findMany({
        where: { requestedId: userId },
        include: { requester: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.connection.findMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        include: { fromUser: true, toUser: true },
        orderBy: { updatedAt: "desc" },
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

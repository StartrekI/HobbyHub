import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Combined endpoint: activities + nearby users + unread count in one request
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "0.5");
    const userId = searchParams.get("userId") || "";

    const locationFilter = (lat === 0 && lng === 0) ? {} : {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [activities, users, unreadCount] = await Promise.all([
      prisma.activity.findMany({
        where: { status: "active", time: { gte: oneDayAgo }, ...locationFilter },
        include: {
          creator: { select: { id: true, name: true, avatar: true, rating: true } },
          participants: {
            include: { user: { select: { id: true, name: true, avatar: true, rating: true } } },
            take: 10,
          },
          _count: { select: { messages: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.user.findMany({
        where: {
          ...locationFilter,
          ...(userId ? { id: { not: userId } } : {}),
        },
        select: {
          id: true, name: true, avatar: true, lat: true, lng: true,
          online: true, rating: true, interests: true, role: true,
        },
        take: 50,
      }),
      userId
        ? prisma.notification.count({ where: { userId, read: false } })
        : Promise.resolve(0),
    ]);

    // Auto-end old activities in background
    prisma.activity.updateMany({
      where: { status: "active", time: { lt: oneDayAgo } },
      data: { status: "completed" },
    }).catch(() => {});

    const res = NextResponse.json({ activities, users, unreadCount });
    res.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=15");
    return res;
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

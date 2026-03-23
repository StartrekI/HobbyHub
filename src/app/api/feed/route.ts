import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Combined endpoint: returns activities + nearby users + unread notification count
// in a single request instead of 3 separate ones
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

    // Run all queries in parallel
    const [activities, users, unreadCount] = await Promise.all([
      // Activities
      prisma.activity.findMany({
        where: { status: "active", ...locationFilter },
        include: {
          creator: true,
          participants: { include: { user: true } },
          _count: { select: { messages: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      // Nearby users
      prisma.user.findMany({
        where: {
          ...locationFilter,
          ...(userId ? { id: { not: userId } } : {}),
        },
        take: 100,
      }),
      // Unread notifications count
      userId
        ? prisma.notification.count({ where: { userId, read: false } })
        : Promise.resolve(0),
    ]);

    // Auto-end old activities (non-blocking, don't await)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    prisma.activity.updateMany({
      where: { status: "active", time: { lt: oneDayAgo } },
      data: { status: "completed" },
    }).catch(() => {});

    return NextResponse.json({ activities, users, unreadCount });
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "0.5");

    const locationFilter = (lat === 0 && lng === 0) ? {} : {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    };

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Fetch recent activities, recent joins, and recent trips/gigs/ideas in parallel
    const [recentActivities, recentJoins, recentTrips, recentGigs, recentIdeas] = await Promise.all([
      prisma.activity.findMany({
        where: { createdAt: { gte: twoHoursAgo }, status: "active", ...locationFilter },
        include: { creator: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.participant.findMany({
        where: { joinedAt: { gte: twoHoursAgo }, activity: { status: "active", ...locationFilter } },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          activity: { select: { id: true, title: true, type: true, _count: { select: { participants: true } } } },
        },
        orderBy: { joinedAt: "desc" },
        take: 15,
      }),
      prisma.trip.findMany({
        where: { createdAt: { gte: twoHoursAgo }, status: "planning", ...locationFilter },
        include: { creator: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.gig.findMany({
        where: { createdAt: { gte: twoHoursAgo }, status: "open", ...locationFilter },
        include: { creator: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.idea.findMany({
        where: { createdAt: { gte: twoHoursAgo }, ...locationFilter },
        include: { creator: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Group joins by activity to create "3 people joined X" stories
    const joinsByActivity: Record<string, { count: number; lastUser: { name: string; avatar: string | null }; activity: { id: string; title: string; type: string }; latestJoin: Date }> = {};
    for (const j of recentJoins) {
      const aid = j.activity.id;
      if (!joinsByActivity[aid]) {
        joinsByActivity[aid] = {
          count: 0,
          lastUser: { name: j.user.name, avatar: j.user.avatar },
          activity: { id: j.activity.id, title: j.activity.title, type: j.activity.type },
          latestJoin: j.joinedAt,
        };
      }
      joinsByActivity[aid].count++;
      if (j.joinedAt > joinsByActivity[aid].latestJoin) {
        joinsByActivity[aid].lastUser = { name: j.user.name, avatar: j.user.avatar };
        joinsByActivity[aid].latestJoin = j.joinedAt;
      }
    }

    type Story = { id: string; type: string; text: string; avatar: string; userName: string; activityId: string; activityType: string; createdAt: string };
    const stories: Story[] = [];

    // New activity stories
    for (const a of recentActivities) {
      stories.push({
        id: `new:${a.id}`,
        type: "new_activity",
        text: `started "${a.title}"`,
        avatar: a.creator.avatar || "",
        userName: a.creator.name,
        activityId: a.id,
        activityType: a.type,
        createdAt: a.createdAt.toISOString(),
      });
    }

    // Join stories (grouped)
    for (const [, group] of Object.entries(joinsByActivity)) {
      const text = group.count === 1
        ? `joined "${group.activity.title}"`
        : `and ${group.count - 1} other${group.count > 2 ? "s" : ""} joined "${group.activity.title}"`;
      stories.push({
        id: `join:${group.activity.id}`,
        type: "join",
        text,
        avatar: group.lastUser.avatar || "",
        userName: group.lastUser.name,
        activityId: group.activity.id,
        activityType: group.activity.type,
        createdAt: group.latestJoin.toISOString(),
      });
    }

    // Trip stories
    for (const t of recentTrips) {
      stories.push({
        id: `trip:${t.id}`,
        type: "new_trip",
        text: `planned a trip to ${t.destination}`,
        avatar: t.creator.avatar || "",
        userName: t.creator.name,
        activityId: `trip:${t.id}`,
        activityType: "travel",
        createdAt: t.createdAt.toISOString(),
      });
    }

    // Gig stories
    for (const g of recentGigs) {
      stories.push({
        id: `gig:${g.id}`,
        type: "new_gig",
        text: `posted a gig: "${g.title}"`,
        avatar: g.creator.avatar || "",
        userName: g.creator.name,
        activityId: `gig:${g.id}`,
        activityType: "other",
        createdAt: g.createdAt.toISOString(),
      });
    }

    // Idea stories
    for (const i of recentIdeas) {
      stories.push({
        id: `idea:${i.id}`,
        type: "new_idea",
        text: `shared an idea: "${i.title}"`,
        avatar: i.creator.avatar || "",
        userName: i.creator.name,
        activityId: `idea:${i.id}`,
        activityType: "other",
        createdAt: i.createdAt.toISOString(),
      });
    }

    // Sort by most recent, limit to 20
    stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(stories.slice(0, 20));
  } catch (error) {
    console.error("GET /api/stories error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

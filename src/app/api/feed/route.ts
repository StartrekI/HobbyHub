import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Combined endpoint: activities + opportunities + nearby users + unread count
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

    // Run ALL queries in parallel — activities, trips, gigs, skills, ideas, users, unread
    const [activities, trips, gigs, skillSessions, ideas, users, unreadCount] = await Promise.all([
      prisma.activity.findMany({
        where: { status: "active", ...locationFilter },
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          participants: { include: { user: { select: { id: true, name: true, avatar: true } } }, take: 6 },
          _count: { select: { messages: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.trip.findMany({
        where: { status: "planning", ...locationFilter },
        include: { creator: { select: { id: true, name: true, avatar: true } }, participants: { include: { user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { participants: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.gig.findMany({
        where: { status: "open", ...locationFilter },
        include: { creator: { select: { id: true, name: true, avatar: true } }, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.skillSession.findMany({
        where: { status: "active", ...locationFilter },
        include: { teacher: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.idea.findMany({
        where: locationFilter,
        include: { creator: { select: { id: true, name: true, avatar: true } }, _count: { select: { comments: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.user.findMany({
        where: {
          ...locationFilter,
          ...(userId ? { id: { not: userId } } : {}),
          shareLocation: true,
        },
        select: {
          id: true, name: true, email: true, bio: true, avatar: true,
          interests: true, lat: true, lng: true, online: true, rating: true,
          verified: true, role: true, title: true, company: true,
          skills: true, collegeName: true, lastSeenAt: true, shareLocation: true,
        },
        take: 50,
      }),
      userId
        ? prisma.notification.count({ where: { userId, read: false } })
        : Promise.resolve(0),
    ]);

    // Convert opportunities to Activity-shaped objects so they show as map markers
    const opportunityActivities = [
      ...trips.map((t) => ({
        id: `trip:${t.id}`,
        type: "travel",
        title: `Trip: ${t.destination}`,
        description: t.description,
        lat: t.lat,
        lng: t.lng,
        time: t.createdAt,
        playersNeeded: t.maxBuddies,
        status: "active",
        category: "travel",
        isEvent: false,
        ticketPrice: 0,
        isFree: true,
        eventUrl: "",
        isRecurring: false,
        recurrencePattern: "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        creatorId: t.creatorId,
        creator: t.creator,
        participants: t.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          activityId: `trip:${t.id}`,
          joinedAt: p.joinedAt,
          user: p.user,
        })),
        _count: { messages: 0, participants: t._count.participants },
        _opportunityType: "trip",
        _originalId: t.id,
      })),
      ...gigs.map((g) => ({
        id: `gig:${g.id}`,
        type: "other",
        title: `Gig: ${g.title}`,
        description: g.description,
        lat: g.lat,
        lng: g.lng,
        time: g.createdAt,
        playersNeeded: 1,
        status: "active",
        category: "work",
        isEvent: false,
        ticketPrice: 0,
        isFree: true,
        eventUrl: "",
        isRecurring: false,
        recurrencePattern: "",
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        creatorId: g.creatorId,
        creator: g.creator,
        participants: [],
        _count: { messages: 0, participants: g._count.applications },
        _opportunityType: "gig",
        _originalId: g.id,
      })),
      ...skillSessions.map((s) => ({
        id: `skill:${s.id}`,
        type: "study",
        title: `Skill: ${s.skill}`,
        description: s.description,
        lat: s.lat,
        lng: s.lng,
        time: s.createdAt,
        playersNeeded: 2,
        status: "active",
        category: "education",
        isEvent: false,
        ticketPrice: s.price,
        isFree: s.isFree,
        eventUrl: "",
        isRecurring: false,
        recurrencePattern: "",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        creatorId: s.teacherId,
        creator: s.teacher,
        participants: [],
        _count: { messages: 0, participants: 0 },
        _opportunityType: "skill",
        _originalId: s.id,
      })),
      ...ideas.map((i) => ({
        id: `idea:${i.id}`,
        type: "other",
        title: `Idea: ${i.title}`,
        description: i.description,
        lat: i.lat,
        lng: i.lng,
        time: i.createdAt,
        playersNeeded: 0,
        status: "active",
        category: "ideas",
        isEvent: false,
        ticketPrice: 0,
        isFree: true,
        eventUrl: "",
        isRecurring: false,
        recurrencePattern: "",
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        creatorId: i.creatorId,
        creator: i.creator,
        participants: [],
        _count: { messages: 0, participants: i._count.comments },
        _opportunityType: "idea",
        _originalId: i.id,
      })),
    ];

    const allActivities = [...activities, ...opportunityActivities];

    // Auto-end old activities in background (non-blocking) — only 10% of requests
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (Math.random() < 0.1) {
      prisma.activity.updateMany({
        where: { status: "active", time: { lt: oneDayAgo } },
        data: { status: "completed" },
      }).catch(() => {});

      // Safety net: mark users offline if no heartbeat for 60 seconds
      // (handles cases where sendBeacon/socket disconnect both fail)
      prisma.user.updateMany({
        where: {
          online: true,
          lastSeenAt: { lt: new Date(Date.now() - 60_000) },
        },
        data: { online: false },
      }).catch(() => {});
    }

    return NextResponse.json({ activities: allActivities, users, unreadCount });
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

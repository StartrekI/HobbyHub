import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Minimal creator shape — only what map markers need
const CREATOR_SELECT = { select: { id: true, name: true, avatar: true } } as const;
// Minimal participant shape — only avatars for stacking
const PARTICIPANT_SELECT = {
  select: { id: true, userId: true, joinedAt: true, user: { select: { id: true, name: true, avatar: true } } },
  take: 6,
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "0.5");
    const userId = searchParams.get("userId") || "";

    const hasLocation = lat !== 0 || lng !== 0;
    const locationFilter = hasLocation ? {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    } : {};

    // Run ALL 7 queries in parallel
    const [activities, trips, gigs, skillSessions, ideas, users, unreadCount] = await Promise.all([
      prisma.activity.findMany({
        where: { status: "active", ...locationFilter },
        include: {
          creator: CREATOR_SELECT,
          participants: PARTICIPANT_SELECT,
          _count: { select: { messages: true, participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.trip.findMany({
        where: { status: "planning", ...locationFilter },
        include: {
          creator: CREATOR_SELECT,
          participants: PARTICIPANT_SELECT,
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.gig.findMany({
        where: { status: "open", ...locationFilter },
        include: { creator: CREATOR_SELECT, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.skillSession.findMany({
        where: { status: "active", ...locationFilter },
        include: { teacher: CREATOR_SELECT },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.idea.findMany({
        where: locationFilter,
        include: { creator: CREATOR_SELECT, _count: { select: { comments: true } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.user.findMany({
        where: {
          ...locationFilter,
          ...(userId ? { id: { not: userId } } : {}),
          shareLocation: true,
        },
        select: {
          id: true, name: true, bio: true, avatar: true,
          interests: true, lat: true, lng: true, online: true, rating: true,
          verified: true, role: true, title: true, company: true,
          skills: true, collegeName: true, lastSeenAt: true, shareLocation: true,
        },
        take: 40,
      }),
      userId
        ? prisma.notification.count({ where: { userId, read: false } })
        : Promise.resolve(0),
    ]);

    // Convert opportunities → activity-shaped map markers (only send what client needs)
    const opportunityActivities = [
      ...trips.map((t) => ({
        id: `trip:${t.id}`, type: "travel", title: `Trip: ${t.destination}`,
        description: t.description, lat: t.lat, lng: t.lng, time: t.createdAt,
        playersNeeded: t.maxBuddies, status: "active", category: "travel",
        isEvent: false, ticketPrice: 0, isFree: true, eventUrl: "", isRecurring: false, recurrencePattern: "",
        createdAt: t.createdAt, updatedAt: t.updatedAt, creatorId: t.creatorId,
        creator: t.creator,
        participants: t.participants.map((p) => ({
          id: p.id, userId: p.userId, activityId: `trip:${t.id}`, joinedAt: p.joinedAt, user: p.user,
        })),
        _count: { messages: 0, participants: t._count.participants },
        _opportunityType: "trip", _originalId: t.id,
      })),
      ...gigs.map((g) => ({
        id: `gig:${g.id}`, type: "other", title: `Gig: ${g.title}`,
        description: g.description, lat: g.lat, lng: g.lng, time: g.createdAt,
        playersNeeded: 1, status: "active", category: "work",
        isEvent: false, ticketPrice: 0, isFree: true, eventUrl: "", isRecurring: false, recurrencePattern: "",
        createdAt: g.createdAt, updatedAt: g.updatedAt, creatorId: g.creatorId,
        creator: g.creator, participants: [],
        _count: { messages: 0, participants: g._count.applications },
        _opportunityType: "gig", _originalId: g.id,
      })),
      ...skillSessions.map((s) => ({
        id: `skill:${s.id}`, type: "study", title: `Skill: ${s.skill}`,
        description: s.description, lat: s.lat, lng: s.lng, time: s.createdAt,
        playersNeeded: 2, status: "active", category: "education",
        isEvent: false, ticketPrice: s.price, isFree: s.isFree, eventUrl: "", isRecurring: false, recurrencePattern: "",
        createdAt: s.createdAt, updatedAt: s.updatedAt, creatorId: s.teacherId,
        creator: s.teacher, participants: [],
        _count: { messages: 0, participants: 0 },
        _opportunityType: "skill", _originalId: s.id,
      })),
      ...ideas.map((i) => ({
        id: `idea:${i.id}`, type: "other", title: `Idea: ${i.title}`,
        description: i.description, lat: i.lat, lng: i.lng, time: i.createdAt,
        playersNeeded: 0, status: "active", category: "ideas",
        isEvent: false, ticketPrice: 0, isFree: true, eventUrl: "", isRecurring: false, recurrencePattern: "",
        createdAt: i.createdAt, updatedAt: i.updatedAt, creatorId: i.creatorId,
        creator: i.creator, participants: [],
        _count: { messages: 0, participants: i._count.comments },
        _opportunityType: "idea", _originalId: i.id,
      })),
    ];

    // Background cleanup (non-blocking, 5% of requests)
    if (Math.random() < 0.05) {
      const oneDayAgo = new Date(Date.now() - 86_400_000);
      prisma.activity.updateMany({
        where: { status: "active", time: { lt: oneDayAgo } },
        data: { status: "completed" },
      }).catch(() => {});
      prisma.user.updateMany({
        where: { online: true, lastSeenAt: { lt: new Date(Date.now() - 60_000) } },
        data: { online: false },
      }).catch(() => {});
    }

    const res = NextResponse.json({
      activities: [...activities, ...opportunityActivities],
      users,
      unreadCount,
    });

    // Client can reuse for 5s, then revalidate in background
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=10");
    return res;
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

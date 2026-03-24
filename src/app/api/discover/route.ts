import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");
  const type = searchParams.get("type") || "all";

  const locFilter = {
    lat: { gte: lat - radius, lte: lat + radius },
    lng: { gte: lng - radius, lte: lng + radius },
  };

  // Build queries array — only include what's needed based on filter
  const queries: Record<string, Promise<unknown[]>> = {};

  if (type === "all" || type === "activity") {
    queries.activities = prisma.activity.findMany({
      where: { status: "active", ...locFilter },
      select: {
        id: true, type: true, title: true, description: true,
        lat: true, lng: true, createdAt: true, isEvent: true,
        playersNeeded: true, ticketPrice: true, isFree: true,
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  if (type === "all" || type === "gig") {
    queries.gigs = prisma.gig.findMany({
      where: { status: "open", ...locFilter },
      select: {
        id: true, title: true, description: true, budget: true, skills: true,
        lat: true, lng: true, createdAt: true,
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  if (type === "all" || type === "skill") {
    queries.skills = prisma.skillSession.findMany({
      where: { status: "active", ...locFilter },
      select: {
        id: true, skill: true, description: true, isFree: true, price: true,
        lat: true, lng: true, createdAt: true, sessionType: true,
        teacher: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  if (type === "all" || type === "trip") {
    queries.trips = prisma.trip.findMany({
      where: { status: "planning", ...locFilter },
      select: {
        id: true, destination: true, description: true, budget: true,
        tripType: true, maxBuddies: true,
        lat: true, lng: true, createdAt: true,
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  if (type === "all" || type === "idea") {
    queries.ideas = prisma.idea.findMany({
      where: locFilter,
      select: {
        id: true, title: true, description: true, category: true,
        stage: true, likes: true, lookingFor: true,
        lat: true, lng: true, createdAt: true,
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  // Execute ALL queries in parallel
  const keys = Object.keys(queries);
  const results = await Promise.all(Object.values(queries));
  const dataMap: Record<string, unknown[]> = {};
  keys.forEach((k, i) => { dataMap[k] = results[i]; });

  // Build unified feed
  type FeedEntry = {
    id: string; feedType: string; title: string; description: string;
    lat: number; lng: number; createdAt: Date; creator: unknown; data: unknown;
  };
  const feed: FeedEntry[] = [];

  if (dataMap.activities) {
    for (const a of dataMap.activities as Array<Record<string, unknown>>) {
      feed.push({
        id: a.id as string, feedType: (a.isEvent ? "event" : "activity") as string,
        title: a.title as string, description: a.description as string,
        lat: a.lat as number, lng: a.lng as number, createdAt: a.createdAt as Date,
        creator: a.creator, data: a,
      });
    }
  }
  if (dataMap.gigs) {
    for (const g of dataMap.gigs as Array<Record<string, unknown>>) {
      feed.push({
        id: g.id as string, feedType: "gig",
        title: g.title as string, description: g.description as string,
        lat: g.lat as number, lng: g.lng as number, createdAt: g.createdAt as Date,
        creator: g.creator, data: g,
      });
    }
  }
  if (dataMap.skills) {
    for (const s of dataMap.skills as Array<Record<string, unknown>>) {
      feed.push({
        id: s.id as string, feedType: "skill",
        title: s.skill as string, description: s.description as string,
        lat: s.lat as number, lng: s.lng as number, createdAt: s.createdAt as Date,
        creator: s.teacher, data: s,
      });
    }
  }
  if (dataMap.trips) {
    for (const t of dataMap.trips as Array<Record<string, unknown>>) {
      feed.push({
        id: t.id as string, feedType: "trip",
        title: t.destination as string, description: t.description as string,
        lat: t.lat as number, lng: t.lng as number, createdAt: t.createdAt as Date,
        creator: t.creator, data: t,
      });
    }
  }
  if (dataMap.ideas) {
    for (const i of dataMap.ideas as Array<Record<string, unknown>>) {
      feed.push({
        id: i.id as string, feedType: "idea",
        title: i.title as string, description: i.description as string,
        lat: i.lat as number, lng: i.lng as number, createdAt: i.createdAt as Date,
        creator: i.creator, data: i,
      });
    }
  }

  feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const res = NextResponse.json(feed);
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");
  const type = searchParams.get("type") || "all";

  const feed: Array<{
    id: string;
    feedType: string;
    title: string;
    description: string;
    lat: number;
    lng: number;
    createdAt: Date;
    creator: unknown;
    data: unknown;
  }> = [];

  if (type === "all" || type === "activity") {
    const activities = await prisma.activity.findMany({
      where: {
        status: "active",
        lat: { gte: lat - radius, lte: lat + radius },
        lng: { gte: lng - radius, lte: lng + radius },
      },
      include: { creator: true, _count: { select: { participants: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const a of activities) {
      feed.push({
        id: a.id,
        feedType: a.isEvent ? "event" : "activity",
        title: a.title,
        description: a.description,
        lat: a.lat,
        lng: a.lng,
        createdAt: a.createdAt,
        creator: a.creator,
        data: a,
      });
    }
  }

  if (type === "all" || type === "gig") {
    const gigs = await prisma.gig.findMany({
      where: {
        status: "open",
        lat: { gte: lat - radius, lte: lat + radius },
        lng: { gte: lng - radius, lte: lng + radius },
      },
      include: { creator: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const g of gigs) {
      feed.push({
        id: g.id,
        feedType: "gig",
        title: g.title,
        description: g.description,
        lat: g.lat,
        lng: g.lng,
        createdAt: g.createdAt,
        creator: g.creator,
        data: g,
      });
    }
  }

  if (type === "all" || type === "skill") {
    const sessions = await prisma.skillSession.findMany({
      where: {
        status: "active",
        lat: { gte: lat - radius, lte: lat + radius },
        lng: { gte: lng - radius, lte: lng + radius },
      },
      include: { teacher: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const s of sessions) {
      feed.push({
        id: s.id,
        feedType: "skill",
        title: s.skill,
        description: s.description,
        lat: s.lat,
        lng: s.lng,
        createdAt: s.createdAt,
        creator: s.teacher,
        data: s,
      });
    }
  }

  if (type === "all" || type === "trip") {
    const trips = await prisma.trip.findMany({
      where: {
        status: "planning",
        lat: { gte: lat - radius, lte: lat + radius },
        lng: { gte: lng - radius, lte: lng + radius },
      },
      include: { creator: true, _count: { select: { participants: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const t of trips) {
      feed.push({
        id: t.id,
        feedType: "trip",
        title: t.destination,
        description: t.description,
        lat: t.lat,
        lng: t.lng,
        createdAt: t.createdAt,
        creator: t.creator,
        data: t,
      });
    }
  }

  if (type === "all" || type === "idea") {
    const ideas = await prisma.idea.findMany({
      where: {
        lat: { gte: lat - radius, lte: lat + radius },
        lng: { gte: lng - radius, lte: lng + radius },
      },
      include: { creator: true, _count: { select: { comments: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const i of ideas) {
      feed.push({
        id: i.id,
        feedType: "idea",
        title: i.title,
        description: i.description,
        lat: i.lat,
        lng: i.lng,
        createdAt: i.createdAt,
        creator: i.creator,
        data: i,
      });
    }
  }

  // Sort by newest first
  feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(feed);
}

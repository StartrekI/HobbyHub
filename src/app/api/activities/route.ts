import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05"); // ~5km in degrees

  // Auto-end past activities
  await prisma.activity.updateMany({
    where: { status: "active", time: { lt: new Date() } },
    data: { status: "completed" },
  });

  const activities = await prisma.activity.findMany({
    where: {
      status: "active",
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    },
    include: {
      creator: true,
      participants: { include: { user: true } },
      _count: { select: { messages: true, participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    type, title, description, lat, lng, time, playersNeeded, creatorId,
    category, isEvent, ticketPrice, isFree, eventUrl, isRecurring, recurrencePattern,
  } = body;

  const activity = await prisma.activity.create({
    data: {
      type,
      title,
      description: description || "",
      lat,
      lng,
      time: new Date(time),
      playersNeeded: playersNeeded || 2,
      creatorId,
      category: category || "social",
      isEvent: isEvent || false,
      ticketPrice: ticketPrice || 0,
      isFree: isFree !== false,
      eventUrl: eventUrl || "",
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || "",
    },
    include: {
      creator: true,
      participants: { include: { user: true } },
    },
  });

  // Auto-join creator
  await prisma.participant.create({
    data: { userId: creatorId, activityId: activity.id },
  });

  const full = await prisma.activity.findUnique({
    where: { id: activity.id },
    include: {
      creator: true,
      participants: { include: { user: true } },
      _count: { select: { messages: true, participants: true } },
    },
  });

  // Notify nearby users about new activity
  const radius = 0.03;
  const nearbyUsers = await prisma.user.findMany({
    where: {
      id: { not: creatorId },
      online: true,
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    },
    take: 50,
  });

  for (const u of nearbyUsers) {
    await prisma.notification.create({
      data: {
        type: "new_activity",
        title: "New Activity Nearby",
        body: `${activity.creator.name} created "${title}" near you`,
        userId: u.id,
        data: JSON.stringify({ activityId: activity.id }),
      },
    });
  }

  return NextResponse.json(full, { status: 201 });
}

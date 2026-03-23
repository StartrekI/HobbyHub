import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");

  const trips = await prisma.trip.findMany({
    where: {
      status: "planning",
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    },
    include: {
      creator: true,
      participants: { include: { user: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { destination, description, startDate, endDate, tripType, budget, maxBuddies, lat, lng, creatorId } = body;

  const trip = await prisma.trip.create({
    data: {
      destination,
      description: description || "",
      startDate: startDate || "",
      endDate: endDate || "",
      tripType: tripType || "adventure",
      budget: budget || "",
      maxBuddies: maxBuddies || 4,
      lat: lat || 0,
      lng: lng || 0,
      creatorId,
    },
    include: { creator: true, _count: { select: { participants: true } } },
  });

  return NextResponse.json(trip);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { tripId, userId } = body;

  // Join trip
  const existing = await prisma.tripParticipant.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });

  if (existing) {
    await prisma.tripParticipant.delete({ where: { id: existing.id } });
    return NextResponse.json({ joined: false });
  }

  const participant = await prisma.tripParticipant.create({
    data: { tripId, userId },
    include: { user: true, trip: true },
  });

  // Notify trip creator
  await prisma.notification.create({
    data: {
      type: "trip_joined",
      title: "New Travel Buddy!",
      body: `${participant.user.name} joined your trip to ${participant.trip.destination}`,
      userId: participant.trip.creatorId,
    },
  });

  return NextResponse.json({ joined: true, participant });
}

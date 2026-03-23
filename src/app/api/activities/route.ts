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

    const activities = await prisma.activity.findMany({
      where: {
        status: "active",
        ...locationFilter,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true, rating: true } },
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, rating: true } } },
          take: 20,
        },
        _count: { select: { messages: true, participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Auto-end old activities in background (non-blocking)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    prisma.activity.updateMany({
      where: { status: "active", time: { lt: oneDayAgo } },
      data: { status: "completed" },
    }).catch(() => {});

    return NextResponse.json(activities);
  } catch (error) {
    console.error("GET /api/activities error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, title, description, lat, lng, time, playersNeeded, creatorId,
      category, isEvent, ticketPrice, isFree, eventUrl, isRecurring, recurrencePattern,
    } = body;

    if (!type || !title || !creatorId) {
      return NextResponse.json({ error: "Missing required fields: type, title, creatorId" }, { status: 400 });
    }

    const activityTime = time ? new Date(time) : new Date(Date.now() + 3600000);

    // Create activity + auto-join creator in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.activity.create({
        data: {
          type, title, description: description || "",
          lat: lat || 0, lng: lng || 0, time: activityTime,
          playersNeeded: playersNeeded || 2, creatorId,
          category: category || "social", isEvent: isEvent || false,
          ticketPrice: ticketPrice || 0, isFree: isFree !== false,
          eventUrl: eventUrl || "", isRecurring: isRecurring || false,
          recurrencePattern: recurrencePattern || "",
        },
      });
    });

    // Find the just-created activity (latest by this creator)
    const activity = await prisma.activity.findFirst({
      where: { creatorId, title, type },
      orderBy: { createdAt: "desc" },
      include: {
        creator: true,
        participants: { include: { user: true } },
        _count: { select: { messages: true, participants: true } },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
    }

    // Auto-join creator as participant
    await prisma.participant.create({
      data: { userId: creatorId, activityId: activity.id },
    }).catch(() => {});

    // Re-fetch with participant included
    const full = await prisma.activity.findUnique({
      where: { id: activity.id },
      include: {
        creator: true,
        participants: { include: { user: true } },
        _count: { select: { messages: true, participants: true } },
      },
    });

    // Notify nearby users in background (non-blocking, batch create)
    (async () => {
      try {
        const nearbyUsers = await prisma.user.findMany({
          where: {
            id: { not: creatorId },
            lat: { gte: (lat || 0) - 0.5, lte: (lat || 0) + 0.5 },
            lng: { gte: (lng || 0) - 0.5, lte: (lng || 0) + 0.5 },
          },
          select: { id: true },
          take: 50,
        });

        if (nearbyUsers.length > 0) {
          await prisma.notification.createMany({
            data: nearbyUsers.map((u) => ({
              type: "new_activity",
              title: "New Activity Nearby",
              body: `${activity.creator.name} created "${title}" near you`,
              userId: u.id,
              data: JSON.stringify({ activityId: activity.id }),
            })),
          });
        }
      } catch (e) {
        console.error("Notification error (non-fatal):", e);
      }
    })();

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    console.error("POST /api/activities error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

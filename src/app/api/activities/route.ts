import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const CREATOR_SELECT = { id: true, name: true, avatar: true, rating: true } as const;

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
      where: { status: "active", ...locationFilter },
      include: {
        creator: { select: CREATOR_SELECT },
        participants: {
          select: { id: true, userId: true, joinedAt: true, user: { select: CREATOR_SELECT } },
          take: 6, // Only need avatars for stacking — was 20
        },
        _count: { select: { messages: true, participants: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const res = NextResponse.json(activities);
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=10");
    return res;
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

    // Single transaction: create activity + auto-join creator (was 4 queries, now 1 transaction)
    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
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

      await tx.participant.create({
        data: { userId: creatorId, activityId: created.id },
      });

      // Return the full object in the same transaction
      return tx.activity.findUnique({
        where: { id: created.id },
        include: {
          creator: { select: CREATOR_SELECT },
          participants: {
            select: { id: true, userId: true, joinedAt: true, user: { select: CREATOR_SELECT } },
          },
          _count: { select: { messages: true, participants: true } },
        },
      });
    });

    if (!activity) {
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
    }

    // Notify nearby users in background (non-blocking)
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

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("POST /api/activities error:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

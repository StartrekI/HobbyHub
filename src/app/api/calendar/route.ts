import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "0.5");
    const days = parseInt(searchParams.get("days") || "7", 10);

    const locationFilter = (lat === 0 && lng === 0) ? {} : {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    };

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const activities = await prisma.activity.findMany({
      where: {
        time: { gte: now, lte: end },
        status: "active",
        ...locationFilter,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { time: "asc" },
      take: 100,
    });

    // Group by date
    const grouped: Record<string, typeof activities> = {};
    for (const a of activities) {
      const dateKey = new Date(a.time).toISOString().split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(a);
    }

    // Build calendar days for the range
    const calendar = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0];
      const dayActivities = grouped[dateKey] || [];

      calendar.push({
        date: dateKey,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        activities: dayActivities,
      });
    }

    return NextResponse.json(calendar);
  } catch (error) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

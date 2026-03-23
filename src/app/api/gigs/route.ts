import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");

  const gigs = await prisma.gig.findMany({
    where: {
      status: "open",
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    },
    include: {
      creator: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gigs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, budget, skills, deadline, location, lat, lng, creatorId } = body;

  const gig = await prisma.gig.create({
    data: {
      title,
      description: description || "",
      budget: budget || 0,
      skills: JSON.stringify(skills || []),
      deadline: deadline || "",
      location: location || "",
      lat: lat || 0,
      lng: lng || 0,
      creatorId,
    },
    include: { creator: true },
  });

  return NextResponse.json(gig);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { gigId, userId, message } = body;

  // Apply to a gig
  const application = await prisma.gigApplication.create({
    data: {
      gigId,
      userId,
      message: message || "",
    },
    include: { user: true, gig: true },
  });

  // Notify gig creator
  await prisma.notification.create({
    data: {
      type: "gig_application",
      title: "New Gig Application",
      body: `${application.user.name} applied to "${application.gig.title}"`,
      userId: application.gig.creatorId,
    },
  });

  return NextResponse.json(application);
}

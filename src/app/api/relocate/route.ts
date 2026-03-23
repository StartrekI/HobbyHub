import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Relocates all seed data around the user's actual location
export async function POST(req: NextRequest) {
  const { lat, lng } = await req.json();
  if (!lat || !lng) return NextResponse.json({ error: "lat/lng required" }, { status: 400 });

  const OLD_CENTER = { lat: 12.9716, lng: 77.5946 };

  // Calculate offset from old center to new center
  const dLat = lat - OLD_CENTER.lat;
  const dLng = lng - OLD_CENTER.lng;

  // If already close enough, skip
  if (Math.abs(dLat) < 0.01 && Math.abs(dLng) < 0.01) {
    return NextResponse.json({ relocated: false, message: "Already near seed center" });
  }

  // Relocate all users (except keep exact user location for the demo user)
  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        lat: u.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: u.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  // Relocate activities
  const activities = await prisma.activity.findMany();
  for (const a of activities) {
    await prisma.activity.update({
      where: { id: a.id },
      data: {
        lat: a.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: a.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  // Relocate skill sessions
  const skills = await prisma.skillSession.findMany();
  for (const s of skills) {
    await prisma.skillSession.update({
      where: { id: s.id },
      data: {
        lat: s.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: s.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  // Relocate gigs
  const gigs = await prisma.gig.findMany();
  for (const g of gigs) {
    await prisma.gig.update({
      where: { id: g.id },
      data: {
        lat: g.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: g.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  // Relocate trips
  const trips = await prisma.trip.findMany();
  for (const t of trips) {
    await prisma.trip.update({
      where: { id: t.id },
      data: {
        lat: t.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: t.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  // Relocate ideas
  const ideas = await prisma.idea.findMany();
  for (const i of ideas) {
    await prisma.idea.update({
      where: { id: i.id },
      data: {
        lat: i.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: i.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  // Relocate businesses
  const businesses = await prisma.business.findMany();
  for (const b of businesses) {
    await prisma.business.update({
      where: { id: b.id },
      data: {
        lat: b.lat + dLat + (Math.random() - 0.5) * 0.001,
        lng: b.lng + dLng + (Math.random() - 0.5) * 0.001,
      },
    });
  }

  return NextResponse.json({
    relocated: true,
    from: OLD_CENTER,
    to: { lat, lng },
    counts: {
      users: users.length,
      activities: activities.length,
      skills: skills.length,
      gigs: gigs.length,
      trips: trips.length,
      ideas: ideas.length,
      businesses: businesses.length,
    },
  });
}

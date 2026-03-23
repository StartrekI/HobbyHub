import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");

  const sessions = await prisma.skillSession.findMany({
    where: {
      status: "active",
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    },
    include: { teacher: true, learner: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { skill, description, sessionType, isFree, price, schedule, lat, lng, teacherId } = body;

  const session = await prisma.skillSession.create({
    data: {
      skill,
      description: description || "",
      sessionType: sessionType || "teaching",
      isFree: isFree !== false,
      price: price || 0,
      schedule: schedule || "",
      lat: lat || 0,
      lng: lng || 0,
      teacherId,
    },
    include: { teacher: true },
  });

  return NextResponse.json(session);
}

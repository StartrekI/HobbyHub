import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");
  const role = searchParams.get("role") || "";
  const stage = searchParams.get("stage") || "";
  const lookingFor = searchParams.get("lookingFor") || "";
  const userId = searchParams.get("userId") || "";

  const where: Record<string, unknown> = {
    lat: { gte: lat - radius, lte: lat + radius },
    lng: { gte: lng - radius, lte: lng + radius },
    NOT: { id: userId || undefined },
  };

  if (role) where.role = role;
  if (stage) where.startupStage = stage;
  if (lookingFor) where.lookingFor = { contains: lookingFor };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, bio: true, avatar: true,
      interests: true, lat: true, lng: true, online: true,
      rating: true, verified: true, role: true, title: true,
      company: true, skills: true, collegeName: true,
      lookingFor: true, startupStage: true,
      lastSeenAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const res = NextResponse.json(users);
  res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
  return res;
}

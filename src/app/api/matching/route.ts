import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.03");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userInterests: string[] = JSON.parse(user.interests || "[]");

  // Get blocked user IDs
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  const blockedIds = new Set([
    ...blocks.map((b) => b.blockerId),
    ...blocks.map((b) => b.blockedId),
    userId,
  ]);

  // Get nearby users
  const nearbyUsers = await prisma.user.findMany({
    where: {
      id: { notIn: [...blockedIds] },
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
      online: true,
    },
  });

  // Score by shared interests
  const scoredUsers = nearbyUsers
    .map((u) => {
      const theirInterests: string[] = JSON.parse(u.interests || "[]");
      const shared = userInterests.filter((i) => theirInterests.includes(i));
      return { user: u, sharedInterests: shared, score: shared.length };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Get suggested activities (matching user interests)
  const activities = await prisma.activity.findMany({
    where: {
      status: "active",
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
      creatorId: { notIn: [...blockedIds] },
    },
    include: {
      creator: true,
      participants: { include: { user: true } },
      _count: { select: { participants: true } },
    },
  });

  // Map activity types to interests
  const typeToInterest: Record<string, string[]> = {
    sports: ["badminton", "cricket", "football", "basketball", "tennis"],
    fitness: ["gym", "running", "yoga", "swimming", "cycling"],
    travel: ["travel", "hiking"],
    music: ["music", "dance"],
    gaming: ["gaming", "coding"],
    food: ["cooking"],
    art: ["art"],
    photography: ["photography"],
    study: ["reading", "coding"],
  };

  const suggestedActivities = activities
    .map((a) => {
      const relatedInterests = typeToInterest[a.type] || [];
      const overlap = userInterests.filter((i) => relatedInterests.includes(i));
      return { activity: a, relevanceScore: overlap.length };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 8);

  return NextResponse.json({
    suggestedUsers: scoredUsers,
    suggestedActivities,
  });
}

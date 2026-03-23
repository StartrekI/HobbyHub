import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.03");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Fetch user + blocked IDs in parallel
  const [user, blocks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true },
    }),
    prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userInterests: string[] = JSON.parse(user.interests || "[]");
  const blockedIds = [
    ...new Set([
      ...blocks.map((b) => b.blockerId),
      ...blocks.map((b) => b.blockedId),
      userId,
    ]),
  ];

  const locFilter = {
    lat: { gte: lat - radius, lte: lat + radius },
    lng: { gte: lng - radius, lte: lng + radius },
  };

  // Fetch users + activities in parallel (use notIn to exclude blocked in DB)
  const [nearbyUsers, activities] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { notIn: blockedIds },
        ...locFilter,
        online: true,
      },
      select: {
        id: true, name: true, avatar: true, interests: true,
        lat: true, lng: true, online: true, rating: true,
      },
      take: 30,
    }),
    prisma.activity.findMany({
      where: {
        status: "active",
        ...locFilter,
        creatorId: { notIn: blockedIds },
      },
      select: {
        id: true, type: true, title: true, description: true,
        lat: true, lng: true, time: true, playersNeeded: true,
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { participants: true } },
      },
      take: 20,
    }),
  ]);

  // Score by shared interests (in-memory, fast for small sets)
  const scoredUsers = nearbyUsers
    .map((u) => {
      const theirInterests: string[] = JSON.parse(u.interests || "[]");
      const shared = userInterests.filter((i) => theirInterests.includes(i));
      return { user: u, sharedInterests: shared, score: shared.length };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

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

  const res = NextResponse.json({ suggestedUsers: scoredUsers, suggestedActivities });
  res.headers.set("Cache-Control", "private, s-maxage=10, stale-while-revalidate=20");
  return res;
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";

  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: { fromUser: true, toUser: true },
    orderBy: { updatedAt: "desc" },
  });

  // Map to show the "other" user
  const result = connections.map((c) => ({
    ...c,
    partner: c.fromUserId === userId ? c.toUser : c.fromUser,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fromUserId, toUserId } = body;

  // Check if already connected
  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    },
  });

  if (existing) {
    // Increment interaction
    const updated = await prisma.connection.update({
      where: { id: existing.id },
      data: { interactionCount: { increment: 1 } },
      include: { fromUser: true, toUser: true },
    });
    return NextResponse.json(updated);
  }

  const connection = await prisma.connection.create({
    data: { fromUserId, toUserId },
    include: { fromUser: true, toUser: true },
  });

  // Update connection counts
  await prisma.user.update({
    where: { id: fromUserId },
    data: { connectionsCount: { increment: 1 } },
  });
  await prisma.user.update({
    where: { id: toUserId },
    data: { connectionsCount: { increment: 1 } },
  });

  return NextResponse.json(connection);
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");

  const ideas = await prisma.idea.findMany({
    where: {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    },
    include: {
      creator: true,
      comments: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, category, stage, lookingFor, lat, lng, creatorId } = body;

  const idea = await prisma.idea.create({
    data: {
      title,
      description: description || "",
      category: category || "general",
      stage: stage || "concept",
      lookingFor: lookingFor || "",
      lat: lat || 0,
      lng: lng || 0,
      creatorId,
    },
    include: { creator: true, _count: { select: { comments: true } } },
  });

  return NextResponse.json(idea);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // Like or comment
  if (body.action === "like") {
    const idea = await prisma.idea.update({
      where: { id: body.ideaId },
      data: { likes: { increment: 1 } },
    });
    return NextResponse.json(idea);
  }

  if (body.action === "comment") {
    const comment = await prisma.ideaComment.create({
      data: {
        text: body.text,
        ideaId: body.ideaId,
        userId: body.userId,
      },
      include: { user: true },
    });

    // Notify idea creator
    const idea = await prisma.idea.findUnique({ where: { id: body.ideaId } });
    if (idea && idea.creatorId !== body.userId) {
      await prisma.notification.create({
        data: {
          type: "idea_comment",
          title: "New Comment on Your Idea",
          body: `Someone commented on "${idea.title}"`,
          userId: idea.creatorId,
        },
      });
    }

    return NextResponse.json(comment);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

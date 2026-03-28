import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      activitiesCreated: {
        select: { id: true, title: true, type: true, status: true, createdAt: true, _count: { select: { participants: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      participants: {
        select: {
          id: true, joinedAt: true,
          activity: { select: { id: true, title: true, type: true, status: true, createdAt: true, creator: { select: { id: true, name: true, avatar: true } } } },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const res = NextResponse.json(user);
  res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
  return res;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(user);
}

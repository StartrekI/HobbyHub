import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      creator: true,
      participants: { include: { user: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { messages: true, participants: true } },
    },
  });

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(activity);
}

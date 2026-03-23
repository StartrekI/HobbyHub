import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const res = NextResponse.json(notifications);
  res.headers.set("Cache-Control", "private, s-maxage=5, stale-while-revalidate=10");
  return res;
}

export async function PATCH(req: NextRequest) {
  const { notificationId, markAll, userId } = await req.json();

  // Batch mark all as read
  if (markAll && userId) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}

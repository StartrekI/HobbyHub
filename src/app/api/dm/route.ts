import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get DM conversations for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const otherId = searchParams.get("otherId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // If otherId provided, get conversation between two users
  if (otherId) {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
      include: { sender: true, receiver: true },
      orderBy: { createdAt: "asc" },
    });

    // Mark as seen
    await prisma.directMessage.updateMany({
      where: { senderId: otherId, receiverId: userId, seen: false },
      data: { seen: true },
    });

    return NextResponse.json(messages);
  }

  // Get all conversation partners
  const sent = await prisma.directMessage.findMany({
    where: { senderId: userId },
    select: { receiverId: true },
    distinct: ["receiverId"],
  });
  const received = await prisma.directMessage.findMany({
    where: { receiverId: userId },
    select: { senderId: true },
    distinct: ["senderId"],
  });

  const partnerIds = [...new Set([
    ...sent.map((s) => s.receiverId),
    ...received.map((r) => r.senderId),
  ])];

  const conversations = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const partner = await prisma.user.findUnique({ where: { id: partnerId } });
      const lastMessage = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { sender: true },
      });
      const unread = await prisma.directMessage.count({
        where: { senderId: partnerId, receiverId: userId, seen: false },
      });
      return { partner, lastMessage, unread };
    })
  );

  return NextResponse.json(conversations);
}

// Send a DM
export async function POST(req: NextRequest) {
  const { senderId, receiverId, text } = await req.json();

  if (!senderId || !receiverId || !text) {
    return NextResponse.json({ error: "senderId, receiverId, and text required" }, { status: 400 });
  }

  // Check if blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: receiverId, blockedId: senderId },
        { blockerId: senderId, blockedId: receiverId },
      ],
    },
  });

  if (blocked) {
    return NextResponse.json({ error: "Cannot send message to this user" }, { status: 403 });
  }

  const message = await prisma.directMessage.create({
    data: { senderId, receiverId, text },
    include: { sender: true, receiver: true },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      type: "chat_message",
      title: "New Message",
      body: `${message.sender.name} sent you a message`,
      userId: receiverId,
      data: JSON.stringify({ senderId }),
    },
  });

  return NextResponse.json(message, { status: 201 });
}

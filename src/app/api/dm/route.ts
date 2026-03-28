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
    const [messages] = await Promise.all([
      prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherId },
            { senderId: otherId, receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          receiver: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      // Mark as seen in parallel
      prisma.directMessage.updateMany({
        where: { senderId: otherId, receiverId: userId, seen: false },
        data: { seen: true },
      }),
    ]);

    return NextResponse.json(messages);
  }

  // Get all conversation partners — single optimized query approach
  // 1. Find all distinct partner IDs from sent and received
  const [sent, received] = await Promise.all([
    prisma.directMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ["receiverId"],
    }),
    prisma.directMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ["senderId"],
    }),
  ]);

  const partnerIds = [...new Set([
    ...sent.map((s) => s.receiverId),
    ...received.map((r) => r.senderId),
  ])];

  if (partnerIds.length === 0) return NextResponse.json([]);

  // 2. Batch-fetch all partner users + unread counts in parallel
  const [partners, unreadCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true, online: true, avatar: true },
    }),
    prisma.directMessage.groupBy({
      by: ["senderId"],
      where: { receiverId: userId, seen: false, senderId: { in: partnerIds } },
      _count: { id: true },
    }),
  ]);

  // 3. Get last message per conversation with a single SQL query (eliminates N+1)
  const lastMessagesRaw: { text: string; createdAt: Date; senderId: string; receiverId: string; senderName: string }[] =
    await prisma.$queryRaw`
      SELECT DISTINCT ON (partner_id)
        dm."text", dm."createdAt", dm."senderId", dm."receiverId", u."name" AS "senderName"
      FROM (
        SELECT *, CASE WHEN "senderId" = ${userId} THEN "receiverId" ELSE "senderId" END AS partner_id
        FROM "DirectMessage"
        WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
      ) dm
      JOIN "User" u ON u.id = dm."senderId"
      ORDER BY partner_id, dm."createdAt" DESC
    `;

  const lastMsgMap = new Map(
    lastMessagesRaw.map((m) => {
      const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
      return [partnerId, { text: m.text, createdAt: m.createdAt, sender: { name: m.senderName } }];
    })
  );

  // Build response
  const partnerMap = new Map(partners.map((p) => [p.id, p]));
  const unreadMap = new Map(unreadCounts.map((u) => [u.senderId, u._count.id]));

  const conversations = partnerIds
    .map((pid) => ({
      partner: partnerMap.get(pid),
      lastMessage: lastMsgMap.get(pid) || null,
      unread: unreadMap.get(pid) || 0,
    }))
    .filter((c) => c.partner)
    .sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

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
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      receiver: { select: { id: true, name: true, avatar: true } },
    },
  });

  // Create notification (non-blocking)
  prisma.notification.create({
    data: {
      type: "chat_message",
      title: "New Message",
      body: `${message.sender.name} sent you a message`,
      userId: receiverId,
      data: JSON.stringify({ senderId }),
    },
  }).catch(() => {});

  return NextResponse.json(message, { status: 201 });
}

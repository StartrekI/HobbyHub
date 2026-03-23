import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Get profile requests for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const requests = await prisma.profileRequest.findMany({
    where: { requestedId: userId },
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

// Send a profile request (connect request)
export async function POST(req: NextRequest) {
  const { requesterId, requestedId } = await req.json();

  if (!requesterId || !requestedId) {
    return NextResponse.json({ error: "requesterId and requestedId required" }, { status: 400 });
  }

  const existing = await prisma.profileRequest.findUnique({
    where: { requesterId_requestedId: { requesterId, requestedId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Request already sent" }, { status: 409 });
  }

  const request = await prisma.profileRequest.create({
    data: { requesterId, requestedId },
    include: { requester: true },
  });

  // Notify the requested user
  await prisma.notification.create({
    data: {
      type: "profile_request",
      title: "Connection Request",
      body: `${request.requester.name} wants to connect with you`,
      userId: requestedId,
      data: JSON.stringify({ requesterId }),
    },
  });

  return NextResponse.json(request, { status: 201 });
}

// Accept/reject a profile request
export async function PATCH(req: NextRequest) {
  const { requestId, status } = await req.json();

  if (!requestId || !["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "requestId and status (accepted/rejected) required" }, { status: 400 });
  }

  const request = await prisma.profileRequest.update({
    where: { id: requestId },
    data: { status },
    include: { requester: true, requested: true },
  });

  if (status === "accepted") {
    await prisma.notification.create({
      data: {
        type: "profile_request",
        title: "Request Accepted",
        body: `${request.requested.name} accepted your connection request`,
        userId: request.requesterId,
      },
    });
  }

  return NextResponse.json(request);
}

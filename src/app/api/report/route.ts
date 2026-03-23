import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { reporterId, reportedId, reason, description } = await req.json();

  if (!reporterId || !reportedId || !reason) {
    return NextResponse.json({ error: "reporterId, reportedId, and reason required" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: { reporterId, reportedId, reason, description: description || "" },
  });

  // Notify the reported user (moderation)
  await prisma.notification.create({
    data: {
      type: "system",
      title: "Report Received",
      body: "A report has been filed. Our team will review it.",
      userId: reportedId,
    },
  });

  return NextResponse.json(report, { status: 201 });
}

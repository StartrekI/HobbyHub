import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseFloat(searchParams.get("radius") || "0.05");

  const excludeId = searchParams.get("excludeId") || "";

  const users = await prisma.user.findMany({
    where: {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, phone, bio, interests, lat, lng,
    role, startupStage, company, title, lookingFor, skills,
    collegeName, graduationYear,
  } = body;

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    user = await prisma.user.update({
      where: { phone },
      data: {
        name, bio,
        interests: JSON.stringify(interests || []),
        lat: lat || 0, lng: lng || 0, online: true,
        role: role || "", startupStage: startupStage || "",
        company: company || "", title: title || "",
        lookingFor: lookingFor || "",
        skills: JSON.stringify(skills || []),
        collegeName: collegeName || "",
        graduationYear: graduationYear || 0,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name, phone,
        bio: bio || "",
        interests: JSON.stringify(interests || []),
        lat: lat || 0, lng: lng || 0, online: true,
        role: role || "", startupStage: startupStage || "",
        company: company || "", title: title || "",
        lookingFor: lookingFor || "",
        skills: JSON.stringify(skills || []),
        collegeName: collegeName || "",
        graduationYear: graduationYear || 0,
      },
    });
  }

  return NextResponse.json(user, { status: 201 });
}

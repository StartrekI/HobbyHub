import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "0.5");
    const excludeId = searchParams.get("excludeId") || "";

    const locationFilter = (lat === 0 && lng === 0) ? {} : {
      lat: { gte: lat - radius, lte: lat + radius },
      lng: { gte: lng - radius, lte: lng + radius },
    };

    const users = await prisma.user.findMany({
      where: {
        ...locationFilter,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      take: 100,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, phone, bio, interests, lat, lng,
      role, startupStage, company, title, lookingFor, skills,
      collegeName, graduationYear,
    } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    if (user) {
      user = await prisma.user.update({
        where: { phone },
        data: {
          name: name || user.name, bio: bio ?? user.bio,
          interests: JSON.stringify(interests || []),
          lat: lat || user.lat, lng: lng || user.lng, online: true,
          role: role ?? "", startupStage: startupStage ?? "",
          company: company ?? "", title: title ?? "",
          lookingFor: lookingFor ?? "",
          skills: JSON.stringify(skills || []),
          collegeName: collegeName ?? "",
          graduationYear: graduationYear || 0,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: name || "Explorer", phone,
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
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create/update user", details: String(error) }, { status: 500 });
  }
}

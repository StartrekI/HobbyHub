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
      email, name, bio, interests, lat, lng, avatar,
      role, startupStage, company, title, lookingFor, skills,
      collegeName, graduationYear,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Only update fields that are actually provided (don't overwrite with defaults)
      const updateData: Record<string, unknown> = {
        name: name || user.name,
        avatar: avatar || user.avatar,
        online: true,
      };
      if (bio !== undefined) updateData.bio = bio;
      if (interests !== undefined) updateData.interests = JSON.stringify(interests);
      if (lat) updateData.lat = lat;
      if (lng) updateData.lng = lng;
      if (role !== undefined) updateData.role = role;
      if (startupStage !== undefined) updateData.startupStage = startupStage;
      if (company !== undefined) updateData.company = company;
      if (title !== undefined) updateData.title = title;
      if (lookingFor !== undefined) updateData.lookingFor = lookingFor;
      if (skills !== undefined) updateData.skills = JSON.stringify(skills);
      if (collegeName !== undefined) updateData.collegeName = collegeName;
      if (graduationYear) updateData.graduationYear = graduationYear;

      user = await prisma.user.update({
        where: { email },
        data: updateData,
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: name || "Explorer", email,
          bio: bio || "", avatar: avatar || "",
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
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to create/update user: ${msg}` }, { status: 500 });
  }
}

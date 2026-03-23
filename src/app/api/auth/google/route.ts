import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: "Missing Google credential" }, { status: 400 });
    }

    // Decode the Google JWT token (base64 payload)
    const payload = JSON.parse(
      Buffer.from(credential.split(".")[1], "base64").toString()
    );

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return NextResponse.json({ error: "No email in Google token" }, { status: 400 });
    }

    // Find by googleId first, then by email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Update existing user with latest Google info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          name: name || user.name,
          avatar: picture || user.avatar,
          online: true,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          googleId: googleId || "",
          name: name || "Explorer",
          avatar: picture || "",
          online: true,
        },
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Authentication failed", details: String(error) }, { status: 500 });
  }
}

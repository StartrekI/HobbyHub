import { NextResponse } from "next/server";

// Socket.io needs a custom server setup outside of Next.js API routes.
// For the full real-time experience, run the standalone socket server (server.ts).
// This route serves as a health check.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Socket.io server runs on port 3003. Start it with: npx tsx src/lib/socket-standalone.ts",
  });
}

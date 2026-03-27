import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Track userId -> Set<socketId> for presence
const userSockets = new Map<string, Set<string>>();
const socketToUser = new Map<string, string>();

// Write presence to DB via the Next.js API
function setPresenceInDB(userId: string, online: boolean) {
  fetch("http://localhost:3000/api/users/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, online }),
  }).catch(() => {});
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // ─── Presence: user comes online ───
  socket.on("user-online", (userId: string) => {
    if (!userId) return;
    socketToUser.set(socket.id, userId);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Broadcast to all other clients instantly
    socket.broadcast.emit("presence-update", { userId, online: true });

    // Also write to DB (backup — client already does this via presence API)
    setPresenceInDB(userId, true);
    console.log(`User ${userId} is now online (${userSockets.get(userId)!.size} connections)`);
  });

  socket.on("join-activity", (activityId: string) => {
    socket.join(`activity:${activityId}`);
    console.log(`${socket.id} joined activity:${activityId}`);
  });

  socket.on("leave-activity", (activityId: string) => {
    socket.leave(`activity:${activityId}`);
  });

  socket.on("new-message", (data: { activityId: string; message: unknown }) => {
    io.to(`activity:${data.activityId}`).emit("message", data.message);
  });

  socket.on("activity-created", (activity: unknown) => {
    io.emit("activity-refresh", activity);
  });

  socket.on("activity-joined", (data: { activityId: string; userId: string }) => {
    io.to(`activity:${data.activityId}`).emit("participant-update", data);
  });

  socket.on("user-location", (data: { userId: string; lat: number; lng: number }) => {
    socket.broadcast.emit("user-moved", data);
  });

  // ─── Presence: user disconnects ───
  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);
    socketToUser.delete(socket.id);

    if (userId) {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        // Only mark offline when ALL tabs/connections are gone
        if (sockets.size === 0) {
          userSockets.delete(userId);
          // Broadcast to all clients instantly
          socket.broadcast.emit("presence-update", { userId, online: false });
          // Write to DB (backup — client sendBeacon also does this)
          setPresenceInDB(userId, false);
          console.log(`User ${userId} is now offline`);
        }
      }
    }

    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

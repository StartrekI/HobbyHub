import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: IOServer | null = null;

export function getIO() {
  return io;
}

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new IOServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/socketio",
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-activity", (activityId: string) => {
      socket.join(`activity:${activityId}`);
    });

    socket.on("leave-activity", (activityId: string) => {
      socket.leave(`activity:${activityId}`);
    });

    socket.on("new-message", (data: { activityId: string; message: unknown }) => {
      io?.to(`activity:${data.activityId}`).emit("message", data.message);
    });

    socket.on("activity-updated", (data: { activityId: string }) => {
      io?.emit("activity-refresh", data);
    });

    socket.on("user-location", (data: { userId: string; lat: number; lng: number }) => {
      socket.broadcast.emit("user-moved", data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

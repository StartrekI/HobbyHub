import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

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

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

import { Server } from "socket.io";
import type { Server as HTTPServer } from "node:http";

export function initSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: [process.env.CORS_ORIGIN!, "http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  });

  io.on("error", (err) => {
    console.log("socket error: ", err);
  });

  io.on("connection", (socket) => {
    console.log(`${socket.id}: connected`);

    socket.on("chat message", (arg) => {
      console.log("chat message: ", arg);
    });
  });

  return io;
}

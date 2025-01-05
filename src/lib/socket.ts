import { Server } from "socket.io";

export function initSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*",
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

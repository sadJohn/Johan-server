import { Hono } from "hono";
import { API_VERSION } from "./constants";
import authRouter from "./routes/auth";
import { cors } from "hono/cors";
import { errorHandler } from "./lib/error-handler";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./lib/socket";

const app = new Hono<{
  Variables: {
    io: Server;
  };
}>().basePath("/api");

const socketServer = createServer(app.fetch as any);
const io = initSocket(socketServer);
socketServer.listen(process.env.SOCKET_PORT || 4000);

app.use(async (c, next) => {
  c.set("io", io);
  await next();
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN!,
    credentials: true,
  })
);

app.route(`/${API_VERSION}/auth`, authRouter);

app.onError(errorHandler);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};

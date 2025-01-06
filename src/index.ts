import "dotenv/config";
import { Hono } from "hono";
import { API_VERSION } from "./constants";
import authRouter from "./routes/auth";
import { cors } from "hono/cors";
import { errorHandler } from "./lib/error-handler";
import { Server } from "socket.io";
import { initSocket } from "./lib/socket";
import { serve } from "@hono/node-server";

const app = new Hono<{
  Variables: {
    io: Server;
  };
}>().basePath("/api");

const httpServer = serve({
  fetch: app.fetch,
  port: 8000,
});

const io = initSocket(httpServer);

app.use(async (c, next) => {
  c.set("io", io);
  await next();
});

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN!, "http://localhost:3000"],
    credentials: true,
  })
);

app.route(`/${API_VERSION}/auth`, authRouter);

app.onError(errorHandler);

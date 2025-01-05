import { Hono } from "hono";
import { API_VERSION } from "./constants";
import authRouter from "./routes/auth";
import { cors } from "hono/cors";
import { errorHandler } from "./lib/error-handler";

const app = new Hono().basePath("/api");

app.use(
  "/*",
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

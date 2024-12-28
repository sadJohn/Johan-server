import { Hono } from "hono";
import { db } from "./db";
import { usersTable } from "./db/schema";

const app = new Hono();

app.get("/", async (c) => {
  const users = await db.select().from(usersTable);
  return c.json(users);
});

export default app;

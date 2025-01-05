import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  registerSchema,
  loginSchema,
  userTable,
  selectUserSchema,
} from "../db/schema/user";
import {
  invalidateSession,
  getSessionCookie,
  validateSessionToken,
} from "@/lib/auth";
import { getCookie } from "hono/cookie";
import { AUTH_MODE, JOHAN_AUTH_SESSION } from "@/constants";
import * as bcrypt from "bcryptjs";
import { JohanAuthErr, JohanBadRequestErr } from "@/lib/error";
import { globalGETRateLimit, globalPOSTRateLimit } from "@/lib/request";
import { Server } from "socket.io";

const authRouter = new Hono<{
  Variables: {
    io: Server;
  };
}>();

authRouter.post(
  "/register",
  zValidator("json", registerSchema, (result) => {
    if (!result.success) {
      throw new JohanBadRequestErr();
    }
  }),
  async (c) => {
    if (!globalPOSTRateLimit(c)) {
      throw new JohanBadRequestErr("Too many requests");
    }
    const user = c.req.valid("json");

    if (!user.email || !user.password) {
      throw new JohanBadRequestErr();
    }

    const result = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, user.email));

    if (result.length) {
      throw new JohanBadRequestErr();
    }

    user.password = await bcrypt.hash(user.password, 10);

    const newUser = (
      await db.insert(userTable).values(user).returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        age: userTable.age,
        picture: userTable.picture,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
    )[0];

    const { sessionToken, session } = await getSessionCookie(newUser.id);

    return c.json({
      message: "success",
      data: newUser,
      session: { ...session, sessionToken },
    });
  }
);

authRouter.post(
  "/login",
  zValidator("json", loginSchema, (result) => {
    if (!result.success) {
      console.log(result.error);
      throw result.error;
    }
  }),
  async (c) => {
    if (!globalPOSTRateLimit(c)) {
      throw new JohanBadRequestErr("Too many requests");
    }
    const user = c.req.valid("json");

    if (user.mode === AUTH_MODE.GITHUB) {
      const result = (
        await db
          .select()
          .from(userTable)
          .where(eq(userTable.githubId, user.githubId))
      )[0];

      if (!result) {
        const newUser = (
          await db.insert(userTable).values(user).returning({
            id: userTable.id,
            email: userTable.email,
            username: userTable.username,
            age: userTable.age,
            picture: userTable.picture,
            createdAt: userTable.createdAt,
            updatedAt: userTable.updatedAt,
          })
        )[0];

        const { sessionToken, session } = await getSessionCookie(newUser.id);

        return c.json({
          message: "success",
          session: { ...session, sessionToken },
        });
      }

      const { sessionToken, session } = await getSessionCookie(result.id);

      return c.json({
        message: "success",
        session: { ...session, sessionToken },
      });
    }

    if (user.mode === AUTH_MODE.GOOGLE) {
      const result = (
        await db
          .select()
          .from(userTable)
          .where(eq(userTable.googleId, user.googleId))
      )[0];

      if (!result) {
        const newUser = (
          await db.insert(userTable).values(user).returning({
            id: userTable.id,
            email: userTable.email,
            username: userTable.username,
            age: userTable.age,
            picture: userTable.picture,
            createdAt: userTable.createdAt,
            updatedAt: userTable.updatedAt,
          })
        )[0];

        const { sessionToken, session } = await getSessionCookie(newUser.id);

        return c.json({
          message: "success",
          session: { ...session, sessionToken },
        });
      }

      const { sessionToken, session } = await getSessionCookie(result.id);

      return c.json({
        message: "success",
        session: { ...session, sessionToken },
      });
    }

    if (!user.email || !user.password) {
      throw new JohanBadRequestErr();
    }

    const result = (
      await db.select().from(userTable).where(eq(userTable.email, user.email))
    )[0];

    if (!result) {
      throw new JohanBadRequestErr();
    }

    const checkPassword = bcrypt.compareSync(
      user.password,
      result.password || ""
    );

    if (user.password && !checkPassword) {
      throw new JohanBadRequestErr();
    }

    const { sessionToken, session } = await getSessionCookie(result.id);

    return c.json({
      message: "success",
      data: selectUserSchema.safeParse(result),
      session: { ...session, sessionToken },
    });
  }
);

authRouter.get("/token", async (c) => {
  const io = c.get("io");
  io.emit("get user", "get user socket from server!");
  if (!globalGETRateLimit(c)) {
    throw new JohanBadRequestErr("Too many requests");
  }
  const sessionId =
    c.req.query("sessionId") || getCookie(c, JOHAN_AUTH_SESSION);

  if (sessionId === undefined) {
    throw new JohanAuthErr();
  }
  const result = await validateSessionToken(sessionId);
  if (!result.session) {
    throw new JohanAuthErr();
  }
  return c.json({ message: "success", data: result.user });
});

authRouter.get("/logout", async (c) => {
  if (!globalGETRateLimit(c)) {
    throw new JohanBadRequestErr("Too many requests");
  }
  const sessionId =
    c.req.query("sessionId") || getCookie(c, JOHAN_AUTH_SESSION);

  if (sessionId === undefined) {
    throw new JohanAuthErr();
  }
  const result = await validateSessionToken(sessionId);
  if (!result.session) {
    throw new JohanAuthErr();
  }
  await invalidateSession(result.session.id);
  return c.json({ message: "success" });
});

export default authRouter;

import { zValidator } from '@hono/zod-validator'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { Server } from 'socket.io'

import { AUTH_MODE } from '@/constants'
import { JohanBadRequestErr } from '@/lib/error'
import { globalPOSTRateLimit } from '@/lib/request'

import { db } from '../db'
import { loginSchema, registerSchema, userTable } from '../db/schema/user'

const authRouter = new Hono<{
  Variables: {
    io: Server
  }
}>()

authRouter.post(
  '/register',
  zValidator('json', registerSchema, (result) => {
    if (!result.success) {
      throw new JohanBadRequestErr()
    }
  }),
  async (c) => {
    if (!globalPOSTRateLimit(c)) {
      throw new JohanBadRequestErr('Too many requests')
    }
    const user = c.req.valid('json')

    if (!user.email || !user.password) {
      throw new JohanBadRequestErr()
    }

    const result = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, user.email))

    if (result.length) {
      throw new JohanBadRequestErr()
    }

    user.password = await bcrypt.hash(user.password, 10)

    const newUser = (
      await db.insert(userTable).values(user).returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        age: userTable.age,
        picture: userTable.picture,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt
      })
    )[0]

    return c.json({
      message: 'success',
      data: newUser.id
    })
  }
)

authRouter.post(
  '/login',
  zValidator('json', loginSchema, (result) => {
    if (!result.success) {
      console.log(result.error)
      throw result.error
    }
  }),
  async (c) => {
    if (!globalPOSTRateLimit(c)) {
      throw new JohanBadRequestErr('Too many requests')
    }
    const user = c.req.valid('json')

    if (user.mode === AUTH_MODE.EMAIL) {
      if (!user.email || !user.password) {
        throw new JohanBadRequestErr()
      }

      const result = (
        await db.select().from(userTable).where(eq(userTable.email, user.email))
      )[0]
      if (!result) {
        throw new JohanBadRequestErr()
      }

      const checkPassword = bcrypt.compareSync(
        user.password,
        result.password || ''
      )

      if (user.password && !checkPassword) {
        throw new JohanBadRequestErr()
      }

      return c.json({
        message: 'success',
        data: result.id
      })
    }

    let result
    if (user.mode === AUTH_MODE.GITHUB) {
      result = (
        await db
          .select()
          .from(userTable)
          .where(eq(userTable.githubId, user.githubId))
      )[0]
    }
    if (user.mode === AUTH_MODE.GOOGLE) {
      result = (
        await db
          .select()
          .from(userTable)
          .where(eq(userTable.googleId, user.googleId))
      )[0]
    }

    if (!result) {
      const newUser = (
        await db.insert(userTable).values(user).returning({
          id: userTable.id,
          email: userTable.email,
          username: userTable.username,
          age: userTable.age,
          picture: userTable.picture,
          createdAt: userTable.createdAt,
          updatedAt: userTable.updatedAt
        })
      )[0]

      return c.json({
        message: 'success',
        data: newUser.id
      })
    }

    return c.json({
      message: 'success',
      data: result.id
    })
  }
)

export default authRouter

import { zValidator } from '@hono/zod-validator'
import { count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '@/db'
import { userTable } from '@/db/schema'
import { followInsertSchema, followTable } from '@/db/schema/follow'
import cloudinary from '@/lib/cloudinary'
import { JohanBadRequestErr } from '@/lib/error'

const profileRouter = new Hono()

profileRouter.post(
  '/avatar',
  zValidator(
    'json',
    z.object({
      id: z.number(),
      pictureId: z.string().nullable(),
      avatar: z.string()
    }),
    (result) => {
      if (!result.success) {
        throw result.error
      }
    }
  ),
  async (c) => {
    const user = c.req.valid('json')

    if (user.pictureId) {
      await cloudinary.uploader.destroy(user.pictureId)
    }

    const uploadResult = await cloudinary.uploader.upload(user.avatar)

    await db
      .update(userTable)
      .set({
        pictureId: uploadResult.public_id,
        picture: uploadResult.secure_url
      })
      .where(eq(userTable.id, user.id))

    return c.json({ message: 'success' })
  }
)

const paginationSchema = z.object({
  limit: z.coerce.number().default(10),
  offset: z.coerce.number().default(0)
})

profileRouter.get(
  '/followers/:userId',
  zValidator('param', z.object({ userId: z.coerce.number() }), (result) => {
    if (!result.success) {
      throw new JohanBadRequestErr()
    }
  }),
  zValidator('query', paginationSchema, (result) => {
    if (!result.success) {
      throw new JohanBadRequestErr()
    }
  }),
  async (c) => {
    const { userId } = c.req.valid('param')
    const { limit, offset } = c.req.valid('query')

    const sq = db
      .select()
      .from(followTable)
      .where(eq(followTable.followingId, userId))
      .limit(limit)
      .offset(offset)
      .as('sq')
    const result = await db
      .select()
      .from(userTable)
      .innerJoin(sq, eq(userTable.id, sq.userId))

    return c.json({ message: 'success', data: result })
  }
)

profileRouter.get(
  '/followers/:userId/count',
  zValidator('param', z.object({ userId: z.coerce.number() }), (result) => {
    if (!result.success) {
      throw new JohanBadRequestErr()
    }
  }),
  async (c) => {
    const { userId } = c.req.valid('param')

    const result = await db
      .select({ count: count() })
      .from(followTable)
      .where(eq(followTable.followingId, userId))

    return c.json({ message: 'success', data: result[0] })
  }
)

profileRouter
  .get(
    '/following/:userId',
    zValidator('param', z.object({ userId: z.coerce.number() }), (result) => {
      console.log(result)
      if (!result.success) {
        throw new JohanBadRequestErr()
      }
    }),
    zValidator('query', paginationSchema, (result) => {
      if (!result.success) {
        throw new JohanBadRequestErr()
      }
    }),
    async (c) => {
      const { userId } = c.req.valid('param')
      const { limit, offset } = c.req.valid('query')

      const sq = db
        .select()
        .from(followTable)
        .where(eq(followTable.userId, userId))
        .limit(limit)
        .offset(offset)
        .as('sq')
      const result = await db
        .select({
          user: userTable
        })
        .from(userTable)
        .innerJoin(sq, eq(userTable.id, sq.followingId))

      return c.json({ message: 'success', data: result })
    }
  )
  .get(
    '/following/:userId/count',
    zValidator('param', z.object({ userId: z.coerce.number() }), (result) => {
      if (!result.success) {
        throw new JohanBadRequestErr()
      }
    }),
    async (c) => {
      const { userId } = c.req.valid('param')

      const result = await db
        .select({ count: count() })
        .from(followTable)
        .where(eq(followTable.userId, userId))

      return c.json({ message: 'success', data: result[0] })
    }
  )

profileRouter.post(
  '/following',
  zValidator('json', followInsertSchema, (result) => {
    if (!result.success) {
      throw new JohanBadRequestErr()
    }
  }),
  async (c) => {
    const follow = c.req.valid('json')
    await db.insert(followTable).values(follow)

    return c.json({ message: 'success' })
  }
)

export default profileRouter

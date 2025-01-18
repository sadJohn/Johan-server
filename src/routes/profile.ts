import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '@/db'
import { userTable } from '@/db/schema'
import cloudinary from '@/lib/cloudinary'

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

export default profileRouter

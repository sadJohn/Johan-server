import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '@/db'
import { userTable } from '@/db/schema'
import { sessionInsertSchema, sessionTable } from '@/db/schema/session'

const sessionRouter = new Hono()

sessionRouter.post(
  '/',
  zValidator('json', sessionInsertSchema, (result) => {
    console.log(result)
    if (!result.success) {
      throw result.error
    }
  }),
  async (c) => {
    const session = c.req.valid('json')

    const newSession = await db
      .insert(sessionTable)
      .values({
        ...session,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      })
      .returning()

    return c.json({ message: 'success', data: newSession })
  }
)

sessionRouter.get('/validate/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')

  const result = await db
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId))
  if (result.length < 1) {
    return c.json({ message: 'success', data: { session: null, user: null } })
  }
  const { user, session } = result[0]
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionTable).where(eq(sessionTable.id, session.id))
    return c.json({ message: 'success', data: { session: null, user: null } })
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    await db
      .update(sessionTable)
      .set({
        expiresAt: session.expiresAt
      })
      .where(eq(sessionTable.id, session.id))
  }
  return c.json({ message: 'success', data: { session, user } })
})

sessionRouter.delete('/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')

  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId))
  return c.json({ message: 'success' })
})

export default sessionRouter

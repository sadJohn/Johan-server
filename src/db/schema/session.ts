import { InferSelectModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { userTable } from './user'

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date'
  }).notNull()
})

export const sessionInsertSchema = createInsertSchema(sessionTable).pick({
  id: true,
  userId: true
})

export type Session = InferSelectModel<typeof sessionTable>

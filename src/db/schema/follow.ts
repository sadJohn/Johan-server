import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { userTable } from './user'

export const followTable = pgTable(
  'follow',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    followingId: integer('following_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => {
    return [
      {
        pk: primaryKey({ columns: [table.userId, table.followingId] }),
        pkWithCustomName: primaryKey({
          name: 'user_to_following',
          columns: [table.userId, table.followingId]
        })
      }
    ]
  }
)

export const followInsertSchema = createInsertSchema(followTable)

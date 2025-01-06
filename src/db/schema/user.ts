import { InferSelectModel } from 'drizzle-orm'
import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { AUTH_MODE } from '@/constants'

export const userTable = pgTable('user', {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 20 }).notNull(),
  email: varchar({ length: 255 }).unique(),
  password: varchar({ length: 255 }),
  age: integer(),
  picture: varchar({ length: 255 }),
  githubId: integer().unique(),
  googleId: integer().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date())
})

export const registerSchema = createInsertSchema(userTable, {
  username: (schema) => schema.min(1).max(20),
  email: (schema) => schema.email().toLowerCase(),
  password: (schema) => schema.min(6).max(20)
})

export const baseSchema = createInsertSchema(userTable, {
  username: (schema) => schema.min(1).max(20).optional(),
  email: (schema) => schema.email(),
  password: (schema) => schema.min(6).max(20),
  picture: (schema) => schema.optional(),
  githubId: (schema) => schema.optional()
})
  .pick({
    email: true,
    password: true,
    githubId: true,
    googleId: true,
    username: true,
    picture: true
  })
  .extend({
    mode: z.enum([AUTH_MODE.EMAIL, AUTH_MODE.GITHUB])
  })

export const loginSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal(AUTH_MODE.EMAIL),
    email: baseSchema.shape.email.unwrap(),
    password: baseSchema.shape.password.unwrap()
  }),
  z.object({
    mode: z.literal(AUTH_MODE.GITHUB),
    githubId: baseSchema.shape.githubId.unwrap().unwrap(),
    username: baseSchema.shape.username.unwrap(),
    picture: baseSchema.shape.picture
  }),
  z.object({
    mode: z.literal(AUTH_MODE.GOOGLE),
    googleId: baseSchema.shape.googleId.unwrap().unwrap(),
    username: baseSchema.shape.username.unwrap(),
    picture: baseSchema.shape.picture
  })
])

export const selectUserSchema = createInsertSchema(userTable).pick({
  id: true,
  email: true,
  username: true,
  age: true,
  picture: true,
  createdAt: true,
  updatedAt: true
})

export type InsertUserModal = z.infer<typeof registerSchema>
export type User = InferSelectModel<typeof userTable>

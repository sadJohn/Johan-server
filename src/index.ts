import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Server as HTTPServer } from 'node:http'
import { Server } from 'socket.io'

import { API_VERSION } from './constants'
import { errorHandler } from './lib/error-handler'
import { initSocket } from './lib/socket'
import authRouter from './routes/auth'
import sessionRouter from './routes/session'

const app = new Hono<{
  Variables: {
    io: Server
  }
}>().basePath('/api')

const httpServer = serve({
  fetch: app.fetch,
  port: 8000
})

const io = initSocket(httpServer as HTTPServer)

app.use(async (c, next) => {
  c.set('io', io)
  await next()
})

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN!, 'http://localhost:3000'],
    credentials: true
  })
)

app.route(`/${API_VERSION}/auth`, authRouter)
app.route(`/${API_VERSION}/session`, sessionRouter)

app.onError(errorHandler)

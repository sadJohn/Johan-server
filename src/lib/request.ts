import { Context } from "hono";
import { TokenBucket } from "./rate-limit";

export const globalBucket = new TokenBucket<string>(100, 1);

const getIp = (c: Context) => {
  const forwardedFor = c.req.header("X-Forwarded-For");
  const realIp = c.req.header("X-Real-Ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return null;
};

export function globalGETRateLimit(c: Context): boolean {
  const clientIP = getIp(c);
  if (!clientIP) {
    return true;
  }
  return globalBucket.consume(clientIP, 1);
}

export function globalPOSTRateLimit(c: Context): boolean {
  const clientIP = getIp(c);
  if (!clientIP) {
    return true;
  }
  return globalBucket.consume(clientIP, 3);
}

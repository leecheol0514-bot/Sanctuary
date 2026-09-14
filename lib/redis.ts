import { Redis } from "@upstash/redis";

// 포켓몬 거래소 전용 Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_TRADE_URL ?? "",
  token: process.env.UPSTASH_REDIS_TRADE_TOKEN ?? "",
});

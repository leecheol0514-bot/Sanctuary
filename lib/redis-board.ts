import { Redis } from "@upstash/redis";

// 자유게시판 전용 Redis
export const redisBoard = new Redis({
  url: process.env.UPSTASH_REDIS_BOARD_URL ?? "",
  token: process.env.UPSTASH_REDIS_BOARD_TOKEN ?? "",
});

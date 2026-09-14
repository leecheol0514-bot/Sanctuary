import { redisTrade } from "./redis";
import type { ChatThread, TradePost, Notice } from "./types";

// ─── Redis 키 규칙 ────────────────────────────────────────
// trade:posts:all        → sorted set (score=createdAt, member=postId)
// trade:post:{id}        → hash (TradePost 객체 JSON)
// trade:thread:{id}      → hash (ChatThread 객체 JSON)
// trade:threads:post:{postId}   → set (threadId 목록)
// trade:threads:user:{userId}   → set (threadId 목록)
// trade:notices:all      → sorted set
// trade:notice:{id}      → hash

const POSTS_KEY = "trade:posts:all";
const postKey = (id: string) => `trade:post:${id}`;
const threadKey = (id: string) => `trade:thread:${id}`;
const threadsByPostKey = (postId: string) => `trade:threads:post:${postId}`;
const threadsByUserKey = (userId: string) => `trade:threads:user:${userId}`;
const NOTICES_KEY = "trade:notices:all";
const noticeKey = (id: string) => `trade:notice:${id}`;

// ─── Posts ───────────────────────────────────────────────
export async function getAllTradePosts(): Promise<TradePost[]> {
  const ids = await redisTrade.zrange<string[]>(POSTS_KEY, 0, -1, { rev: true });
  if (!ids || ids.length === 0) return [];

  const posts = await Promise.all(
    ids.map(async (id) => {
      const raw = await redisTrade.get<TradePost>(postKey(id));
      return raw ?? null;
    }),
  );
  return posts.filter((p): p is TradePost => p !== null);
}

export async function getTradePost(id: string): Promise<TradePost | null> {
  return redisTrade.get<TradePost>(postKey(id));
}

export async function createTradePost(
  data: Omit<TradePost, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<TradePost> {
  const post: TradePost = {
    id: crypto.randomUUID(),
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...data,
  };
  await redisTrade.set(postKey(post.id), post);
  await redisTrade.zadd(POSTS_KEY, { score: post.createdAt, member: post.id });
  return post;
}

export async function updateTradePostStatus(
  id: string,
  status: TradePost["status"],
): Promise<TradePost | null> {
  const post = await getTradePost(id);
  if (!post) return null;
  const updated = { ...post, status, updatedAt: Date.now() };
  await redisTrade.set(postKey(id), updated);
  return updated;
}

export async function deleteTradePost(id: string): Promise<void> {
  await redisTrade.del(postKey(id));
  await redisTrade.zrem(POSTS_KEY, id);
}

// ─── Threads ─────────────────────────────────────────────
export async function getThread(id: string): Promise<ChatThread | null> {
  return redisTrade.get<ChatThread>(threadKey(id));
}

export async function getThreadsByPost(postId: string): Promise<ChatThread[]> {
  const ids = await redisTrade.smembers<string[]>(threadsByPostKey(postId));
  if (!ids || ids.length === 0) return [];
  const threads = await Promise.all(ids.map((id) => redisTrade.get<ChatThread>(threadKey(id))));
  return threads
    .filter((t): t is ChatThread => t !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getThreadsByMember(memberId: string): Promise<ChatThread[]> {
  const ids = await redisTrade.smembers<string[]>(threadsByUserKey(memberId));
  if (!ids || ids.length === 0) return [];
  const threads = await Promise.all(ids.map((id) => redisTrade.get<ChatThread>(threadKey(id))));
  return threads
    .filter((t): t is ChatThread => t !== null)
    .sort((a, b) => {
      const aLast = a.messages.at(-1)?.createdAt ?? a.createdAt;
      const bLast = b.messages.at(-1)?.createdAt ?? b.createdAt;
      return bLast - aLast;
    });
}

export async function findOrCreateThread(
  postId: string,
  initiator: { id: string; nickname: string },
  postAuthor: { id: string; nickname: string },
): Promise<ChatThread> {
  const existingIds = await redisTrade.smembers<string[]>(threadsByPostKey(postId));
  for (const id of existingIds ?? []) {
    const t = await redisTrade.get<ChatThread>(threadKey(id));
    if (
      t &&
      t.participants.some((p) => p.id === initiator.id) &&
      t.participants.some((p) => p.id === postAuthor.id)
    ) {
      return t;
    }
  }

  const thread: ChatThread = {
    id: crypto.randomUUID(),
    postId,
    participants: [initiator, postAuthor],
    messages: [],
    dealStatus: "none",
    createdAt: Date.now(),
  };

  await redisTrade.set(threadKey(thread.id), thread);
  await redisTrade.sadd(threadsByPostKey(postId), thread.id);
  await redisTrade.sadd(threadsByUserKey(initiator.id), thread.id);
  await redisTrade.sadd(threadsByUserKey(postAuthor.id), thread.id);

  return thread;
}

export async function addMessage(
  threadId: string,
  message: Omit<ChatThread["messages"][number], "id" | "createdAt">,
): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread) return null;

  const updated: ChatThread = {
    ...thread,
    messages: [
      ...thread.messages,
      { id: crypto.randomUUID(), createdAt: Date.now(), ...message },
    ],
  };
  await redisTrade.set(threadKey(threadId), updated);
  return updated;
}

export async function proposeDeal(
  threadId: string,
  proposerId: string,
): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread || thread.dealStatus !== "none") return thread ?? null;

  const updated: ChatThread = { ...thread, dealStatus: "proposed", dealProposedBy: proposerId };
  await redisTrade.set(threadKey(threadId), updated);
  return updated;
}

export async function acceptDeal(threadId: string): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread || thread.dealStatus !== "proposed") return null;

  const updated: ChatThread = {
    ...thread,
    dealStatus: "confirmed",
    dealConfirmedAt: Date.now(),
  };
  await redisTrade.set(threadKey(threadId), updated);
  await updateTradePostStatus(thread.postId, "confirmed");
  return updated;
}

export async function rejectDeal(threadId: string): Promise<ChatThread | null> {
  const thread = await getThread(threadId);
  if (!thread || thread.dealStatus !== "proposed") return null;

  const updated: ChatThread = {
    ...thread,
    dealStatus: "none",
    dealProposedBy: undefined,
  };
  await redisTrade.set(threadKey(threadId), updated);
  return updated;
}

// ─── 공지 ────────────────────────────────────────────────
export async function getNotices(): Promise<Notice[]> {
  const ids = await redisTrade.zrange<string[]>(NOTICES_KEY, 0, -1, { rev: true });
  if (!ids || ids.length === 0) return [];
  const items = await Promise.all(ids.map((id) => redisTrade.get<Notice>(noticeKey(id))));
  return items.filter((n): n is Notice => n !== null);
}

export async function createNotice(content: string): Promise<Notice> {
  const notice: Notice = { id: crypto.randomUUID(), content, createdAt: Date.now() };
  await redisTrade.set(noticeKey(notice.id), notice);
  await redisTrade.zadd(NOTICES_KEY, { score: notice.createdAt, member: notice.id });
  return notice;
}

export async function deleteNotice(id: string): Promise<void> {
  await redisTrade.del(noticeKey(id));
  await redisTrade.zrem(NOTICES_KEY, id);
}

// ─── 통계 ────────────────────────────────────────────────
export async function getTradeStats() {
  const posts = await getAllTradePosts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  return {
    totalPosts: posts.length,
    openPosts: posts.filter((p) => p.status === "open").length,
    confirmedPosts: posts.filter((p) => p.status === "confirmed").length,
    todayPosts: posts.filter((p) => p.createdAt >= todayTs).length,
  };
}

export async function getAllThreads(): Promise<ChatThread[]> {
  const posts = await getAllTradePosts();
  const allThreads: ChatThread[] = [];
  for (const post of posts) {
    const threads = await getThreadsByPost(post.id);
    allThreads.push(...threads);
  }
  return allThreads.sort((a, b) => {
    const aLast = a.messages.at(-1)?.createdAt ?? a.createdAt;
    const bLast = b.messages.at(-1)?.createdAt ?? b.createdAt;
    return bLast - aLast;
  });
}

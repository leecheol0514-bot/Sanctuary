import { redisBoard } from "./redis-board";
import type { BoardPost, BoardComment } from "./types";

// ─── Redis 키 규칙 ────────────────────────────────────────
// board:posts:all       → sorted set (score=createdAt, member=postId)
// board:post:{id}       → hash (BoardPost 객체 JSON)
// board:comments:{postId} → sorted set (score=createdAt, member=commentId)
// board:comment:{id}    → hash (BoardComment 객체 JSON)
// board:likes:{postId}  → set (userId 목록)

const BOARD_POSTS_KEY = "board:posts:all";
const boardPostKey = (id: string) => `board:post:${id}`;
const boardCommentsKey = (postId: string) => `board:comments:${postId}`;
const boardCommentKey = (id: string) => `board:comment:${id}`;
const boardLikesKey = (postId: string) => `board:likes:${postId}`;

// ─── Board Posts ─────────────────────────────────────────
export async function getAllBoardPosts(): Promise<BoardPost[]> {
  const ids = await redisBoard.zrange<string[]>(BOARD_POSTS_KEY, 0, -1, { rev: true });
  if (!ids || ids.length === 0) return [];

  const posts = await Promise.all(
    ids.map(async (id) => {
      const raw = await redisBoard.get<BoardPost>(boardPostKey(id));
      return raw ?? null;
    }),
  );
  return posts.filter((p): p is BoardPost => p !== null);
}

export async function getBoardPost(id: string): Promise<BoardPost | null> {
  return redisBoard.get<BoardPost>(boardPostKey(id));
}

export async function createBoardPost(
  data: Omit<BoardPost, "id" | "likeCount" | "commentCount" | "createdAt" | "updatedAt">,
): Promise<BoardPost> {
  const post: BoardPost = {
    id: crypto.randomUUID(),
    likeCount: 0,
    commentCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...data,
  };
  await redisBoard.set(boardPostKey(post.id), post);
  await redisBoard.zadd(BOARD_POSTS_KEY, { score: post.createdAt, member: post.id });
  return post;
}

export async function deleteBoardPost(id: string): Promise<void> {
  await redisBoard.del(boardPostKey(id));
  await redisBoard.zrem(BOARD_POSTS_KEY, id);
  // 댓글도 함께 삭제
  const commentIds = await redisBoard.zrange<string[]>(boardCommentsKey(id), 0, -1);
  if (commentIds && commentIds.length > 0) {
    await Promise.all(commentIds.map((cid) => redisBoard.del(boardCommentKey(cid))));
    await redisBoard.del(boardCommentsKey(id));
  }
  await redisBoard.del(boardLikesKey(id));
}

// ─── Comments ────────────────────────────────────────────
export async function getComments(postId: string): Promise<BoardComment[]> {
  const ids = await redisBoard.zrange<string[]>(boardCommentsKey(postId), 0, -1);
  if (!ids || ids.length === 0) return [];

  const comments = await Promise.all(
    ids.map(async (id) => {
      const raw = await redisBoard.get<BoardComment>(boardCommentKey(id));
      return raw ?? null;
    }),
  );
  return comments.filter((c): c is BoardComment => c !== null);
}

export async function addComment(
  postId: string,
  data: Omit<BoardComment, "id" | "postId" | "createdAt">,
): Promise<BoardComment> {
  const comment: BoardComment = {
    id: crypto.randomUUID(),
    postId,
    createdAt: Date.now(),
    ...data,
  };

  await redisBoard.set(boardCommentKey(comment.id), comment);
  await redisBoard.zadd(boardCommentsKey(postId), { score: comment.createdAt, member: comment.id });

  // 게시글의 댓글 카운트 증가
  const post = await getBoardPost(postId);
  if (post) {
    const updated = { ...post, commentCount: post.commentCount + 1, updatedAt: Date.now() };
    await redisBoard.set(boardPostKey(postId), updated);
  }

  return comment;
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  await redisBoard.del(boardCommentKey(commentId));
  await redisBoard.zrem(boardCommentsKey(postId), commentId);

  // 게시글의 댓글 카운트 감소
  const post = await getBoardPost(postId);
  if (post) {
    const updated = {
      ...post,
      commentCount: Math.max(0, post.commentCount - 1),
      updatedAt: Date.now(),
    };
    await redisBoard.set(boardPostKey(postId), updated);
  }
}

// ─── Likes ───────────────────────────────────────────────
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const key = boardLikesKey(postId);
  const isMember = await redisBoard.sismember(key, userId);

  if (isMember) {
    // 좋아요 취소
    await redisBoard.srem(key, userId);
    const post = await getBoardPost(postId);
    if (post) {
      const updated = {
        ...post,
        likeCount: Math.max(0, post.likeCount - 1),
        updatedAt: Date.now(),
      };
      await redisBoard.set(boardPostKey(postId), updated);
    }
    return false;
  } else {
    // 좋아요 추가
    await redisBoard.sadd(key, userId);
    const post = await getBoardPost(postId);
    if (post) {
      const updated = { ...post, likeCount: post.likeCount + 1, updatedAt: Date.now() };
      await redisBoard.set(boardPostKey(postId), updated);
    }
    return true;
  }
}

export async function hasLiked(postId: string, userId: string): Promise<boolean> {
  return (await redisBoard.sismember(boardLikesKey(postId), userId)) === 1;
}

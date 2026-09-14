"use client";

import type { BoardPost, BoardComment } from "@/lib/types";
import { formatTime, getStoredUser } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [post, setPost] = useState<BoardPost | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/");
      return;
    }
    setUser(u);
  }, [router]);

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/board/${postId}`);
    const data = await res.json();
    if (res.ok) setPost(data.post);
  }, [postId]);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/board/${postId}/comments`);
    const data = await res.json();
    if (res.ok) setComments(data.comments);
  }, [postId]);

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchPost, fetchComments]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/board/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: user.id,
          authorNickname: user.nickname,
          content: commentText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setComments((prev) => [...prev, json.comment]);
      setCommentText("");
      fetchPost(); // 댓글 수 업데이트
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike() {
    if (!user) return;
    await fetch(`/api/board/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    fetchPost();
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
        <p className="text-center text-sm text-slate-400 py-12">불러오는 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
        <p className="text-center text-sm text-slate-400 py-12">게시글을 찾을 수 없어요.</p>
        <Link href="/free-board" className="btn-primary w-full mt-4">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24">
      {/* 헤더 */}
      <header className="mb-6 flex items-center gap-3">
        <Link href="/free-board" className="text-2xl">
          ←
        </Link>
        <h1 className="text-xl font-bold text-slate-800">게시글</h1>
      </header>

      {/* 게시글 */}
      <div className="card space-y-3 mb-6">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-slate-700">{post.authorNickname}</span>
          <span className="text-xs text-slate-400 shrink-0">{formatTime(post.createdAt)}</span>
        </div>

        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{post.content}</p>

        {post.images && post.images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {post.images.map((url) => (
              <img
                key={url}
                src={url}
                alt="첨부 이미지"
                className="max-h-64 rounded-xl object-cover border border-slate-100 cursor-pointer"
                onClick={() => window.open(url, "_blank")}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1 text-sm">
          <button
            type="button"
            className="flex items-center gap-1 text-slate-500 hover:text-poke-red"
            onClick={handleLike}
          >
            ❤️ {post.likeCount}
          </button>
          <span className="flex items-center gap-1 text-slate-500">💬 {post.commentCount}</span>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-slate-600">
          댓글 {comments.length}개
        </h2>
        {comments.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">
            첫 댓글을 남겨보세요!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {comment.authorNickname}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 댓글 입력 */}
      <form onSubmit={handleSubmitComment} className="card space-y-3">
        <textarea
          className="input min-h-20 resize-none"
          placeholder="댓글을 입력하세요..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "등록 중..." : "댓글 달기"}
        </button>
      </form>
    </div>
  );
}

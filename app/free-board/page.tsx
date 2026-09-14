"use client";

import { ImageUpload } from "@/components/ImageUpload";
import type { BoardPost, BoardComment } from "@/lib/types";
import { formatTime, getStoredUser } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FreeBoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/");
      return;
    }
    setUser(u);
  }, [router]);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/board");
    const data = await res.json();
    if (res.ok) setPosts(data.posts);
  }, []);

  useEffect(() => {
    fetchPosts().finally(() => setLoading(false));
  }, [fetchPosts]);

  function handleImageUpload(url: string) {
    if (url && images.length < 5) setImages((prev) => [...prev, url]);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: user.id,
          authorNickname: user.nickname,
          content: content.trim(),
          images: images.length > 0 ? images : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPosts((prev) => [json.post, ...prev]);
      setContent("");
      setImages([]);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!user || !confirm("게시글을 삭제할까요?")) return;
    const res = await fetch(`/api/board/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: user.id }),
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleLike(postId: string) {
    if (!user) return;
    await fetch(`/api/board/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    // 즉시 UI 업데이트
    fetchPosts();
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-poke-red">자유게시판</h1>
          {user && (
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{user.nickname}</span>
            </p>
          )}
        </div>
        <Link
          href="/trade"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          ⚡ 거래소
        </Link>
      </header>

      {/* 글쓰기 버튼 / 폼 */}
      {!showForm ? (
        <button
          type="button"
          className="btn-primary w-full mb-5"
          onClick={() => setShowForm(true)}
        >
          + 글 쓰기
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="card mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">새 게시글</h3>
            <button
              type="button"
              className="text-sm text-slate-400"
              onClick={() => {
                setShowForm(false);
                setContent("");
                setImages([]);
              }}
            >
              닫기
            </button>
          </div>
          <textarea
            className="input min-h-32 resize-none"
            placeholder="무슨 생각을 하고 있나요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((url, idx) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-white text-xs"
                    onClick={() => removeImage(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 5 && (
            <ImageUpload onUpload={handleImageUpload} label="이미지 추가 (최대 5장)" />
          )}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "등록 중..." : "게시하기"}
          </button>
        </form>
      )}

      {/* 게시글 목록 */}
      {loading ? (
        <p className="text-center text-sm text-slate-400 py-12">불러오는 중...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-12">
          첫 게시글을 올려보세요!
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card space-y-3">
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {post.authorNickname}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {formatTime(post.createdAt)}
                </span>
              </div>

              {/* 내용 */}
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                {post.content}
              </p>

              {/* 이미지 */}
              {post.images && post.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {post.images.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt="첨부 이미지"
                      className="max-h-48 rounded-xl object-cover border border-slate-100 cursor-pointer"
                      onClick={() => window.open(url, "_blank")}
                    />
                  ))}
                </div>
              )}

              {/* 액션 */}
              <div className="flex items-center justify-between pt-1 text-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-slate-500 hover:text-poke-red"
                    onClick={() => handleLike(post.id)}
                  >
                    ❤️ {post.likeCount}
                  </button>
                  <Link
                    href={`/free-board/${post.id}`}
                    className="flex items-center gap-1 text-slate-500 hover:text-poke-blue"
                  >
                    💬 {post.commentCount}
                  </Link>
                </div>
                {user?.id === post.authorId && (
                  <button
                    type="button"
                    className="text-xs text-red-400 hover:text-red-600"
                    onClick={() => handleDelete(post.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

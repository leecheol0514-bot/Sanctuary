"use client";

import { ImageUpload } from "@/components/ImageUpload";
import type { CreateBoardPostRequest } from "@/lib/types";
import { FormEvent, useState } from "react";

interface CreateBoardPostFormProps {
  onSubmit: (data: Omit<CreateBoardPostRequest, "authorId" | "authorNickname">) => Promise<void>;
  onCancel: () => void;
}

export function CreateBoardPostForm({ onSubmit, onCancel }: CreateBoardPostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function handleImageUpload(url: string) {
    if (url) setImages((prev) => [...prev, url]);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      });
      setTitle("");
      setContent("");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">새 게시글 작성</h3>
        <button type="button" className="text-sm text-slate-400" onClick={onCancel}>
          닫기
        </button>
      </div>

      <input
        className="input"
        placeholder="제목 *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        required
      />

      <textarea
        className="input min-h-32 resize-none"
        placeholder="내용을 입력하세요 *"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      {/* 이미지 첨부 */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-600">📸 이미지 첨부 (선택)</legend>
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
      </fieldset>

      <button type="submit" className="btn-primary w-full" disabled={loading || !title.trim() || !content.trim()}>
        {loading ? "등록 중..." : "게시글 올리기"}
      </button>
    </form>
  );
}

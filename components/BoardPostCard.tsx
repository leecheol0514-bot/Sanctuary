import type { BoardPost } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import Link from "next/link";

interface BoardPostCardProps {
  post: BoardPost;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
}

export function BoardPostCard({ post, currentUserId, onDelete, onLike }: BoardPostCardProps) {
  const isOwner = currentUserId === post.authorId;
  const liked = currentUserId ? post.likes.includes(currentUserId) : false;

  return (
    <div className="card space-y-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link href={`/board/${post.id}`} className="block">
            <h3 className="font-bold text-slate-800 hover:text-sanctuary-primary transition truncate">
              {post.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm font-medium text-slate-600">{post.authorNickname}</span>
            <span className="text-xs text-slate-400">{formatTime(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 내용 미리보기 */}
      <Link href={`/board/${post.id}`} className="block">
        <p className="text-sm text-slate-600 line-clamp-2">
          {post.content}
        </p>
      </Link>

      {/* 이미지 미리보기 */}
      {post.images && post.images.length > 0 && (
        <Link href={`/board/${post.id}`} className="block">
          <div className="flex gap-2 flex-wrap">
            {post.images.slice(0, 3).map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`이미지 ${idx + 1}`}
                className="h-20 w-20 rounded-xl object-cover border border-slate-100"
              />
            ))}
            {post.images.length > 3 && (
              <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                +{post.images.length - 3}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onLike?.(post.id)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            liked
              ? "bg-sanctuary-primary/10 text-sanctuary-primary"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>{liked ? "❤️" : "🤍"}</span>
          <span>{post.likes.length}</span>
        </button>
        
        <div className="flex gap-2">
          {isOwner && onDelete && (
            <button
              type="button"
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100"
              onClick={() => onDelete(post.id)}
            >
              삭제
            </button>
          )}
          <Link
            href={`/board/${post.id}`}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            자세히 →
          </Link>
        </div>
      </div>
    </div>
  );
}

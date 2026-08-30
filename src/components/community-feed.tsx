"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  EyeOff,
  Heart,
  Hourglass,
  LoaderCircle as Loader2,
  MessagesSquare,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge, Card, EmptyState } from "./ui";
import { timeAgo } from "@/lib/format";

export type FeedReply = {
  id: string;
  body: string;
  mediaKind: string;
  mediaKey: string | null;
  createdAt: string;
  authorName: string;
  authorRole: string;
};

export type FeedPost = {
  id: string;
  body: string;
  status: string;
  isMine: boolean;
  likesCount: number;
  createdAt: string;
  authorName: string;
  authorRole: string;
  courseTitle: string | null;
  groupId?: string | null;
  groupName?: string | null;
  replies: FeedReply[];
};

function ReplyMedia({ replyId, kind }: { replyId: string; kind: string }) {
  const src = `/api/v1/community/replies/${replyId}/media`;
  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="مرفق الحل" className="max-h-72 w-full rounded-lg border border-line object-contain" />
    );
  }
  if (kind === "video") {
    return <video controls src={src} className="max-h-72 w-full rounded-lg border border-line" />;
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
    >
      <Paperclip size={12} /> فتح المرفق
    </a>
  );
}

export function CommunityFeed({ posts }: { posts: FeedPost[] }) {
  const courses = useMemo(
    () => Array.from(new Set(posts.map((p) => p.courseTitle).filter((t): t is string => Boolean(t)))),
    [posts],
  );
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [pendingLike, setPendingLike] = useState<string | null>(null);

  const visible = activeCourse ? posts.filter((p) => p.courseTitle === activeCourse) : posts;

  async function like(postId: string) {
    if (liked.has(postId) || pendingLike === postId) return;
    setPendingLike(postId);
    try {
      const res = await fetch(`/api/v1/posts/${postId}/like`, { method: "POST" });
      const json = await res.json();
      if (json.ok) setLiked((prev) => new Set(prev).add(postId));
    } catch {
      /* silent */
    } finally {
      setPendingLike(null);
    }
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<MessagesSquare size={22} />}
        title="لا توجد منشورات بعد"
        hint="كن أول من يطرح سؤالاً — اكتبه في نموذج «اسأل» وسيظهر هنا بعد المراجعة."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* course filter chips */}
      {courses.length > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCourse(null)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              activeCourse === null ? "bg-brand text-white" : "bg-surface2 text-muted hover:text-ink"
            }`}
          >
            الكل
          </button>
          {courses.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCourse(c)}
className={`max-w-52 cursor-pointer truncate rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              activeCourse === c ? "bg-brand text-white" : "bg-surface2 text-muted hover:text-ink"
            }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {visible.map((p) => (
        <Card key={p.id} className="space-y-3 p-5">
          {/* head */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 font-bold text-ink">
              <Avatar name={p.authorName} size="xs" className="size-7" />
              {p.authorName}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {p.courseTitle ? <Badge tone="brand">{p.courseTitle}</Badge> : null}
                      {p.groupName ? <Badge tone="gold">مجموعة: {p.groupName}</Badge> : null}
              {p.status === "pending" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
                  <Hourglass size={11} /> قيد مراجعة المشرفين
                </span>
              ) : null}
              {p.status === "rejected" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">
                  <EyeOff size={11} /> لم تتم الموافقة على النشر
                </span>
              ) : null}
              <span className="tabular-nums text-xs text-muted">{timeAgo(p.createdAt)}</span>
            </div>
          </div>

          {/* body */}
          <p className="rounded-xl bg-surface2 p-3.5 text-base leading-relaxed text-ink">{p.body}</p>

          {/* actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void like(p.id)}
              disabled={liked.has(p.id) || pendingLike === p.id}
              aria-label="إعجاب"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold transition-colors disabled:cursor-default ${
                liked.has(p.id) ? "bg-success/10 text-success" : "text-muted hover:bg-surface2 hover:text-ink"
              }`}
            >
              {pendingLike === p.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Heart size={14} className={liked.has(p.id) ? "fill-success" : ""} />
              )}
              {p.likesCount + (liked.has(p.id) ? 1 : 0)}
            </button>
            {p.replies.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold text-muted">
                <MessagesSquare size={14} />
                {p.replies.length} إجابة
              </span>
            ) : null}
          </div>

          {/* replies */}
          {p.replies.length > 0 ? (
            <div className="space-y-2 border-s-2 border-brand/40 ps-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
                <ShieldCheck size={12} /> إجابات فريق المساعدين ({p.replies.length})
              </p>
              {p.replies.map((r) => (
                <div key={r.id} className="space-y-2 rounded-xl border border-line bg-surface2/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                      <BadgeCheck size={12} /> {r.authorName}
                      <span className="text-muted">· فريق المساعدين</span>
                    </span>
                    <span className="tabular-nums font-mono text-xs text-muted">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.body ? <p className="text-sm leading-relaxed text-ink">{r.body}</p> : null}
                  {r.mediaKey ? <ReplyMedia replyId={r.id} kind={r.mediaKind} /> : null}
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

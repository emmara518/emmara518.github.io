import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, communityReplies, courses, subscriptions, users } from "@/db/schema";
import { ServiceError } from "../errors";
import { hasActiveSubscription } from "./billing.service";
import { isAdminRole } from "../rbac";
import type { SessionUser } from "../auth";

/** Community — moderated course discussion with assistant answers. */

async function canAccess(user: SessionUser, courseId: string): Promise<boolean> {
  if (isAdminRole(user.role)) return true;
  return hasActiveSubscription(user.id, courseId);
}

async function courseBySlug(slug: string) {
  const rows = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  const course = rows[0];
  if (!course || course.status !== "published") {
    throw new ServiceError(404, "COURSE_NOT_FOUND", "الكورس غير موجود");
  }
  return course;
}

const postColumns = {
  id: communityPosts.id,
  body: communityPosts.body,
  status: communityPosts.status,
  likesCount: communityPosts.likesCount,
  createdAt: communityPosts.createdAt,
  authorName: users.name,
  authorRole: users.role,
};

export async function listPosts(user: SessionUser, slug: string) {
  const course = await courseBySlug(slug);
  if (!(await canAccess(user, course.id))) {
    throw new ServiceError(403, "NOT_ENROLLED", "مجتمع الكورس متاح للمشتركين");
  }
  const rows = await db
    .select(postColumns)
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .where(eq(communityPosts.courseId, course.id))
    .orderBy(desc(communityPosts.createdAt))
    .limit(50);
  return { courseId: course.id, posts: rows };
}

/** Posts go to the moderation queue; the author sees them as «قيد المراجعة». */
export async function createPost(user: SessionUser, slug: string, body: string) {
  const course = await courseBySlug(slug);
  if (!(await canAccess(user, course.id))) {
    throw new ServiceError(403, "NOT_ENROLLED", "اشترك في الكورس للمشاركة في المجتمع");
  }
  const [post] = await db
    .insert(communityPosts)
    .values({ courseId: course.id, userId: user.id, body, status: "pending" })
    .returning();
  return post;
}

export async function likePost(user: SessionUser, postId: string) {
  const rows = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  const post = rows[0];
  if (!post) throw new ServiceError(404, "POST_NOT_FOUND", "المنشور غير موجود");
  if (!(await canAccess(user, post.courseId!))) {
    throw new ServiceError(403, "NOT_ENROLLED", "مجتمع الكورس متاح للمشتركين");
  }
  const [updated] = await db
    .update(communityPosts)
    .set({ likesCount: sql`${communityPosts.likesCount} + 1` })
    .where(eq(communityPosts.id, postId))
    .returning({ likesCount: communityPosts.likesCount });
  return { postId, likesCount: updated.likesCount };
}

/* ── Student feed: approved posts of enrolled courses + own posts with replies ── */

export type CommunityReplyModel = {
  id: string;
  body: string;
  mediaKind: string;
  mediaKey: string | null;
  createdAt: Date;
  authorName: string;
  authorRole: string;
};

export async function listCommunityFeed(user: SessionUser) {
  const enrolledRows = await db
    .select({ courseId: subscriptions.courseId })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")));
  const visibleCourseIds = enrolledRows.map((r) => r.courseId);

  const postRows =
    visibleCourseIds.length > 0
      ? await db
          .select({ ...postColumns, courseId: communityPosts.courseId })
          .from(communityPosts)
          .innerJoin(users, eq(communityPosts.userId, users.id))
          .where(
            sql`(${inArray(communityPosts.courseId, visibleCourseIds)} AND ${communityPosts.status} = 'approved') OR ${communityPosts.userId} = ${user.id}`,
          )
          .orderBy(desc(communityPosts.createdAt))
          .limit(60)
      : await db
          .select({ ...postColumns, courseId: communityPosts.courseId })
          .from(communityPosts)
          .innerJoin(users, eq(communityPosts.userId, users.id))
          .where(eq(communityPosts.userId, user.id))
          .orderBy(desc(communityPosts.createdAt))
          .limit(60);

  const postIds = postRows.map((p) => p.id);
  const replyRows = postIds.length
    ? await db
        .select({
          id: communityReplies.id,
          postId: communityReplies.postId,
          body: communityReplies.body,
          mediaKind: communityReplies.mediaKind,
          mediaKey: communityReplies.mediaKey,
          createdAt: communityReplies.createdAt,
          authorName: users.name,
          authorRole: users.role,
        })
        .from(communityReplies)
        .innerJoin(users, eq(communityReplies.userId, users.id))
        .where(inArray(communityReplies.postId, postIds))
        .orderBy(communityReplies.createdAt)
    : [];

  const courseTitleMap = new Map<string, string>();
  if (visibleCourseIds.length > 0) {
    const titleRows = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(inArray(courses.id, visibleCourseIds));
    titleRows.forEach((t) => courseTitleMap.set(t.id, t.title));
  }

  return {
    posts: postRows.map((p) => ({
      id: p.id,
      body: p.body,
      status: p.status,
      isMine: false,
      likesCount: p.likesCount,
      createdAt: p.createdAt.toISOString(),
      authorName: p.authorName,
      authorRole: p.authorRole,
      courseTitle: p.courseId ? (courseTitleMap.get(p.courseId) ?? null) : null,
      replies: replyRows
        .filter((r) => r.postId === p.id)
        .map((r) => ({
          id: r.id,
          body: r.body,
          mediaKind: r.mediaKind,
          mediaKey: r.mediaKey,
          createdAt: r.createdAt.toISOString(),
          authorName: r.authorName,
          authorRole: r.authorRole,
        })),
    })),
  };
}

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, courses, users } from "@/db/schema";
import { ServiceError } from "../errors";
import { hasActiveSubscription } from "./billing.service";
import { isAdminRole } from "../rbac";
import type { SessionUser } from "../auth";

/** Community — course discussion feed. Access = enrolled or staff. */

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

export async function listPosts(user: SessionUser, slug: string) {
  const course = await courseBySlug(slug);
  if (!(await canAccess(user, course.id))) {
    throw new ServiceError(403, "NOT_ENROLLED", "مجتمع الكورس متاح للمشتركين");
  }
  const rows = await db
    .select({
      id: communityPosts.id,
      body: communityPosts.body,
      likesCount: communityPosts.likesCount,
      createdAt: communityPosts.createdAt,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .where(eq(communityPosts.courseId, course.id))
    .orderBy(desc(communityPosts.createdAt))
    .limit(50);
  return { courseId: course.id, posts: rows };
}

export async function createPost(user: SessionUser, slug: string, body: string) {
  const course = await courseBySlug(slug);
  if (!(await canAccess(user, course.id))) {
    throw new ServiceError(403, "NOT_ENROLLED", "اشترك في الكورس للمشاركة في المجتمع");
  }
  const [post] = await db
    .insert(communityPosts)
    .values({ courseId: course.id, userId: user.id, body })
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

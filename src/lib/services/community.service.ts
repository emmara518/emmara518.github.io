import { and, desc, eq, inArray, sql, or } from "drizzle-orm";
import { db } from "@/db";
import {
  communityPosts,
  communityReplies,
  communityGroups,
  communityGroupMembers,
  courses,
  subscriptions,
  users,
  academicStages,
} from "@/db/schema";
import { ServiceError } from "../errors";
import { hasActiveSubscription } from "./billing.service";
import { isAdminRole } from "../rbac";
import type { SessionUser } from "../auth";

/** Community — moderated course discussion with assistant answers, organized by groups. */

type Scope = "public" | "course" | "stage" | "custom";

async function canAccess(user: SessionUser, courseId: string | null): Promise<boolean> {
  if (isAdminRole(user.role)) return true;
  if (!courseId) return false;
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

/* ── Group access (scope-aware) ── */

export async function canAccessGroup(user: SessionUser, groupId: string): Promise<boolean> {
  if (isAdminRole(user.role)) return true;
  const g = await db
    .select({
      scope: communityGroups.scope,
      courseId: communityGroups.courseId,
      stageId: communityGroups.stageId,
      isActive: communityGroups.isActive,
    })
    .from(communityGroups)
    .where(eq(communityGroups.id, groupId))
    .limit(1);
  const group = g[0];
  if (!group || !group.isActive) return false;

  if (group.scope === "public") return true;
  if (group.scope === "course" && group.courseId) {
    return hasActiveSubscription(user.id, group.courseId);
  }
  if (group.scope === "stage" && group.stageId) {
    const enroll = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .innerJoin(courses, eq(subscriptions.courseId, courses.id))
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"), eq(courses.gradeId, group.stageId)))
      .limit(1);
    return enroll.length > 0;
  }
  if (group.scope === "custom") {
    const member = await db
      .select({ id: communityGroupMembers.id })
      .from(communityGroupMembers)
      .where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, user.id)))
      .limit(1);
    return member.length > 0;
  }
  return false;
}

export async function canPostInGroup(user: SessionUser, groupId: string): Promise<boolean> {
  if (isAdminRole(user.role)) return true;
  return canAccessGroup(user, groupId);
}

/* ── Posts under a specific course (legacy + per-group within course) ── */

export async function listPosts(user: SessionUser, slug: string, groupId?: string) {
  const course = await courseBySlug(slug);
  if (!(await canAccess(user, course.id))) {
    throw new ServiceError(403, "NOT_ENROLLED", "مجتمع الكورس متاح للمشتركين");
  }
  const conditions = [eq(communityPosts.courseId, course.id)];
  if (groupId) conditions.push(eq(communityPosts.groupId, groupId));
  const rows = await db
    .select(postColumns)
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(communityPosts.createdAt))
    .limit(50);
  return { courseId: course.id, posts: rows };
}

export async function createPost(
  user: SessionUser,
  slug: string,
  body: string,
  options: { groupId?: string } = {},
) {
  const course = await courseBySlug(slug);
  if (!(await canAccess(user, course.id))) {
    throw new ServiceError(403, "NOT_ENROLLED", "اشترك في الكورس للمشاركة في المجتمع");
  }

  let groupId: string | null = options.groupId ?? null;
  if (groupId) {
    const groupRow = await db
      .select({ id: communityGroups.id, courseId: communityGroups.courseId })
      .from(communityGroups)
      .where(eq(communityGroups.id, groupId))
      .limit(1);
    const g = groupRow[0];
    if (!g) throw new ServiceError(404, "GROUP_NOT_FOUND", "المجموعة غير موجودة");
    if (g.courseId && g.courseId !== course.id) {
      throw new ServiceError(400, "GROUP_COURSE_MISMATCH", "المجموعة لا تخص هذا الكورس");
    }
    if (!(await canPostInGroup(user, groupId))) {
      throw new ServiceError(403, "GROUP_FORBIDDEN", "لا تملك صلاحية النشر في هذه المجموعة");
    }
  }

  const [post] = await db
    .insert(communityPosts)
    .values({ courseId: course.id, groupId, userId: user.id, body, status: "pending" })
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

/* ── Group discovery (student-facing) ── */

export async function listAccessibleGroups(user: SessionUser) {
  const enrolledRows = await db
    .select({
      courseId: subscriptions.courseId,
      gradeId: courses.gradeId,
    })
    .from(subscriptions)
    .innerJoin(courses, eq(subscriptions.courseId, courses.id))
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")));
  const enrolledCourseIds = enrolledRows.map((r) => r.courseId);
  const enrolledGradeIds = [...new Set(enrolledRows.map((r) => r.gradeId).filter(Boolean))];

  const allGroups = await db
    .select({
      id: communityGroups.id,
      name: communityGroups.name,
      description: communityGroups.description,
      scope: communityGroups.scope,
      courseId: communityGroups.courseId,
      stageId: communityGroups.stageId,
      coverImageUrl: communityGroups.coverImageUrl,
      sortOrder: communityGroups.sortOrder,
    })
    .from(communityGroups)
    .where(eq(communityGroups.isActive, true))
    .orderBy(communityGroups.sortOrder, desc(communityGroups.createdAt));

  const customGroupIds = allGroups.filter((g) => g.scope === "custom").map((g) => g.id);
  let memberOfCustom: Set<string> = new Set();
  if (customGroupIds.length > 0) {
    const mems = await db
      .select({ groupId: communityGroupMembers.groupId })
      .from(communityGroupMembers)
      .where(and(eq(communityGroupMembers.userId, user.id), inArray(communityGroupMembers.groupId, customGroupIds)));
    memberOfCustom = new Set(mems.map((m) => m.groupId));
  }

  return allGroups.filter((g) => {
    if (g.scope === "public") return true;
    if (g.scope === "course" && g.courseId && enrolledCourseIds.includes(g.courseId)) return true;
    if (g.scope === "stage" && g.stageId && enrolledGradeIds.includes(g.stageId)) return true;
    if (g.scope === "custom" && memberOfCustom.has(g.id)) return true;
    return false;
  });
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

export async function listCommunityFeed(user: SessionUser, options: { groupId?: string } = {}) {
  const enrolledRows = await db
    .select({ courseId: subscriptions.courseId })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")));
  const visibleCourseIds = enrolledRows.map((r) => r.courseId);

  const accessibleGroups = await listAccessibleGroups(user);
  const accessibleGroupIds = accessibleGroups.map((g) => g.id);

  const conditions: any[] = [];
  if (options.groupId) {
    conditions.push(eq(communityPosts.groupId, options.groupId));
  } else {
    const orParts: any[] = [];
    if (visibleCourseIds.length > 0) {
      orParts.push(sql`(${inArray(communityPosts.courseId, visibleCourseIds)} AND ${communityPosts.status} = 'approved')`);
    }
    if (accessibleGroupIds.length > 0) {
      orParts.push(sql`(${inArray(communityPosts.groupId, accessibleGroupIds)} AND ${communityPosts.status} = 'approved')`);
    }
    orParts.push(eq(communityPosts.userId, user.id));
    if (orParts.length > 0) conditions.push(or(...orParts));
  }
  if (conditions.length === 0) return { posts: [] };

  const postRows = await db
    .select({ ...postColumns, courseId: communityPosts.courseId, groupId: communityPosts.groupId })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .where(and(...conditions))
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

  const courseIds = postRows.map((p) => p.courseId).filter(Boolean) as string[];
  const courseTitleMap = new Map<string, string>();
  if (courseIds.length > 0) {
    const titleRows = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(inArray(courses.id, courseIds));
    titleRows.forEach((t) => courseTitleMap.set(t.id, t.title));
  }
  const groupMap = new Map(accessibleGroups.map((g) => [g.id, g]));

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
      groupId: p.groupId,
      groupName: p.groupId ? (groupMap.get(p.groupId)?.name ?? null) : null,
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
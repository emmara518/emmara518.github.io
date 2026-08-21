import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  exams,
  examQuestions,
  questionBank,
  examAttempts,
  courses,
  notifications,
} from "@/db/schema";
import { ServiceError } from "../errors";
import { hasActiveSubscription } from "./billing.service";

/**
 * Exams — questions NEVER include correct answers before submission.
 * Grading is 100% server-side; attempts persist an immutable graded snapshot.
 */

export async function getExamRoom(examId: string, userId: string) {
  const examRows = await db
    .select({
      id: exams.id,
      title: exams.title,
      mode: exams.mode,
      durationMin: exams.durationMin,
      courseId: exams.courseId,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(exams)
    .innerJoin(courses, eq(exams.courseId, courses.id))
    .where(and(eq(exams.id, examId), eq(exams.isPublished, true)))
    .limit(1);
  const exam = examRows[0];
  if (!exam) throw new ServiceError(404, "EXAM_NOT_FOUND", "الامتحان غير موجود");

  const enrolled = await hasActiveSubscription(userId, exam.courseId);
  if (!enrolled) throw new ServiceError(403, "NOT_ENROLLED", "يجب الاشتراك في الكورس لدخول الامتحان");

  const links = await db
    .select({
      questionId: examQuestions.questionId,
      prompt: questionBank.prompt,
      options: questionBank.options,
      marks: questionBank.marks,
      kind: questionBank.kind,
      topic: questionBank.topic,
    })
    .from(examQuestions)
    .innerJoin(questionBank, eq(examQuestions.questionId, questionBank.id))
    .where(eq(examQuestions.examId, examId))
    .orderBy(asc(examQuestions.sortOrder));

  const attempts = await db
    .select({ id: examAttempts.id, score: examAttempts.score, totalMarks: examAttempts.totalMarks })
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, userId)));

  return {
    exam: {
      id: exam.id,
      title: exam.title,
      mode: exam.mode,
      durationMin: exam.durationMin,
      courseTitle: exam.courseTitle,
      courseSlug: exam.courseSlug,
      totalMarks: links.reduce((s, q) => s + q.marks, 0),
    },
    questions: links.map((q) => ({
      id: q.questionId,
      prompt: q.prompt,
      options: q.options,
      marks: q.marks,
      kind: q.kind,
      topic: q.topic,
    })),
    attemptsCount: attempts.length,
    bestScore: attempts.length ? Math.max(...attempts.map((a) => a.score)) : null,
  };
}

export type ExamSubmissionAnswer = { questionId: string; choiceIndex: number | null };

export async function submitAttempt(examId: string, userId: string, answers: ExamSubmissionAnswer[]) {
  const room = await getExamRoom(examId, userId); // performs enrollment + existence checks

  const questionIds = room.questions.map((q) => q.id);
  const full = questionIds.length
    ? await db
        .select({
          id: questionBank.id,
          correctIndex: questionBank.correctIndex,
          marks: questionBank.marks,
          explanation: questionBank.explanation,
          prompt: questionBank.prompt,
          options: questionBank.options,
        })
        .from(questionBank)
        .where(inArray(questionBank.id, questionIds))
    : [];

  const chosenMap = new Map(answers.map((a) => [a.questionId, a.choiceIndex]));
  let score = 0;
  const results = full.map((q) => {
    const chosen = chosenMap.get(q.id) ?? null;
    const correct = chosen !== null && chosen === q.correctIndex;
    if (correct) score += q.marks;
    return {
      questionId: q.id,
      prompt: q.prompt,
      options: q.options,
      chosen,
      correctIndex: q.correctIndex,
      correct,
      explanation: q.explanation,
      marks: q.marks,
    };
  });

  const totalMarks = full.reduce((s, q) => s + q.marks, 0);

  const [attempt] = await db
    .insert(examAttempts)
    .values({
      examId,
      userId,
      score,
      totalMarks,
      answers: full.map((q) => ({
        questionId: q.id,
        choiceIndex: chosenMap.get(q.id) ?? null,
        correct: chosenMap.get(q.id) === q.correctIndex,
      })),
    })
    .returning({ id: examAttempts.id });

  await db.insert(notifications).values({
    userId,
    title: "نتيجة امتحان",
    body: `حصلت على ${score} من ${totalMarks} في «${room.exam.title}»`,
    kind: "exam",
  });

  return { attemptId: attempt.id, score, totalMarks, results, examTitle: room.exam.title };
}

/** Attempt history for dashboards. */
export async function listMyAttempts(userId: string) {
  return db
    .select({
      id: examAttempts.id,
      score: examAttempts.score,
      totalMarks: examAttempts.totalMarks,
      submittedAt: examAttempts.submittedAt,
      examTitle: exams.title,
      courseSlug: courses.slug,
    })
    .from(examAttempts)
    .innerJoin(exams, eq(examAttempts.examId, exams.id))
    .innerJoin(courses, eq(exams.courseId, courses.id))
    .where(eq(examAttempts.userId, userId))
    .orderBy(sql`${examAttempts.submittedAt} DESC`)
    .limit(8);
}

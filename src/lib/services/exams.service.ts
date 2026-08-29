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
      type: exams.type,
      durationMin: exams.durationMin,
      perQuestionSec: exams.perQuestionSec,
      maxAttempts: exams.maxAttempts,
      passingScore: exams.passingScore,
      shuffleQuestions: exams.shuffleQuestions,
      showResultsImmediately: exams.showResultsImmediately,
      availableFrom: exams.availableFrom,
      availableUntil: exams.availableUntil,
      prerequisiteExamId: exams.prerequisiteExamId,
      isActive: exams.isActive,
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
  if (!exam.isActive) throw new ServiceError(403, "EXAM_INACTIVE", "هذا الامتحان معطل حالياً");

  const enrolled = await hasActiveSubscription(userId, exam.courseId);
  if (!enrolled) throw new ServiceError(403, "NOT_ENROLLED", "يجب الاشتراك في الكورس لدخول الامتحان");

  const now = new Date();
  if (exam.availableFrom && exam.availableFrom > now) {
    throw new ServiceError(403, "EXAM_NOT_OPEN", `الامتحان سيفتح في ${exam.availableFrom.toLocaleString("ar-EG")}`);
  }
  if (exam.availableUntil && exam.availableUntil < now) {
    throw new ServiceError(403, "EXAM_CLOSED", "انتهت نافذة هذا الامتحان");
  }

  if (exam.prerequisiteExamId) {
    const passedRows = await db
      .select({ id: examAttempts.id, score: examAttempts.score, totalMarks: examAttempts.totalMarks })
      .from(examAttempts)
      .where(and(
        eq(examAttempts.examId, exam.prerequisiteExamId),
        eq(examAttempts.userId, userId),
      ));
    const passingPercent = exam.passingScore;
    const passed = passedRows.find((r) => r.totalMarks > 0 && (r.score / r.totalMarks) * 100 >= passingPercent);
    if (!passed) {
      throw new ServiceError(403, "PREREQ_NOT_MET", "يجب اجتياز الامتحان المسبق أولاً");
    }
  }

  const attempts = await db
    .select({ id: examAttempts.id, score: examAttempts.score, totalMarks: examAttempts.totalMarks })
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, userId)));

  if (exam.maxAttempts != null && attempts.length >= exam.maxAttempts) {
    throw new ServiceError(403, "ATTEMPTS_EXHAUSTED", `لقد استنفذت الحد الأقصى من المحاولات (${exam.maxAttempts})`);
  }

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

  let questions = links.map((q) => ({
    id: q.questionId,
    prompt: q.prompt,
    options: q.options,
    marks: q.marks,
    kind: q.kind,
    topic: q.topic,
  }));

  if (exam.shuffleQuestions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  return {
    exam: {
      id: exam.id,
      title: exam.title,
      type: exam.type,
      durationMin: exam.durationMin,
      perQuestionSec: exam.perQuestionSec,
      passingScore: exam.passingScore,
      showResultsImmediately: exam.showResultsImmediately,
      courseTitle: exam.courseTitle,
      courseSlug: exam.courseSlug,
      totalMarks: questions.reduce((s, q) => s + q.marks, 0),
    },
    questions,
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

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  exams,
  examQuestions,
  questionBank,
  examAttempts,
  examAttemptStarts,
  courses,
  notifications,
} from "@/db/schema";
import { ServiceError } from "../errors";
import { hasActiveSubscription } from "./billing.service";
import { effectiveMaxAttempts, shouldRevealResults } from "../exam-policy";
import {
  computeAttemptExpiry,
  isAttemptExpired,
  isQuestionExpired,
  questionDeadline,
} from "../exam-timing";

/**
 * Exams â€” questions NEVER include correct answers before submission.
 * Grading is 100% server-side; attempts persist an immutable graded snapshot.
 * The server owns the attempt clock; client clocks and timestamps are ignored.
 */

type Executor = any;

type ExamRoom = {
  exam: {
    id: string;
    title: string;
    type: string;
    durationMin: number;
    perQuestionSec: number | null;
    passingScore: number;
    showResultsImmediately: boolean;
    availableUntil: Date | null;
    courseTitle: string;
    courseSlug: string;
    totalMarks: number;
  };
  questions: {
    id: string;
    prompt: string;
    options: string[];
    marks: number;
    kind: string;
    topic: string;
  }[];
  attemptsCount: number;
  bestScore: number | null;
};

type AttemptStart = {
  id: string;
  startedAt: Date;
  expiresAt: Date;
  questionOrder: string[];
};

async function lockExam(executor: Executor, examId: string) {
  await executor.execute(sql`SELECT id FROM exams WHERE id = ${examId} FOR UPDATE`);
}

/**
 * Pure-ish read model. `executor` is mandatory so callers inside a transaction
 * never escape to the global connection and accidentally read stale state.
 */
async function loadExamRoom(examId: string, userId: string, executor: Executor): Promise<ExamRoom> {
  const examRows = await executor
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
  if (!exam) throw new ServiceError(404, "EXAM_NOT_FOUND", "Exam not found");
  if (!exam.isActive) throw new ServiceError(403, "EXAM_INACTIVE", "This exam is not active");

  const enrolled = await hasActiveSubscription(userId, exam.courseId, executor);
  if (!enrolled) throw new ServiceError(403, "NOT_ENROLLED", "Active enrollment is required for this exam");

  const now = new Date();
  if (exam.availableFrom && exam.availableFrom > now) {
    throw new ServiceError(403, "EXAM_NOT_OPEN", `The exam opens at ${exam.availableFrom.toLocaleString("ar-EG")}`);
  }
  if (exam.availableUntil && exam.availableUntil < now) {
    throw new ServiceError(403, "EXAM_CLOSED", "The exam window has closed");
  }

  if (exam.prerequisiteExamId) {
    const passedRows = await executor
      .select({ id: examAttempts.id, score: examAttempts.score, totalMarks: examAttempts.totalMarks })
      .from(examAttempts)
      .where(and(
        eq(examAttempts.examId, exam.prerequisiteExamId),
        eq(examAttempts.userId, userId),
      ));
    const passingPercent = exam.passingScore;
    const passed = passedRows.find((r: any) => r.totalMarks > 0 && (r.score / r.totalMarks) * 100 >= passingPercent);
    if (!passed) {
      throw new ServiceError(403, "PREREQ_NOT_MET", "You must pass the prerequisite exam first");
    }
  }

  const attempts = await executor
    .select({ id: examAttempts.id, score: examAttempts.score, totalMarks: examAttempts.totalMarks })
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.userId, userId)));

  const maxAttempts = effectiveMaxAttempts(exam.maxAttempts);
  if (attempts.length >= maxAttempts) {
    throw new ServiceError(403, "ATTEMPTS_EXHAUSTED", `You have used all ${maxAttempts} attempts`);
  }

  const links = await executor
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

  let questions = links.map((q: any) => ({
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
      availableUntil: exam.availableUntil,
      courseTitle: exam.courseTitle,
      courseSlug: exam.courseSlug,
      totalMarks: questions.reduce((s: number, q: any) => s + q.marks, 0),
    },
    questions,
    attemptsCount: attempts.length,
    bestScore: attempts.length ? Math.max(...attempts.map((a: any) => a.score)) : null,
  };
}

async function findOpenStart(executor: Executor, examId: string, userId: string) {
  const rows = await executor
    .select()
    .from(examAttemptStarts)
    .where(
      and(
        eq(examAttemptStarts.examId, examId),
        eq(examAttemptStarts.userId, userId),
        isNull(examAttemptStarts.submittedAt),
      ),
    )
    .orderBy(desc(examAttemptStarts.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

async function ensureAttemptStart(
  executor: Executor,
  examId: string,
  userId: string,
  room: ExamRoom,
  now: Date,
): Promise<AttemptStart> {
  const open = await findOpenStart(executor, examId, userId);
  if (open && open.expiresAt.getTime() > now.getTime()) {
    return {
      id: open.id,
      startedAt: open.startedAt,
      expiresAt: open.expiresAt,
      questionOrder: open.questionOrder,
    };
  }

  // Expired or abandoned start rows are not attempts; remove them so the
  // student can start a fresh attempt while attempts remain.
  await executor
    .delete(examAttemptStarts)
    .where(
      and(
        eq(examAttemptStarts.examId, examId),
        eq(examAttemptStarts.userId, userId),
        isNull(examAttemptStarts.submittedAt),
      ),
    );

  const expiresAt = computeAttemptExpiry(now, room.exam.durationMin, room.exam.availableUntil);
  if (expiresAt.getTime() <= now.getTime()) {
    throw new ServiceError(403, "EXAM_CLOSED", "The exam window has closed");
  }

  const questionOrder = room.questions.map((q) => q.id);
  const [created] = await executor
    .insert(examAttemptStarts)
    .values({
      examId,
      userId,
      startedAt: now,
      expiresAt,
      questionOrder,
    })
    .returning({
      id: examAttemptStarts.id,
      startedAt: examAttemptStarts.startedAt,
      expiresAt: examAttemptStarts.expiresAt,
      questionOrder: examAttemptStarts.questionOrder,
    });

  return created;
}

function reorderQuestions<T extends { id: string }>(questions: T[], order: string[]): T[] {
  if (order.length === 0) return questions;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = order.map((id) => byId.get(id)).filter((q): q is T => Boolean(q));
  for (const q of questions) {
    if (!order.includes(q.id)) ordered.push(q);
  }
  return ordered;
}

/**
 * Starts (or resumes) the server-owned attempt clock and returns the room.
 * Repeated page loads return the same open start; they do not reset time.
 */
export async function getExamRoom(examId: string, userId: string) {
  return db.transaction(async (tx) => {
    await lockExam(tx, examId);
    const now = new Date();
    const room = await loadExamRoom(examId, userId, tx);
    const start = await ensureAttemptStart(tx, examId, userId, room, now);
    return {
      ...room,
      questions: reorderQuestions(room.questions, start.questionOrder),
      attemptStart: {
        id: start.id,
        startedAt: start.startedAt,
        expiresAt: start.expiresAt,
        perQuestionSec: room.exam.perQuestionSec,
      },
    };
  });
}

export type ExamSubmissionAnswer = { questionId: string; choiceIndex: number | null };

export async function submitAttempt(examId: string, userId: string, answers: ExamSubmissionAnswer[]) {
  return db.transaction(async (tx) => {
    await lockExam(tx, examId);
    const now = new Date();

    // Check the attempt state before the attempt-count guard so a repeat of an
    // already-submitted start is always reported as a duplicate, even when the
    // student has since exhausted the remaining attempts.
    const latest = (await tx
      .select()
      .from(examAttemptStarts)
      .where(and(eq(examAttemptStarts.examId, examId), eq(examAttemptStarts.userId, userId)))
      .orderBy(desc(examAttemptStarts.startedAt))
      .limit(1))[0] ?? null;
    if (!latest) {
      throw new ServiceError(409, "EXAM_NOT_STARTED", "Start the exam before submitting");
    }
    if (latest.submittedAt) {
      throw new ServiceError(409, "ATTEMPT_ALREADY_SUBMITTED", "This attempt was already submitted");
    }
    if (isAttemptExpired(latest.expiresAt, now)) {
      throw new ServiceError(403, "EXAM_TIME_EXPIRED", "The exam time has expired");
    }
    const room = await loadExamRoom(examId, userId, tx);

    const questionIds = room.questions.map((q) => q.id);
    const allowed = new Set(questionIds);
    const seen = new Set<string>();
    for (const answer of answers) {
      if (!allowed.has(answer.questionId) || seen.has(answer.questionId)) {
        throw new ServiceError(422, "INVALID_ANSWERS", "Answers do not belong to this exam");
      }
      seen.add(answer.questionId);
    }

    const full = questionIds.length
      ? await tx
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

    const byId = new Map(full.map((q: any) => [q.id, q]));
    for (const answer of answers) {
      const question = byId.get(answer.questionId);
      if (!question) throw new ServiceError(422, "INVALID_ANSWERS", "Answers do not belong to this exam");
      if (answer.choiceIndex !== null && (answer.choiceIndex < 0 || answer.choiceIndex >= question.options.length)) {
        throw new ServiceError(422, "INVALID_ANSWER_CHOICE", "Answer choice is outside the question options");
      }
    }

    // Per-question policy: questions are served in a frozen order. Each
    // position receives one `perQuestionSec` budget; the server rejects late
    // answers even if the client clock or local timer was manipulated.
    if (room.exam.perQuestionSec && latest.questionOrder.length > 0) {
      const position = new Map<string, number>(
        latest.questionOrder.map((id: string, i: number) => [id, i] as [string, number]),
      );
      for (const answer of answers) {
        const index = position.get(answer.questionId);
        if (index === undefined) continue;
        const deadline = questionDeadline(latest.startedAt, room.exam.perQuestionSec, index);
        if (isQuestionExpired(deadline, now)) {
          throw new ServiceError(403, "QUESTION_TIME_EXPIRED", "The time for this question has expired");
        }
      }
    }

    const reveal = shouldRevealResults(room.exam.showResultsImmediately, room.exam.availableUntil, now);
    const chosenMap = new Map(answers.map((a) => [a.questionId, a.choiceIndex]));
    let score = 0;
    const results = full.map((q: any) => {
      const chosen = chosenMap.get(q.id) ?? null;
      const correct = chosen !== null && chosen === q.correctIndex;
      if (correct) score += q.marks;
      return {
        questionId: q.id,
        prompt: q.prompt,
        options: q.options,
        chosen,
        correctIndex: reveal ? q.correctIndex : null,
        correct: reveal ? correct : null,
        explanation: reveal ? q.explanation : null,
        marks: q.marks,
      };
    });

    const totalMarks = full.reduce((s: number, q: any) => s + q.marks, 0);
    const [attempt] = await tx
      .insert(examAttempts)
      .values({
        examId,
        userId,
        score,
        totalMarks,
        startedAt: latest.startedAt,
        submittedAt: now,
        answers: full.map((q: any) => ({
          questionId: q.id,
          choiceIndex: chosenMap.get(q.id) ?? null,
          correct: chosenMap.get(q.id) === q.correctIndex,
        })),
      })
      .returning({ id: examAttempts.id });

    await tx
      .update(examAttemptStarts)
      .set({ submittedAt: now, attemptId: attempt.id })
      .where(
        and(
          eq(examAttemptStarts.id, latest.id),
          eq(examAttemptStarts.userId, userId),
          isNull(examAttemptStarts.submittedAt),
        ),
      );

    await tx.insert(notifications).values({
      userId,
      title: "Exam result",
      body: `Score ${score}/${totalMarks} for ${room.exam.title}`,
      kind: "exam",
    });

    return { attemptId: attempt.id, score, totalMarks, results, revealed: reveal, examTitle: room.exam.title };
  });
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

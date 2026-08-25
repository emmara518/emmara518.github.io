import "dotenv/config";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import {
  academicStages,
  grades,
  subjects,
  users,
  sessions,
  courses,
  lessons,
  videos,
  courseFiles,
  questionBank,
  exams,
  examQuestions,
  examAttempts,
  assignments,
  assignmentSubmissions,
  subscriptions,
  orders,
  payments,
  invoices,
  coupons,
  walletAccounts,
  walletTransactions,
  studentProgress,
  notifications,
  communityPosts,
  parentLinks,
  auditLogs,
} from "./schema";

/**
 * Dros Math seed — realistic demo dataset.
 * YouTube IDs are PLACEHOLDERS (YouTube's public API-demo video). The owner's
 * real playlist video IDs replace them during content import (see docs/02 §4).
 * All copy is original demo content.
 */

const DEMO_PASSWORD = "12345678";
/** The single master admin account — username «admin» / password «admin». */
const MASTER_ADMIN_EMAIL = "admin";
const MASTER_ADMIN_PASSWORD = "admin";
const YT_PLACEHOLDER = "M7lc1UVf-VE";
const YT_PLAYLIST = "PL_DROSMATH_DEMO";

export async function seedDatabase(targetDb: any) {
  // Check if data is already seeded
  try {
    const existingStages = await targetDb.select().from(academicStages).limit(1);
    if (existingStages.length > 0) {
      return;
    }
  } catch {
    // Table might not exist yet or empty, continue
  }

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const masterAdminHash = bcrypt.hashSync(MASTER_ADMIN_PASSWORD, 10);

  /* ── academic structure ── */
  const [prep, secondary] = await targetDb
    .insert(academicStages)
    .values([
      { name: "المرحلة الإعدادية", slug: "prep", sortOrder: 1 },
      { name: "المرحلة الثانوية", slug: "secondary", sortOrder: 2 },
    ])
    .returning();

  const gradeRows = await targetDb
    .insert(grades)
    .values([
      { stageId: prep.id, name: "الصف الأول الإعدادي", slug: "prep-1", sortOrder: 1 },
      { stageId: prep.id, name: "الصف الثاني الإعدادي", slug: "prep-2", sortOrder: 2 },
      { stageId: prep.id, name: "الصف الثالث الإعدادي", slug: "prep-3", sortOrder: 3 },
      { stageId: secondary.id, name: "الصف الأول الثانوي", slug: "sec-1", sortOrder: 4 },
      { stageId: secondary.id, name: "الصف الثاني الثانوي", slug: "sec-2", sortOrder: 5 },
      { stageId: secondary.id, name: "الصف الثالث الثانوي", slug: "sec-3", sortOrder: 6 },
    ])
    .returning();
  const gradeBySlug = new Map(gradeRows.map((g: any) => [g.slug, g]));

  const subjectRows = await targetDb
    .insert(subjects)
    .values([
      { name: "الجبر", slug: "algebra" },
      { name: "الهندسة", slug: "geometry" },
      { name: "التفاضل والتكامل", slug: "calculus" },
      { name: "حساب المثلثات", slug: "trigonometry" },
      { name: "الهندسة التحليلية", slug: "analytic-geometry" },
      { name: "الإحصاء والاحتمالات", slug: "statistics" },
    ])
    .returning();
  const subjectBySlug = new Map(subjectRows.map((s: any) => [s.slug, s]));

  /* ── people ── */
  const [teacher] = await targetDb
    .insert(users)
    .values({
      email: "teacher@dros-math.com",
      passwordHash,
      name: "أ/ محمد سعيد",
      role: "teacher",
    })
    .returning();

  const [admin] = await targetDb
    .insert(users)
    .values({
      email: MASTER_ADMIN_EMAIL,
      passwordHash: masterAdminHash,
      name: "مدير المنصة",
      role: "admin",
    })
    .returning();

  const [student] = await targetDb
    .insert(users)
    .values({
      email: "student@dros-math.com",
      passwordHash,
      name: "سارة أشرف",
      phone: "01012345678",
      guardianPhone: "01098765432",
      role: "student",
      gradeId: (gradeBySlug.get("sec-2") as any)!.id,
    })
    .returning();

  const [student2] = await targetDb
    .insert(users)
    .values({
      email: "omar@dros-math.com",
      passwordHash,
      name: "عمر خالد",
      guardianPhone: "01098765432",
      role: "student",
      gradeId: (gradeBySlug.get("sec-3") as any)!.id,
    })
    .returning();

  const [parentUser] = await targetDb
    .insert(users)
    .values({
      email: "parent@dros-math.com",
      passwordHash,
      name: "ولي أمر تجريبي",
      // نفس رقم ولي الأمر المسجل عند الطالبين — مفتاح بوابة أولياء الأمور
      phone: "01098765432",
      role: "parent",
    })
    .returning();

  /* ── courses + lessons + videos + files ── */
  type LessonSeed = { title: string; preview?: boolean; videos: number };
  type CourseSeed = {
    slug: string;
    title: string;
    summary: string;
    description: string;
    grade: string;
    subject: string;
    price: number; // EGP cents
    status?: "draft" | "published";
    lessons: LessonSeed[];
  };

  const courseData: CourseSeed[] = [
    {
      slug: "algebra-1sec-term1",
      title: "الجبر — الصف الأول الثانوي · الترم الأول",
      summary: "بناء قاعدة الجبر من الصفر: المجموعات والدوال والمعادلات، بأسلوب مترابط يوصّلك لأعلى الدرجات.",
      description:
        "كورس متكامل في الجبر للصف الأول الثانوي يغطي المنهج كاملًا بترتيب مدروس: نبدأ بالمفهوم، ثم الأمثلة المحلولة خطوة بخطوة، ثم تدريبات متدرجة الصعوبة. مع كل وحدة ملفات ملخصات واختبارات قصيرة تقيس استيعابك أولًا بأول.",
      grade: "sec-1",
      subject: "algebra",
      price: 19900,
      lessons: [
        { title: "المجموعات وعلاقاتها", preview: true, videos: 2 },
        { title: "العمليات على المجموعات", videos: 2 },
        { title: "الدوال — المفهوم والتمثيل", videos: 2 },
        { title: "المعادلات من الدرجة الثانية", videos: 2 },
        { title: "مراجعة الوحدة الأولى", videos: 1 },
      ],
    },
    {
      slug: "geometry-1sec",
      title: "الهندسة — الصف الأول الثانوي",
      summary: "الهندسة ببناء برهاني واضح: من الزوايا والمتوازيات حتى التشابه، مع تدريبات محلولة بالكامل.",
      description:
        "رحلة منظمة في الهندسة للصف الأول الثانوي: كل نظرية تُشرح بفكرتها قبل خطواتها، مع نماذج امتحانات حقيقية محلولة وخرائط ذهنية للبراهين في ملفات قابلة للتحميل.",
      grade: "sec-1",
      subject: "geometry",
      price: 14900,
      lessons: [
        { title: "الزوايا والمستقيمات المتوازية", preview: true, videos: 2 },
        { title: "تطابق المثلثات", videos: 2 },
        { title: "الأشكال الرباعية", videos: 2 },
        { title: "التشابه وتطبيقاته", videos: 2 },
      ],
    },
    {
      slug: "calculus-2sec-term1",
      title: "التفاضل والتكامل — الصف الثاني الثانوي · الترم الأول",
      summary: "من النهايات إلى الاشتقاق والتكامل: فهم عميق يسبق الحفظ، وتدريبات على أفكار الامتحانات.",
      description:
        "الكورس الأهم لطلبة الصف الثاني الثانوي: نبني الحدس الهندسي للنهاية والمشتقة ثم نحترف القواعد والتطبيقات، مع سلسلة امتحانات إلكترونية بتصحيح فوري وشرح لكل سؤال.",
      grade: "sec-2",
      subject: "calculus",
      price: 24900,
      lessons: [
        { title: "النهايات — المفهوم والقوانين", preview: true, videos: 2 },
        { title: "اتصال الدوال", videos: 1 },
        { title: "مفهوم المشتقة", videos: 2 },
        { title: "قواعد الاشتقاق", videos: 2 },
        { title: "تطبيقات على المشتقة", videos: 2 },
        { title: "التكامل غير المحدود", videos: 1 },
      ],
    },
    {
      slug: "trigonometry-2sec",
      title: "حساب المثلثات — الصف الثاني الثانوي",
      summary: "النسب والدوال المثلثية وحل المثلثات بمنحنيات واضحة وتطبيقات محلولة خطوة بخطوة.",
      description:
        "كورس مركز في حساب المثلثات يحول أصعب الأفكار إلى منحنيات وصور ذهنية ثابتة، مع بنك أسئلة متدرج وامتحانات قصيرة بعد كل وحدة.",
      grade: "sec-2",
      subject: "trigonometry",
      price: 17900,
      lessons: [
        { title: "النسب المثلثية الأساسية", preview: true, videos: 2 },
        { title: "الزوايا الموجهة والقياس الدائري", videos: 1 },
        { title: "الدوال المثلثية ومنحنياتها", videos: 2 },
        { title: "حل المثلثات", videos: 2 },
      ],
    },
    {
      slug: "algebra-analytic-3sec",
      title: "الجبر والهندسة الفراغية — الصف الثالث الثانوي",
      summary: "المصفوفات والمحددات والهندسة الفراغية بأسلوب يختصر الوقت في الامتحان.",
      description:
        "كورس الثانوية العامة في الجبر والهندسة الفراغية: حلول نموذجية بأكثر من طريقة، وأفكار المسائل الحديثة، وملخصات قانونية جاهزة للمراجعة الليلية.",
      grade: "sec-3",
      subject: "analytic-geometry",
      price: 29900,
      lessons: [
        { title: "المحددات والمصفوفات", preview: true, videos: 2 },
        { title: "الإحداثيات في الفراغ", videos: 2 },
        { title: "معادلة المستوى والمستقيم", videos: 2 },
        { title: "مراجعة نهائية محلولة", videos: 2 },
      ],
    },
    {
      slug: "final-revision-3sec",
      title: "المراجعة النهائية الشاملة — ثانوية عامة",
      summary: "خطة مراجعة مكثفة بأفكار الامتحانات الحديثة وحلول نماذج وزارة التربية والتعليم.",
      description:
        "مسار ختامي مكثف يجمع كل فروع الرياضيات للثانوية العامة: خرائط قوانين، نماذج محلولة، وإدارة وقت الامتحان. (نسخة قيد الإعداد)",
      grade: "sec-3",
      subject: "algebra",
      price: 34900,
      status: "draft",
      lessons: [
        { title: "خطة المراجعة الكاملة", preview: true, videos: 1 },
        { title: "أفكار الامتحانات الحديثة", videos: 2 },
      ],
    },
  ];

  const courseBySlug = new Map<string, string>();
  const lessonIdsByCourse = new Map<string, string[]>();
  const videoIdsByCourse = new Map<string, string[]>();

  for (const c of courseData) {
    const [course] = await targetDb
      .insert(courses)
      .values({
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        gradeId: (gradeBySlug.get(c.grade) as any)!.id,
        subjectId: (subjectBySlug.get(c.subject) as any)!.id,
        teacherId: teacher.id,
        priceCents: c.price,
        status: c.status ?? "published",
      })
      .returning();
    courseBySlug.set(c.slug, course.id);
    lessonIdsByCourse.set(c.slug, []);
    videoIdsByCourse.set(c.slug, []);

    for (let i = 0; i < c.lessons.length; i++) {
      const l = c.lessons[i];
      const [lesson] = await targetDb
        .insert(lessons)
        .values({
          courseId: course.id,
          title: l.title,
          description: `شرح وافٍ لدرس «${l.title}» مع أمثلة محلولة وتدريبات مصاحبة.`,
          sortOrder: i + 1,
          isFreePreview: Boolean(l.preview),
        })
        .returning();
      lessonIdsByCourse.get(c.slug)!.push(lesson.id);

      for (let j = 0; j < l.videos; j++) {
        const [video] = await targetDb
          .insert(videos)
          .values({
            lessonId: lesson.id,
            youtubeVideoId: YT_PLACEHOLDER,
            youtubePlaylistId: YT_PLAYLIST,
            title: l.videos > 1 ? `${l.title} — الجزء ${j + 1}` : l.title,
            durationSec: 720 + ((i * 7 + j * 13) % 12) * 105,
            sortOrder: j + 1,
          })
          .returning();
        videoIdsByCourse.get(c.slug)!.push(video.id);
      }
    }

    await targetDb.insert(courseFiles).values([
      {
        courseId: course.id,
        title: `مذكرة ${(subjectBySlug.get(c.subject) as any)!.name} — ${(gradeBySlug.get(c.grade) as any)!.name}`,
        kind: "book",
        storageKey: `/uploads/books/${c.slug}-notes.pdf`,
        sizeBytes: 2_400_000,
        isFreePreview: true,
      },
      {
        courseId: course.id,
        title: `ورقة عمل وتدريبات — ${c.title.split("—")[0].trim()}`,
        kind: "worksheet",
        storageKey: `/uploads/worksheets/${c.slug}-sheet.pdf`,
        sizeBytes: 860_000,
        isFreePreview: false,
      },
    ]);
  }

  /* ── question bank (original items) ── */
  type QSeed = { subject: string; topic: string; prompt: string; options: string[]; correct: number };
  const qData: QSeed[] = [
    { subject: "algebra", topic: "المجموعات", prompt: "إذا كانت س = {1، 2، 3} و ص = {2، 3، 4} فإن س ∩ ص =", options: ["{2، 3}", "{1، 4}", "{1، 2، 3، 4}", "φ"], correct: 0 },
    { subject: "algebra", topic: "الدوال", prompt: "مجال الدالة د(س) = 1 ÷ (س − 2) هو", options: ["ح − {2}", "ح", "ح − {0}", "ح − {−2}"], correct: 0 },
    { subject: "algebra", topic: "المعادلات", prompt: "مجموعة حل المعادلة س² − 5س + 6 = 0 في ح هي", options: ["{2، 3}", "{−2، −3}", "{1، 6}", "{−1، −6}"], correct: 0 },
    { subject: "algebra", topic: "الدوال", prompt: "إذا كانت د(س) = 2س + 3 فإن د(4) =", options: ["11", "8", "14", "24"], correct: 0 },
    { subject: "algebra", topic: "المتباينات", prompt: "تحقق المتباينة 2س − 4 < 6 عندما", options: ["س < 5", "س > 5", "س < −5", "س > −1"], correct: 0 },
    { subject: "calculus", topic: "النهايات", prompt: "نهاية (س² − 9) ÷ (س − 3) عندما س ← 3 تساوي", options: ["6", "0", "3", "غير موجودة"], correct: 0 },
    { subject: "calculus", topic: "الاشتقاق", prompt: "مشتقة الدالة د(س) = س³ هي", options: ["3س²", "س²", "3س", "س³ ÷ 3"], correct: 0 },
    { subject: "calculus", topic: "الاشتقاق", prompt: "مشتقة 5س⁴ =", options: ["20س³", "5س³", "20س⁴", "16س³"], correct: 0 },
    { subject: "calculus", topic: "الاتصال", prompt: "الدالة تكون متصلة عند س = أ إذا", options: ["نهايتها تساوي قيمتها عند أ", "وجدت نهايتها فقط", "كانت معرفة عند أ فقط", "كانت نهايتها لا نهائية"], correct: 0 },
    { subject: "calculus", topic: "التكامل", prompt: "∫ 2س دس =", options: ["س² + ثابت", "2س² + ثابت", "س² ÷ 2 + ثابت", "2 + ثابت"], correct: 0 },
    { subject: "trigonometry", topic: "النسب المثلثية", prompt: "جا 30° =", options: ["1/2", "√3/2", "1", "√2/2"], correct: 0 },
    { subject: "trigonometry", topic: "النسب المثلثية", prompt: "جتا 60° =", options: ["1/2", "1", "√3/2", "0"], correct: 0 },
    { subject: "trigonometry", topic: "المتطابقات", prompt: "جا²θ + جتا²θ =", options: ["1", "0", "2", "ظا²θ"], correct: 0 },
    { subject: "trigonometry", topic: "النسب المثلثية", prompt: "ظا 45° =", options: ["1", "√3", "1/√3", "غير معرفة"], correct: 0 },
    { subject: "geometry", topic: "المثلثات", prompt: "مجموع قياسات الزوايا الداخلية للمثلث =", options: ["180°", "360°", "90°", "270°"], correct: 0 },
    { subject: "geometry", topic: "القائم", prompt: "في المثلث القائم الزاوية: (الوتر)² يساوي", options: ["مجموع مربعي الضلعين الآخرين", "حاصل ضرب الضلعين", "مجموع الضلعين", "فرق مربعيهما"], correct: 0 },
    { subject: "geometry", topic: "الأشكال الرباعية", prompt: "متوازي الأضلاع تتطابق أقطاره إذا كان", options: ["مستطيلًا", "معينًا", "شبه منحرف", "أي متوازي أضلاع"], correct: 0 },
    { subject: "analytic-geometry", topic: "المسافة", prompt: "المسافة بين النقطتين (0، 0) و (3، 4) =", options: ["5", "7", "12", "25"], correct: 0 },
    { subject: "analytic-geometry", topic: "الميل", prompt: "ميل المستقيم المار بالنقطتين (1، 2) و (3، 6) =", options: ["2", "4", "1/2", "−2"], correct: 0 },
    { subject: "statistics", topic: "الاحتمالات", prompt: "عند إلقاء عملة منتظمة مرة واحدة، احتمال ظهور الصورة =", options: ["1/2", "1", "1/4", "3/4"], correct: 0 },
  ];

  const bankRows = await targetDb
    .insert(questionBank)
    .values(
      qData.map((q) => ({
        subjectId: (subjectBySlug.get(q.subject) as any)!.id,
        topic: q.topic,
        kind: "mcq" as const,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correct,
        explanation: "الإجابة الصحيحة موضحة في الشرح المرافق للوحدة.",
        marks: 1,
      })),
    )
    .returning();
  const bankBySubject = new Map<string, string[]>();
  for (const b of bankRows) {
    const slug = qData.find((q) => (subjectBySlug.get(q.subject) as any)!.id === b.subjectId)!.subject;
    if (!bankBySubject.has(slug)) bankBySubject.set(slug, []);
    bankBySubject.get(slug)!.push(b.id);
  }

  /* ── exams ── */
  type ExamSeed = { course: string; title: string; subject: string; count: number; duration: number };
  const examData: ExamSeed[] = [
    { course: "algebra-1sec-term1", title: "اختبار الوحدة الأولى — الجبر", subject: "algebra", count: 5, duration: 15 },
    { course: "calculus-2sec-term1", title: "امتحان النهايات والاشتقاق", subject: "calculus", count: 5, duration: 20 },
    { course: "trigonometry-2sec", title: "اختبار حساب المثلثات الشامل", subject: "trigonometry", count: 4, duration: 10 },
  ];

  const examIds: string[] = [];
  for (const e of examData) {
    const [exam] = await targetDb
      .insert(exams)
      .values({
        courseId: courseBySlug.get(e.course)!,
        title: e.title,
        mode: "graded",
        durationMin: e.duration,
        isPublished: true,
      })
      .returning();
    examIds.push(exam.id);
    const ids = bankBySubject.get(e.subject)!.slice(0, e.count);
    for (let i = 0; i < ids.length; i++) {
      await targetDb.insert(examQuestions).values({ examId: exam.id, questionId: ids[i], sortOrder: i + 1 });
    }
  }

  /* ── commerce seed ── */
  const [coupon] = await targetDb
    .insert(coupons)
    .values({ code: "DROS25", percentOff: 25, maxUses: 500, usedCount: 1 })
    .returning();

  const [wallet] = await targetDb
    .insert(walletAccounts)
    .values({ userId: student.id, balanceCents: 30000 })
    .returning();
  await targetDb.insert(walletTransactions).values({
    walletId: wallet.id,
    amountCents: 30000,
    kind: "topup",
    note: "شحن رصيد تجريبي",
  });

  // student purchases course 1 with the coupon (consistent ledger)
  const price1 = 19900;
  const discount1 = Math.round((price1 * 25) / 100);
  const total1 = price1 - discount1;
  const [order1] = await targetDb
    .insert(orders)
    .values({
      userId: student.id,
      courseId: courseBySlug.get("algebra-1sec-term1")!,
      subtotalCents: price1,
      discountCents: discount1,
      totalCents: total1,
      couponId: coupon.id,
      status: "paid",
    })
    .returning();
  await targetDb.insert(payments).values({
    orderId: order1.id,
    provider: "wallet",
    amountCents: total1,
    status: "succeeded",
    reference: `WLT-${order1.id.slice(0, 8).toUpperCase()}`,
  });
  await targetDb.insert(invoices).values({ orderId: order1.id, number: "INV-2026-1001", totalCents: total1 });
  await targetDb.insert(subscriptions).values({
    userId: student.id,
    courseId: courseBySlug.get("algebra-1sec-term1")!,
    status: "active",
    orderId: order1.id,
  });
  await targetDb.insert(walletTransactions).values({
    walletId: wallet.id,
    amountCents: -total1,
    kind: "purchase",
    note: "اشتراك في كورس: الجبر — الصف الأول الثانوي",
  });
  await targetDb
    .update(walletAccounts)
    .set({ balanceCents: sql`${walletAccounts.balanceCents} - ${total1}` })
    .where(sql`${walletAccounts.id} = ${wallet.id}`);

  // second student purchases course 3 (full price)
  const course3 = courseBySlug.get("calculus-2sec-term1")!;
  const [wallet2] = await targetDb.insert(walletAccounts).values({ userId: student2.id, balanceCents: 24900 }).returning();
  await targetDb.insert(walletTransactions).values({ walletId: wallet2.id, amountCents: 24900, kind: "topup", note: "شحن رصيد تجريبي" });
  const [order2] = await targetDb
    .insert(orders)
    .values({ userId: student2.id, courseId: course3, subtotalCents: 24900, discountCents: 0, totalCents: 24900, status: "paid" })
    .returning();
  await targetDb.insert(payments).values({ orderId: order2.id, provider: "wallet", amountCents: 24900, status: "succeeded", reference: `WLT-${order2.id.slice(0, 8).toUpperCase()}` });
  await targetDb.insert(invoices).values({ orderId: order2.id, number: "INV-2026-1002", totalCents: 24900 });
  await targetDb.insert(subscriptions).values({ userId: student2.id, courseId: course3, status: "active", orderId: order2.id });
  await targetDb.insert(walletTransactions).values({ walletId: wallet2.id, amountCents: -24900, kind: "purchase", note: "اشتراك في كورس: التفاضل والتكامل" });
  await targetDb.update(walletAccounts).set({ balanceCents: 0 }).where(sql`${walletAccounts.id} = ${wallet2.id}`);

  /* ── progress + attempt + engagement ── */
  const course1Videos = videoIdsByCourse.get("algebra-1sec-term1")!;
  for (let i = 0; i < Math.min(3, course1Videos.length); i++) {
    await targetDb.insert(studentProgress).values({
      userId: student.id,
      courseId: courseBySlug.get("algebra-1sec-term1")!,
      videoId: course1Videos[i],
      watchedSeconds: 900 - i * 120,
      completedAt: new Date(),
    });
  }

  const algebraQs = bankBySubject.get("algebra")!.slice(0, 5);
  const algebraBank = bankRows.filter((b: any) => algebraQs.includes(b.id));
  const answers = algebraBank.map((q: any, i: number) => ({ questionId: q.id, choiceIndex: i === 4 ? 2 : q.correctIndex, correct: i !== 4 }));
  const score = answers.filter((a: any) => a.correct).length;
  await targetDb.insert(examAttempts).values({
    examId: examIds[0],
    userId: student.id,
    score,
    totalMarks: 5,
    answers,
  });

  // attempt for the second child (same guardian) — feeds the parent portal demo
  const calcQs = bankBySubject.get("calculus")!.slice(0, 5);
  const calcBank = bankRows.filter((b: any) => calcQs.includes(b.id));
  const omarAnswers = calcBank.map((q: any, i: number) => ({
    questionId: q.id,
    choiceIndex: i === 2 ? 1 : (q as any).correctIndex,
    correct: i !== 2,
  }));
  const omarScore = omarAnswers.filter((a: any) => a.correct).length;
  await targetDb.insert(examAttempts).values({
    examId: examIds[1],
    userId: student2.id,
    score: omarScore,
    totalMarks: 5,
    answers: omarAnswers,
  });

  await targetDb.insert(notifications).values([
    { userId: student.id, title: "أهلًا بك في دروس ماث", body: "منصتك الجديدة لإتقان الرياضيات — ابدأ أول درس الآن.", kind: "system" },
    { userId: student.id, title: "تم تفعيل اشتراكك", body: "أهلًا بك في كورس «الجبر — الصف الأول الثانوي». بالتوفيق!", kind: "billing" },
    { userId: student.id, title: "نتيجة امتحان", body: `حصلت على ${score} من 5 في «اختبار الوحدة الأولى — الجبر»`, kind: "exam" },
  ]);

  await targetDb.insert(communityPosts).values([
    { courseId: courseBySlug.get("algebra-1sec-term1")!, userId: student.id, body: "شرح درس المجموعات كان واضحًا جدًا، وضعت خطة مذاكرة أسبوعية بناءً عليه.", likesCount: 12 },
    { courseId: course3, userId: student2.id, body: "طريقة ربط النهايات بالمشتقة وفرت عليّ وقتًا كبيرًا في الحل.", likesCount: 9 },
  ]);

  /* ── assignments + parent link ── */
  const [wa1] = await targetDb
    .insert(assignments)
    .values([
      {
        courseId: courseBySlug.get("algebra-1sec-term1")!,
        title: "واجب الوحدة الأولى — المجموعات",
        instructions: "حل التمارين 1–10 من المذكرة واكتب الحلول مرتبة هنا بالتفصيل.",
        maxScore: 10,
      },
      {
        courseId: courseBySlug.get("algebra-1sec-term1")!,
        title: "واجب الدوال — التمثيل البياني",
        instructions: "مثّل ثلاث دوال بيانيًا واذكر المجال والمدى لكل منها.",
        maxScore: 10,
      },
    ])
    .returning();

  await targetDb.insert(assignmentSubmissions).values({
    assignmentId: wa1.id,
    userId: student.id,
    textAnswer: "حلول التمارين 1–10 مرفقة تفصيلًا: إجابة كل سؤال مع خطوات التعويض والتبسيط كما في الشرح.",
    score: 9,
  });

  await targetDb.insert(parentLinks).values([
    { parentId: parentUser.id, studentId: student.id },
    { parentId: parentUser.id, studentId: student2.id },
  ]);

  await targetDb.insert(auditLogs).values({
    actorId: admin.id,
    action: "seed.initialized",
    entity: "system",
    entityId: null,
    meta: { courses: courseData.length, questions: qData.length, exams: examIds.length },
  });

  console.log("✔ seed complete");
}

async function main() {
  const { db, pool } = await import("./index");
  console.log("→ wiping existing data…");
  await db.execute(sql`TRUNCATE TABLE
    audit_logs, parent_links, community_posts, notifications, student_progress,
    wallet_transactions, wallet_accounts, coupons, invoices, payments, orders,
    subscriptions, assignment_submissions, assignments, exam_attempts,
    exam_questions, exams, question_bank, course_files, videos, lessons,
    courses, sessions, users, subjects, grades, academic_stages
    RESTART IDENTITY CASCADE`);

  await seedDatabase(db);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  main()
    .catch((e) => {
      console.error("seed failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      const { pool } = await import("./index");
      if (pool) await pool.end();
    });
}

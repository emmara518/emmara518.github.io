# BACKEND SPECIFICATION — منصة دروس ماث (النظام الجديد)

> المرجع الكامل للباك إند المستقل المملوك للنظام الجديد.
> كل ما في هذا الملف موجود فعليًا في الكود: `src/db/schema.ts` + `src/lib/` + `src/app/api/v1/`.

---

## 1) نظرة عامة على خط الطلب

```
Browser → Next.js route handler (/api/v1/*)
        → zod contract (src/lib/contracts.ts)        [input validation]
        → auth guard (src/lib/auth.ts + rbac.ts)      [401/403 + role/permission]
        → service (src/lib/services/*.service.ts)     [business rules + SQL — only here]
        → PostgreSQL via Drizzle                      [transactions + constraints]
        → uniform envelope { ok, data | error }       (src/lib/http.ts)
```

قواعد حاكمة:
- لا SQL خارج `services/`. لا منطق أعمال داخل الـ handlers أو الصفحات.
- المال دائمًا `integer cents` بالجنيه المصري. لا `float` أبدًا.
- الفيديوهات مراجع خارجية فقط (YouTube IDs) — لا بايتات وسائط على بنيتنا.
- المحفظة دفتر أستاذ (ledger) لا يُعدَّل — إضافة فقط.

---

## 2) المصادقة والجلسات

| العنصر | القيمة |
|---|---|
| تجزئة كلمة المرور | bcrypt cost 12 (`hashPassword`) |
| الجلسة | توكن غير شفاف 256-bit في صف `sessions` مع `expires_at` |
| الكوكي | `dros_session` — httpOnly · SameSite=Lax · Secure في الإنتاج · مدة 30 يومًا |
| إنشاء | `createSession(userId)` — عقب login/register |
| إبطال | `destroySession()` — حذف الصف + حذف الكوكي |
| القارئ | `getSessionUser()` — join الجلسة بالمستخدم + فحص انتهاء + `is_active` |
| الحارس للـ API | `requireApiUser(roles?)` → `{ user }` أو `{ status: 401|403 }` |

### مصفوفة الأدوار × الصلاحيات (`rbac.ts`)

| الصلاحية | student | parent | center | teacher | admin |
|---|:-:|:-:|:-:|:-:|:-:|
| catalog:read | ✓ | ✓ | ✓ | ✓ | ✓ |
| course:enroll / course:learn | ✓ | — | — | — | ✓ |
| exam:attempt / progress:write / wallet:use | ✓ | — | — | — | ✓ |
| admin:read | — | — | ✓ | ✓ | ✓ |
| admin:write / audit:read | — | — | — | ✓ | ✓ |
| users:manage | — | — | — | — | ✓ |

`ADMIN_ROLES = ["teacher","admin"]` — بوابة لوحة الإدارة.

---

## 3) عقد قاعدة البيانات (26 جدولًا)

### المجال الأكاديمي
- **academic_stages**(id, name, slug†, sort_order) — المراحل (إعدادي/ثانوي).
- **grades**(id, stage_id→stages, name, slug†, sort_order) — الصفوف.
- **subjects**(id, name, slug†) — فروع الرياضيات.
- **courses**(id, slug†, title, summary, description, grade_id→grades, subject_id→subjects, teacher_id→users, price_cents, status draft|published|archived, created_at)
- **lessons**(id, course_id→courses‡, title, description, sort_order, **is_free_preview**) — درس المعاينة المجانية مفتوح بدون اشتراك.
- **videos**(id, lesson_id→lessons‡, youtube_video_id, youtube_playlist_id?, title, duration_sec, sort_order) — مراجع YouTube فقط.
- **course_files**(id, course_id‡, title, kind book|worksheet|exam_paper|attachment, storage_key, size_bytes, is_free_preview) — ملفات PDF عبر مفتاح تخزين (محلي الآن / S3 لاحقًا).

### الأشخاص والجلسات
- **users**(id, email†, password_hash, name, phone?, role, grade_id?, avatar_url?, is_active, created_at)
- **sessions**(id, token†, user_id→users‡, expires_at, created_at)

### التقييم
- **question_bank**(id, subject_id, topic, kind mcq|true_false, prompt, options jsonb, correct_index, explanation, difficulty, marks) — **لا يخرج `correct_index` أبدًا قبل التسليم**.
- **exams**(id, course_id‡, title, mode practice|graded, duration_min, is_published, created_at)
- **exam_questions**(id, exam_id‡, question_id‡, sort_order) — الربط بالبنك.
- **exam_attempts**(id, exam_id‡, user_id‡, score, total_marks, answers jsonb snapshot, started_at, submitted_at) — لقطة ثابتة لا تُعدَّل.
- **assignments / assignment_submissions** — جاهزة للمرحلة 4 (واجبات + تسليمات).

### التجارة والمال
- **subscriptions**(id, user_id‡, course_id‡, status active|expired|cancelled, order_id, starts_at, ends_at) — `unique(user_id, course_id)`.
- **orders**(id, user_id‡, course_id, subtotal_cents, discount_cents, total_cents, coupon_id?, status pending|paid|failed|refunded, created_at)
- **payments**(id, order_id‡, provider wallet|manual|card, amount_cents, status, reference)
- **invoices**(id, order_id†, number† `INV-YYYY-####`, total_cents, issued_at)
- **coupons**(id, code†, percent_off 1–90, max_uses, used_count, expires_at?, is_active)
- **wallet_accounts**(id, user_id†, balance_cents≥0 منطقيًا)
- **wallet_transactions**(id, wallet_id‡, amount_cents ±, kind topup|purchase|refund|grant, note, created_at) — إلحاق فقط.

### التفاعل والحوكمة
- **student_progress**(id, user_id‡, course_id‡, video_id‡, watched_seconds, completed_at?, updated_at) — `unique(user_id, video_id)`، upsert عند المشاهدة.
- **notifications**(id, user_id‡, title, body, kind, read_at?, created_at)
- **community_posts**(id, course_id?, user_id‡, body, likes_count, created_at)
- **audit_logs**(id, actor_id, action, entity, entity_id, meta jsonb, created_at) — كل عملية إدارية مسجلة.

† unique ‡ cascade delete

---

## 4) الخدمات (منطق الأعمال الوحيد)

### catalog.service.ts
`listStagesWithGrades` · `listGrades` · `listSubjects` · `listCourses({gradeSlug?,subjectSlug?,q?})` (يعيد +عدد الدروس +إجمالي الثواني عبر تجميعين مستقلين) · `featuredCourses` · `getCourseBySlug` · `getCourseCurriculum(courseId)` (دروس ← فيديوهات ← ملفات ← امتحانات بعدّ الأسئلة).

### billing.service.ts — محرك التسوية
- `getOrCreateWallet(userId)` — إنشاء كسول آمن من التعارض.
- `hasActiveSubscription(userId, courseId)`.
- **`purchaseCourse(userId, courseId, couponCode?)`** — معاملة واحدة بالترتيب:
  1. كورس published؟ (404) 2. اشتراك نشط موجود؟ (409) 3. كوبون صالح؟ (422) + احتساب الخصم وتثبيت عدّاد الاستخدام 4. رصيد كافٍ؟ (402) 5. خصم المحفظة + قيد purchase 6. order=paid 7. payment(wallet, succeeded, مرجع `WLT-…`) 8. فاتورة `INV-YYYY-1001+` 9. subscription=active 10. إشعار 11. audit. أي فشل → rollback كامل.
- `topUpWallet(userId, amountCents)` (TX) · `getWalletSummary` · `listInvoices`.

### exams.service.ts
- `getExamRoom(examId, userId)` — يتحقق من النشر والاشتراك، ثم يعيد الأسئلة **منزوعة الإجابات** + أفضل سكور.
- `submitAttempt(examId, userId, answers[])` — التصحيح كله على الخادم، يخزن snapshot، يُشعِر الطالب، يعيد التفكيك سؤالًا سؤالًا مع الإجابة الصحيحة والشرح.
- `listMyAttempts(userId)`.

### dashboard.service.ts
- `getStudentDashboard(user)` — اشتراكات + تقدم لكل كورس (مكتمل/إجمالي فيديوهات)، محفظة، فواتير، امتحانات قادمة، إشعارات، إحصاءات.
- `getLearningRoom(user, slug)` — المنهج كاملًا مع `unlocked` لكل درس وتفريغ `youtubeVideoId=null` للمقفل.
- `markVideoProgress` — upsert مع تحقق الاشتراك (المعاينة المجانية مستثناة).

### admin.service.ts
`getAdminOverview` (طلاب، كورسات منشورة، إيراد الفواتير، اشتراكات نشطة، إيراد شهري، آخر طلبات، آخر تدقيق) · `listUsersAdmin` (+رصيد) · `setUserRole`/`setUserActive` (لا تعديل ذاتي) · `listCoursesAdmin` · `createCourse` (slug فريد → مسودة) · `setCourseStatus` · `listCouponsAdmin`/`createCoupon` · `listOrdersAdmin`. كل تعديل يكتب `audit_logs`.

---

## 5) مرجع الـ API (العقد)

المظروف موحد: نجاح `{ok:true,data}` · فشل `{ok:false,error:{code,message}}` مع HTTP status مناسب.

| Method | Path | الصلاحية | المدخل (zod) | الناتج / الأخطاء الرئيسية |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | عام | registerSchema | 201 user · 409 EMAIL_TAKEN · 422 |
| POST | `/api/v1/auth/login` | عام | loginSchema | user · 401 BAD_CREDENTIALS |
| POST | `/api/v1/auth/logout` | جلسة | — | {done:true} |
| GET | `/api/v1/auth/me` | جلسة | — | user+permissions+wallet · 401 |
| GET | `/api/v1/catalog` | عام | — | stages+grades · subjects |
| GET | `/api/v1/courses` | عام | catalogQuerySchema (grade,subject,q) | courses[] |
| GET | `/api/v1/courses/[slug]` | عام* | — | course+lessons+exams+files (*ytId=null للمقفل) · 404 |
| POST | `/api/v1/courses/[slug]/enroll` | course:enroll | purchaseSchema | 201 {orderId,invoiceNumber,…} · 402/404/409/422 |
| POST | `/api/v1/videos/[id]/progress` | progress:write | progressSchema | {videoId,completed} · 403/404 |
| GET | `/api/v1/exams/[id]` | exam:attempt | — | room بلا إجابات · 403 NOT_ENROLLED · 404 |
| POST | `/api/v1/exams/[id]/attempts` | exam:attempt | examSubmitSchema | 201 {score,results[]} · 403 |
| GET | `/api/v1/me/dashboard` | جلسة | — | dashboard |
| POST | `/api/v1/me/wallet/topup` | wallet:use | topUpSchema | {balanceCents} (مزود تجريبي) |
| GET | `/api/v1/admin/stats` | teacher/admin | — | overview |
| GET | `/api/v1/admin/courses` · POST | teacher/admin (+admin:write) | adminCourseSchema | list · 201 {id,slug} · 409 SLUG_TAKEN |
| PATCH | `/api/v1/admin/courses/[id]` | admin:write | adminCourseStatusSchema | {courseId,status} |
| GET | `/api/v1/admin/users` | teacher/admin | — | users[] (+balance) |
| PATCH | `/api/v1/admin/users/[id]` | admin فقط (users:manage) | adminUserPatchSchema | 422 SELF_ROLE/SELF_LOCK · 403 |
| GET/POST | `/api/v1/admin/coupons` | teacher/admin (+admin:write) | couponSchema | list · 201 · 409 COUPON_EXISTS |
| GET | `/api/v1/admin/orders` | teacher/admin | — | orders[] |
| GET | `/api/health` | عام | — | صحة المنصة |

---

## 6) قواعد الأمان المفروضة

1. كل authorization على الخادم — لا قرار أذونات في المتصفح إطلاقًا.
2. ملكية: الاشتراك والامتحان والتقدم يُتحقق منها داخل الخدمة (403 NOT_ENROLLED).
3. لا تسريب: `youtube_video_id` للدروس المقفلة = null؛ `correct_index` لا يُعاد قبل التسليم أبدًا.
4. المال والمدفوعات داخل معاملات؛ الكوبون يوزن ويُقفل عدّاده داخل نفس المعاملة.
5. أدوار الإدارة: `teacher` يدير المحتوى، `admin` وحده يدير المستخدمين؛ لا يمكن تعديل دور/حالة حسابك بنفسك.
6. كل عملية إدارية وعملية شراء تُسجَّل في `audit_logs`.
7. الأسرار: `DATABASE_URL` فقط في `.env` — لا مفاتيح لأنظمة خارجية في الكود.

---

## 7) نقاط التوسعة المعزولة (Seams)

- **بوابة دفع حقيقية**: صف `payments` بمزود `card` — المحوّل يُضاف خلف `billing.service` دون تغيير العقود.
- **تخزين كائنات S3**: الملفات كلها `storage_key` — محوّل واحد يستبدل `/uploads/…`.
- **Rate limiting / كاش Redis**: نقطة واحدة في `http.ts` وتخزين الجلسات قابل للنقل.
- **بورتال ولي الأمر/السنتر**: الأدوار exist بالفعل — واجهات فقط في المرحلة 4.

## 8) التشغيل

```bash
npx drizzle-kit push          # تطبيق المخطط على PostgreSQL
npx tsx src/db/seed.ts        # بيانات تجريبية متسقة القيود
```
Env: `DATABASE_URL=postgresql://…` — البوابة: 3000.

---

## 9) الإصدار 1.1 — وحدات التكافؤ الكامل (27 جدول · 32 نقطة نهاية)

وحدات جديدة فوق النواة، تكمل تكافؤ القدرات مع فئة المنصة المرجعية (كود أصلي، لا شيء منسوخ):

| الوحدة | الجداول/الخدمات | نقاط النهاية |
|---|---|---|
| الواجبات | `assignments.service.ts` — إنشاء/تسليم (upsert)/تصحيح مقنن بـ maxScore | GET `/courses/[slug]/assignments` · POST `/assignments/[id]/submissions` · GET/POST `/admin/assignments` · PATCH `/admin/submissions/[id]` |
| المجتمع | `community.service.ts` — وصول = مشترك أو طاقم فقط | GET/POST `/courses/[slug]/posts` · POST `/posts/[id]/like` |
| الإشعارات | `markAllNotificationsRead` | PATCH `/me/notifications` |
| بورتال ولي الأمر | جدول `parent_links` + `parent.service.ts` — **الرابط هو حد التفويض**: بلا رابط → 403 NOT_LINKED | GET `/parent/children/[id]` |
| التقارير | `reports.service.ts` — اشتراكات وإيراد لكل كورس + نسب نجاح ومتوسطات لكل امتحان | GET `/admin/reports` |
| تسليم الملفات | مسار مبوَّب: معاينة مجانية أو اشتراك أو طاقم؛ حارس اجتياز مسار يرفض أي مفتاح خارج `/uploads/`؛ 404 FILE_NOT_UPLOADED عند غياب النسخة الفعلية | GET `/files/[id]` |

قواعد مضافة للأمان: any-submission upsert يُعيد الدرجة إلى null بعد إعادة التسليم؛ التصحيح يتجاوز أقصى درجة → 422 SCORE_OVERFLOW؛ المنشورات والواجبات تتطلب اشتراكًا نشطًا مُتحققًا فيه داخل الخدمة.

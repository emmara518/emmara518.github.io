# IMPORT PLAYBOOK — نقل المحتوى الحقيقي من النظام القديم إلى الجديد

> لماذا هذا الملف؟ **لا يمكن — تقنيًا وقانونيًا — «استخراج باك إند» أي موقع من رابطه العام.**
> المتاح عبر الرابط هو الواجهة الأمامية فقط (HTML/JS/CSS). قاعدة البيانات والمصادقة والمدفوعات
> تعيش خلف الخادم، وسحبها عبر الـ API الخاص بنظام إنتاجي تعمل عليه حسابات مستخدمين حقيقيين
> غير ممكن خارجيًا — وغير مصرّح به. الطريق الصحيح: **تصدير رسمي من جهة المالك ثم استيراد
> منظم هنا** وفق الأشكال أدناه. هذا هو المسار الذي صممناه له المخطط الجديد.

## 1) ما يُصدَّر من النظام القديم (من جانب المالك)

| البيانات | مصدر التصدير المعتاد | ملاحظات |
|---|---|---|
| الكورسات/الدروس | لوحة إدارة المنصة القديمة أو نسخة قاعدة البيانات احتياطية | JSON/CSV |
| YouTube video IDs + playlists | روابط الدروس الحالية | الجزء بعد `watch?v=` وقائمة `list=` |
| ملفات PDF | التخزين القديم | تنزيل إلى `public/uploads/` الجديد |
| المستخدمون (اسم/بريد/هاتف/صف) | تصدير CSV من الإدارة | **كلمات المرور لا تُنقل** — راجع §3 |
| الكوبونات | تصدير بسيط | code + percent + maxUses |
| الأصول البصرية (شعار/صور أستاذ المادة/أغلفة) | مجلد assets المملوك | توضع في `public/brand/` و `public/uploads/covers/` |

## 2) أشكال JSON المستهدفة (تماثل مخرجات seed تمامًا)

`data/import/catalog.json`:
```json
{
  "stages": [{ "name": "المرحلة الثانوية", "slug": "secondary", "sortOrder": 2 }],
  "grades": [{ "stage": "secondary", "name": "الصف الثالث الثانوي", "slug": "sec-3", "sortOrder": 6 }],
  "subjects": [{ "name": "التفاضل والتكامل", "slug": "calculus" }]
}
```

`data/import/courses.json`:
```json
[
  {
    "slug": "calculus-2sec-term1",
    "title": "…",
    "summary": "…", "description": "…",
    "grade": "sec-2", "subject": "calculus",
    "priceEgp": 249,
    "status": "published",
    "lessons": [
      {
        "title": "النهايات", "isFreePreview": true, "sortOrder": 1,
        "videos": [
          { "title": "النهايات — الجزء 1", "youtubeVideoId": "XXXXXXXXXXX", "playlistId": "PL…", "durationSec": 1320, "sortOrder": 1 }
        ]
      }
    ],
    "files": [{ "title": "مذكرة التفاضل", "kind": "book", "storageKey": "/uploads/books/calc-notes.pdf", "sizeBytes": 2400000, "isFreePreview": true }]
  }
]
```

`data/import/users.json`:
```json
[{ "name": "…", "email": "…", "phone": "01…", "role": "student", "grade": "sec-2" }]
```

`data/import/coupons.json`: `[{ "code": "DROS25", "percentOff": 25, "maxUses": 500 }]`

## 3) قواعد إلزامية أثناء النقل

1. **كلمات المرور لا تُصدَّر أبدًا** (لا تنقل التجزئات بين الأنظمة). المستورد يُصدِر لكل مستخدم
   رابط «تعيين كلمة مرور» ويُنشئ حسابًا بحقل `must_reset_password` (منطق التدفق في المرحلة 4).
2. **إعادة ترقيم الفواتير**: أرقام `INV-…` الجديدة تُولَّد من عدّاد النظام الجديد؛
   يُحفظ المرجع القديم في `orders`/meta أو jsonb خارجي للمراجعة فقط.
3. **الخصوصية**: لا تُنقل بيانات دفع أو جلسات أو إشعارات قديمة — الحد الأدنى: الهوية والصف.
4. **التحقق قبَل الفعلي**: شغّل الاستيراد على بيئة staging ثم راجع التقارير (عدّادات لكل جدول).
5. المعرّفات الجديدة UUID — تحفظ خريطة «قديم → جديد» داخل تقرير الاستيراد لأي ربط لاحق.

## 4) أداة الاستيراد (مرحلة 4 — مخططة)

المخطط الجديد صُمِّم بحيث الاستيراد «إدخالات مباشرة» دون أي ترحيل بنيوي.
سكربت مرحلي: `npx tsx src/db/import-legacy.ts --dir data/import --dry-run` يتبع خطوات
seed نفسها بالترتيب: stages→grades→subjects→users→courses→lessons→videos→files→coupons،
مع `--dry-run` للتحقق قبل الكتابة، وتقرير `reports/import-*.json` بعدّادات وخريطة المعرفات.

## 5) الأصول المملوكة (brand slots)

```
public/brand/logo.svg        ← الشعار الرسمي
public/brand/teacher.png     ← صورة أ/ محمد سعيد (تستبدل المونوغرام المؤقت)
public/uploads/covers/*.jpg  ← أغلفة الكورسات الحقيقية
public/uploads/books/*.pdf   ← المذكرات
```
توضع الملفات ثم تُحدَّث `courses.thumbnail`/المكوّنات لقراءة الأصل الحقيقي — دون أي تغيير آخر.

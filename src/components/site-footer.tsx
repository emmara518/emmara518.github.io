import Link from "next/link";
import { LogoWordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-line bg-surface/60">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--brand),var(--gold),transparent)] opacity-60" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <LogoWordmark />
          <p className="max-w-xs text-sm leading-7 text-muted">
            منصة دروس ماث — تجربة تعلم رياضيات عصرية للمرحلتين الإعدادية والثانوية:
            شرح مرئي منظم، اختبارات بتصحيح فوري، ومتابعة دقيقة لتقدمك.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-ink">المنصة</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><Link className="hover:text-brand" href="/courses">جميع الكورسات</Link></li>
            <li><Link className="hover:text-brand" href="/register">إنشاء حساب طالب</Link></li>
            <li><Link className="hover:text-brand" href="/login">تسجيل الدخول</Link></li>
            <li><Link className="hover:text-brand" href="/dashboard">لوحة الطالب</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-ink">المراحل</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li><Link className="hover:text-brand" href="/courses?grade=sec-1">الأول الثانوي</Link></li>
            <li><Link className="hover:text-brand" href="/courses?grade=sec-2">الثاني الثانوي</Link></li>
            <li><Link className="hover:text-brand" href="/courses?grade=sec-3">الثالث الثانوي</Link></li>
            <li><Link className="hover:text-brand" href="/courses">المرحلة الإعدادية</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-ink">بنية المحتوى</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>الفيديوهات مستضافة خارجيًا عبر YouTube</li>
            <li>مذكرات وملفات PDF داخل المنصة</li>
            <li>امتحانات إلكترونية بتصحيح فوري</li>
            <li>محفظة وكوبونات وفواتير إلكترونية</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} دروس ماث · أ/ محمد سعيد — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}

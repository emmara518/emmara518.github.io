import Link from "next/link";
import { LogoWordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-[#22262E] bg-[#050505]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <LogoWordmark />
          <p className="max-w-xs text-xs leading-relaxed text-[#8E98A5]">
            منصة دروس ماث — منصة English Math لطلاب مدارس اللغات والمرحلتين الإعدادية والثانوية مع مستر محمد سعيد.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold font-mono text-white uppercase tracking-wider">المنصة</h3>
          <ul className="space-y-2.5 text-xs text-[#8E98A5]">
            <li><Link className="hover:text-[#B8FF00]" href="/courses">جميع الكورسات</Link></li>
            <li><Link className="hover:text-[#B8FF00]" href="/register">إنشاء حساب طالب</Link></li>
            <li><Link className="hover:text-[#B8FF00]" href="/login">تسجيل الدخول</Link></li>
            <li><Link className="hover:text-[#B8FF00]" href="/dashboard">لوحة الطالب</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold font-mono text-white uppercase tracking-wider">المراحل</h3>
          <ul className="space-y-2.5 text-xs text-[#8E98A5]">
            <li><Link className="hover:text-[#B8FF00]" href="/courses?grade=sec-1">الأول الثانوي</Link></li>
            <li><Link className="hover:text-[#B8FF00]" href="/courses?grade=sec-2">الثاني الثانوي</Link></li>
            <li><Link className="hover:text-[#B8FF00]" href="/courses?grade=sec-3">الثالث الثانوي</Link></li>
            <li><Link className="hover:text-[#B8FF00]" href="/courses">المرحلة الإعدادية</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold font-mono text-white uppercase tracking-wider">بنية المنصة</h3>
          <ul className="space-y-2.5 text-xs text-[#8E98A5]">
            <li>شروحات تفاعلية مستضافة بدون تشتيت</li>
            <li>مذكرات واستنتاجات PDF داخل المنصة</li>
            <li>امتحانات إلكترونية قياسية بتصحيح فوري</li>
            <li>محفظة وكوبونات وفواتير معتمدة</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#22262E] py-5">
        <p className="mx-auto max-w-7xl px-4 text-center font-mono text-[11px] text-[#8E98A5] sm:px-6">
          © {new Date().getFullYear()} DROS MATH · MR. MOHAMED SAEED — ALL RIGHTS RESERVED
        </p>
      </div>
    </footer>
  );
}

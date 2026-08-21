import Link from "next/link";
import { buttonStyles, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-lg place-items-center px-4 py-24 sm:px-6">
      <Card className="grid w-full place-items-center gap-4 p-12 text-center">
        <p className="font-mono text-6xl font-extrabold text-brand">404</p>
        <h1 className="text-xl font-extrabold">صفحة خارج نطاق الحل</h1>
        <p className="text-sm leading-7 text-muted">
          كما في المعادلات… أحيانًا نبحث عن قيمة غير موجودة في المجال. عُد إلى الصفحة الرئيسية وواصل رحلتك.
        </p>
        <Link href="/" className={buttonStyles("primary", "md")}>
          العودة للرئيسية
        </Link>
      </Card>
    </main>
  );
}

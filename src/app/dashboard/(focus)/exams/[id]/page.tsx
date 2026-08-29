import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getExamRoom } from "@/lib/services/exams.service";
import { ServiceError } from "@/lib/errors";
import { ExamRoom } from "@/components/exam-room";
import { Card, buttonStyles } from "@/components/ui";

export const metadata: Metadata = { title: "قاعة الاختبار" };

function ExamError({ code, message }: { code: string; message: string }) {
  const notEnrolled = code === "NOT_ENROLLED";
  return (
    <Card className="grid place-items-center gap-4 p-12 text-center">
      <Lock size={28} className="text-muted" />
      <h1 className="text-xl font-extrabold">{notEnrolled ? "الاختبار للمشتركين فقط" : "الاختبار غير متاح"}</h1>
      <p className="text-sm leading-7 text-muted">{message}</p>
      <Link href="/dashboard/exams" className={buttonStyles("primary", "md")}>
        العودة إلى الاختبارات
      </Link>
    </Card>
  );
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/dashboard/exams/${id}`);

  let room: Awaited<ReturnType<typeof getExamRoom>>;
  let error: ServiceError | null = null;

  try {
    room = await getExamRoom(id, user.id);
  } catch (e) {
    if (e instanceof ServiceError) {
      error = e;
    } else {
      throw e;
    }
  }

  if (error) {
    return <ExamError code={error.code} message={error.message} />;
  }

  return <ExamRoom room={room!} />;
}

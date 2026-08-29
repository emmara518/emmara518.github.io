import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLearningRoom } from "@/lib/services/dashboard.service";
import { ServiceError } from "@/lib/errors";
import { LessonRoom } from "@/components/lesson-room";

export const metadata: Metadata = { title: "غرفة التعلم" };

export default async function LearningRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/dashboard/courses/${slug}`);

  let room;
  try {
    room = await getLearningRoom(user, slug);
  } catch (e) {
    if (e instanceof ServiceError) notFound();
    throw e;
  }

  const sp = await searchParams;
  const lessonIndex = Number(sp.lesson ?? "0");

  let initialVideoId: string | null = null;
  const requested = room.lessons[lessonIndex - 1];
  if (requested?.unlocked && requested.videos[0]?.youtubeVideoId) {
    initialVideoId = requested.videos[0].id;
  }
  if (!initialVideoId) {
    for (const l of room.lessons) {
      const first = l.videos.find((v) => v.youtubeVideoId);
      if (l.unlocked && first) {
        initialVideoId = first.id;
        break;
      }
    }
  }

  return <LessonRoom room={room} initialVideoId={initialVideoId} />;
}

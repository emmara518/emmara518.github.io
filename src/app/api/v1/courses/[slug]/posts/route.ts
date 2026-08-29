import { requireApiUser } from "@/lib/auth";
import { err, ok, parseJson } from "@/lib/http";
import { postSchema } from "@/lib/contracts";
import { createPost, listPosts } from "@/lib/services/community.service";
import { toEnvelope } from "@/lib/errors";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const { slug } = await params;
  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId") ?? undefined;
  try {
    const data = await listPosts(auth.user, slug, groupId);
    return ok(data);
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "يجب تسجيل الدخول");
  const parsed = await parseJson(request, postSchema);
  if ("response" in parsed) return parsed.response;
  const { slug } = await params;
  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId") ?? undefined;
  try {
    const post = await createPost(auth.user, slug, parsed.data.body, { groupId });
    return ok({ post }, { status: 201 });
  } catch (e) {
    const envelope = toEnvelope(e);
    return err(envelope.status, envelope.code, envelope.message);
  }
}

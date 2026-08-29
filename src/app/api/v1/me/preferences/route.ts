import { z } from "zod";
import { requireApiUser } from "@/lib/auth";
import { err, ok, parseJson } from "@/lib/http";
import {
  getPreferences,
  setPreferences,
  type UserPreferences,
} from "@/lib/services/preferences.service";

const densitySchema = z.enum(["comfortable", "compact"]);

const patchSchema = z
  .object({
    notifications: z
      .object({
        community: z.boolean().optional(),
        examResults: z.boolean().optional(),
        wallet: z.boolean().optional(),
        marketing: z.boolean().optional(),
      })
      .optional(),
    density: densitySchema.optional(),
  })
  .strict();

export async function GET() {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");
  const preferences = await getPreferences(auth.user.id);
  return ok({ preferences });
}

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if (!("user" in auth)) return err(auth.status, "UNAUTHENTICATED", "سجل الدخول مطلوب");

  const parsed = await parseJson(request, patchSchema);
  if ("response" in parsed) return parsed.response;

  const preferences: UserPreferences = await setPreferences(auth.user.id, parsed.data);
  return ok({ preferences });
}

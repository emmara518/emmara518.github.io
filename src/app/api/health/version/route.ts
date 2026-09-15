/**
 * Public-safe release identity.
 *
 * Proves TESTED COMMIT == PRODUCTION COMMIT for the ULTRA campaign chain:
 * SOURCE COMMIT → PRODUCTION BUILD → VERCEL DEPLOYMENT → RELEASE ID → LIVE URL.
 *
 * `release` resolves deterministically in production from Vercel's own
 * git metadata (VERCEL_GIT_COMMIT_SHA), with an explicit override
 * (NEXT_PUBLIC_RELEASE_ID) and a `dev` fallback for local builds.
 * Deliberately minimal: no secrets, no env dumps, no infra details.
 */
export const dynamic = "force-dynamic";

const FULL_SHA = process.env.VERCEL_GIT_COMMIT_SHA || "";
const OVERRIDE = process.env.NEXT_PUBLIC_RELEASE_ID || "";
const RELEASE = (FULL_SHA || OVERRIDE).slice(0, 7) || "dev";
const ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

export async function GET() {
  return Response.json({ release: RELEASE, environment: ENVIRONMENT });
}

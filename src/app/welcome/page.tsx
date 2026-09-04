export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { OnboardingStepper } from "@/components/onboarding-stepper";

export const metadata: Metadata = { title: "أهلاً بيك" };

export default async function WelcomePage() {
  const user = await getSessionUser();
  const firstName = user?.name?.split(/\s+/)[0] ?? "يا طالب";

  return <OnboardingStepper firstName={firstName} />;
}


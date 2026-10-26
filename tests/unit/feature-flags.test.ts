import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAutoParentLinkEnabled,
  isPublicRegistrationEnabled,
  isWalletSelfTopUpEnabled,
} from "@/lib/feature-flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Phase B — fail-closed feature flags", () => {
  it("defaults every safety flag to disabled", () => {
    expect(isPublicRegistrationEnabled()).toBe(false);
    expect(isAutoParentLinkEnabled()).toBe(false);
    expect(isWalletSelfTopUpEnabled()).toBe(false);
  });

  it("enables only the exact string 'true'", () => {
    for (const value of ["1", "yes", "TRUE", "on", " true "]) {
      vi.stubEnv("PUBLIC_REGISTRATION_ENABLED", value);
      vi.stubEnv("AUTO_PARENT_LINK_ENABLED", value);
      vi.stubEnv("WALLET_SELF_TOPUP_ENABLED", value);
      expect(isPublicRegistrationEnabled()).toBe(false);
      expect(isAutoParentLinkEnabled()).toBe(false);
      expect(isWalletSelfTopUpEnabled()).toBe(false);
    }
  });

  it("enables each flag independently", () => {
    vi.stubEnv("PUBLIC_REGISTRATION_ENABLED", "true");
    expect(isPublicRegistrationEnabled()).toBe(true);
    expect(isAutoParentLinkEnabled()).toBe(false);
    expect(isWalletSelfTopUpEnabled()).toBe(false);

    vi.stubEnv("AUTO_PARENT_LINK_ENABLED", "true");
    expect(isAutoParentLinkEnabled()).toBe(true);
    expect(isPublicRegistrationEnabled()).toBe(true);

    vi.stubEnv("WALLET_SELF_TOPUP_ENABLED", "true");
    expect(isWalletSelfTopUpEnabled()).toBe(true);
  });
});

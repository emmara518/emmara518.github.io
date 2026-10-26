/**
 * UAT / production safety flags.
 *
 * All flags are fail-closed: only the exact string "true" enables a feature.
 * This prevents an empty, misspelled, or legacy environment variable from
 * silently opening a privileged flow.
 */
function enabled(value: string | undefined): boolean {
  return value === "true";
}

/** Student and parent self-registration. Disabled unless explicitly enabled. */
export function isPublicRegistrationEnabled(): boolean {
  return enabled(process.env.PUBLIC_REGISTRATION_ENABLED);
}

/** Automatic parent linking by guardian phone. Disabled unless explicitly enabled. */
export function isAutoParentLinkEnabled(): boolean {
  return enabled(process.env.AUTO_PARENT_LINK_ENABLED);
}

/** Student-facing self top-up. Disabled unless explicitly enabled. */
export function isWalletSelfTopUpEnabled(): boolean {
  return enabled(process.env.WALLET_SELF_TOPUP_ENABLED);
}

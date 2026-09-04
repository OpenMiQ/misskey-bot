import { isAdmin } from "../config/env.js";
import { resolveLocale } from "../config/settings.js";
import { t } from "../i18n/index.js";
import { hostScope, runScopeCommand, SCOPE_ERRORS } from "./scope.js";

/**
 * `host-settings view|set <tokens>|reset` — defaults for the caller's own
 * host (their home instance; see `resolveHostId()` in `misskey/client.ts`).
 *
 * Unlike Discord's `/server-settings` (gated by the "Manage Server"
 * permission, which Misskey has no equivalent of), this is `ADMIN_IDS`-only
 * for every subcommand, including `view`. Misskey's public `users/show`
 * doesn't expose whether a caller moderates the *local* instance — only the
 * `i` endpoint (self) does — so there's no cheap, reliable way for the bot
 * to grant local moderators a carve-out the way it does for the bot's own
 * account. Keeping this bot-admin-only avoids either building extra admin
 * API plumbing just for that check or, worse, quietly trusting a claim it
 * can't verify.
 */
export async function runHostSettingsCommand(params: {
  args: string;
  callerId: string;
  callerHostId: string;
}): Promise<string> {
  const { callerId, callerHostId } = params;
  if (!isAdmin(callerId)) {
    const locale = resolveLocale({ userId: callerId, hostId: callerHostId });
    return t(SCOPE_ERRORS.adminOnly, locale);
  }
  return runScopeCommand({
    scope: hostScope(callerHostId),
    args: params.args,
    callerId,
    callerHostId,
  });
}

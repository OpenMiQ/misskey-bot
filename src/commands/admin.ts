import { isAdmin } from "../config/env.js";
import { resolveLocale } from "../config/settings.js";
import { t } from "../i18n/index.js";
import { botScope, runScopeCommand, SCOPE_ERRORS } from "./scope.js";

/** `admin view|set <tokens>|reset` — the bot's own bot-wide defaults, `ADMIN_IDS` only. */
export async function runAdminCommand(params: {
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
    scope: botScope(),
    args: params.args,
    callerId,
    callerHostId,
  });
}

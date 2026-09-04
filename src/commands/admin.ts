import { isAdmin } from "../config/env.js";
import { resolveLocale } from "../config/settings.js";
import { t, type Translations } from "../i18n/index.js";
import { repostPinnedNotes } from "../pinnedNotes.js";
import { botScope, runScopeCommand, SCOPE_ERRORS } from "./scope.js";

const STRINGS = {
  repostSuccess: {
    en: "Deleted the old pinned help/credits notes and posted fresh ones.",
    ja: "既存のピン留めヘルプ/クレジットノートを削除し、新しいものを投稿しました。",
  },
} satisfies Record<string, Translations>;

/**
 * `admin view|set <tokens>|reset` — the bot's own bot-wide defaults, plus
 * `admin repost-pins` (both `ADMIN_IDS` only): deletes and reposts the
 * pinned help/credits notes, for after editing their content in code —
 * `pinnedNotes.ts`'s own startup check only fills in what's *missing*, it
 * never refreshes a note that's still there.
 */
export async function runAdminCommand(params: {
  args: string;
  callerId: string;
  callerHostId: string;
}): Promise<string> {
  const { callerId, callerHostId } = params;
  const locale = resolveLocale({ userId: callerId, hostId: callerHostId });
  if (!isAdmin(callerId)) {
    return t(SCOPE_ERRORS.adminOnly, locale);
  }

  const [subRaw] = params.args.trim().split(/\s+/);
  if (subRaw?.toLowerCase() === "repost-pins") {
    await repostPinnedNotes();
    return t(STRINGS.repostSuccess, locale);
  }

  return runScopeCommand({
    scope: botScope(),
    args: params.args,
    callerId,
    callerHostId,
  });
}

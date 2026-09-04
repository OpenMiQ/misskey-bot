import { resolveLocale } from "../config/settings.js";
import { normalizeLocale, t, type Translations } from "../i18n/index.js";
import {
  createNote,
  deleteNote,
  getSelf,
  resolveHostId,
} from "../misskey/client.js";
import { HELP_REACTION_EMOJI, takePendingHelp } from "../pendingHelp.js";
import { pinnedNoteUrl } from "../pinnedNotes.js";
import { QUOTE_MESSAGES } from "../quoteMessages.js";
import { DELETE_REACTION_EMOJI } from "../reactions.js";
import type { ReactionNotification } from "../misskey/stream.js";
import { deleteQuoteState, getQuoteState } from "../state.js";

/**
 * Misskey's `ReactionService.normalize()` strips U+FE0F (variation
 * selector-16) from any non-ZWJ emoji before storing/broadcasting a
 * reaction, so a `notification.reaction` never carries it even when the
 * client that sent it did — but comparing here without doing the same
 * strip would still break if a differently-fully-qualified glyph is ever
 * used for one of these two reactions. `reactions.ts`/`pendingHelp.ts`'s
 * constants are already written in the post-strip form; this just makes
 * the comparison itself resilient to that, not just the constants.
 */
export function stripVariationSelector(reaction: string): string {
  return reaction.replace(/\ufe0f/g, "");
}

const STRINGS = {
  deleteNotAllowed: {
    en: "Only the person who made this quote, or the person it's about, can delete it.",
    ja: "この引用を削除できるのは、作成した本人か、引用対象になった本人だけです。",
  },
  helpPinned: {
    en: "Help & credits are pinned to my profile: {{url}}",
    ja: "ヘルプとクレジットはプロフィールにピン留めしています: {{url}}",
  },
  helpNotReady: {
    en: "Help isn't ready yet — please try again in a moment.",
    ja: "ヘルプがまだ準備できていません。少し待ってから再度お試しください。",
  },
} satisfies Record<string, Translations>;

/**
 * Handles a reaction on one of the bot's own notes: the ❓ help offer, and
 * the 🗑️ delete reaction on a posted quote. Replaces OpenMiQ's Discord
 * `onInteractionCreate` for everything that isn't a text command (those go
 * through `commands/textCommand.ts` from `handlers/mention.ts` instead —
 * there's no button/select-menu equivalent here, see the README).
 */
export async function onReaction(
  notification: ReactionNotification,
): Promise<void> {
  const self = getSelf();
  if (notification.user.id === self.id) return; // ignore the bot's own reactions

  const reaction = stripVariationSelector(notification.reaction);
  if (reaction === HELP_REACTION_EMOJI) {
    await handleHelpReaction(notification);
    return;
  }
  if (reaction === DELETE_REACTION_EMOJI) {
    await handleDeleteReaction(notification);
    return;
  }
}

/**
 * Points a ❓ press at the pinned help note instead of reposting its full
 * content — the help text now lives permanently pinned on the bot's own
 * profile (see `pinnedNotes.ts`), so there's nothing left to build here.
 */
async function handleHelpReaction(
  notification: ReactionNotification,
): Promise<void> {
  const pending = takePendingHelp(notification.note.id);
  if (!pending || pending.requesterId !== notification.user.id) return;

  const locale = normalizeLocale(pending.locale);
  const url = pinnedNoteUrl("help");
  await createNote({
    text: url
      ? t(STRINGS.helpPinned, locale, { url })
      : t(STRINGS.helpNotReady, locale),
    replyId: notification.note.id,
  }).catch(() => {});
}

async function handleDeleteReaction(
  notification: ReactionNotification,
): Promise<void> {
  const state = getQuoteState(notification.note.id);
  const hostId = resolveHostId(notification.user.host);
  const locale = resolveLocale({ userId: notification.user.id, hostId });

  if (!state) {
    await createNote({
      text: t(QUOTE_MESSAGES.deleteExpired, locale),
      replyId: notification.note.id,
    }).catch(() => {});
    return;
  }

  const authorized =
    notification.user.id === state.generatorId ||
    notification.user.id === state.targetId;
  if (!authorized) {
    await createNote({
      text: t(STRINGS.deleteNotAllowed, locale),
      replyId: notification.note.id,
    }).catch(() => {});
    return;
  }

  await deleteNote(notification.note.id);
  deleteQuoteState(notification.note.id);
}

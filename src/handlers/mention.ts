import { MiQ, type QuoteData } from "makeitaquote";
import type { entities } from "misskey-js";
import { watermarkLogo } from "../branding.js";
import { ALL_COLOR_THEME_LIST } from "../colorThemes.js";
import { MISSKEY_URL } from "../config/env.js";
import {
  deleteReactionEnabled,
  resolveLocale,
  resolveQuoteSettings,
} from "../config/settings.js";
import { dispatchTextCommand } from "../commands/textCommand.js";
import { FONT_ALIAS_LIST } from "../fonts.js";
import { t } from "../i18n/index.js";
import {
  createNote,
  getSelf,
  react,
  resolveHostId,
  unreact,
  uploadImage,
} from "../misskey/client.js";
import { stripBotMention } from "../mentionText.js";
import { fetchReferencedNote } from "../noteRefs.js";
import {
  addPendingHelp,
  HELP_REACTION_EMOJI,
  HELP_REACTION_TIMEOUT_MS,
} from "../pendingHelp.js";
import { findChainTop } from "../quoteChain.js";
import { QUOTE_MESSAGES } from "../quoteMessages.js";
import { renderQuote } from "../render.js";
import { DELETE_REACTION_EMOJI } from "../reactions.js";
import { saveQuoteState } from "../state.js";

const miqOptions = () => (MISSKEY_URL ? { misskey: MISSKEY_URL } : undefined);

/** Handles a note that mentions the bot — replaces OpenMiQ's Discord `onMessageCreate`. */
export async function onMention(note: entities.Note): Promise<void> {
  const self = getSelf();
  if (note.userId === self.id) return; // never react to itself

  const strippedText = stripBotMention(note.text ?? "", self.username);
  const caller = { id: note.userId, host: note.user.host };
  const callerHostId = resolveHostId(caller.host);
  const locale = resolveLocale({ userId: caller.id, hostId: callerHostId });

  const result = await dispatchTextCommand(strippedText, caller);

  if (result.kind === "text") {
    if (result.text) await createNote({ text: result.text, replyId: note.id });
    return;
  }

  if (result.kind === "fakequote") {
    const fq = result.result;
    if (fq.kind === "error") {
      if (fq.text) await createNote({ text: fq.text, replyId: note.id });
      return;
    }
    await postQuoteImage({
      png: fq.png,
      replyId: note.id,
      quoteState: fq.quoteState,
    });
    return;
  }

  // result.kind === "quote": the default "quote the note this mention
  // replies to" flow, same fallback as OpenMiQ's Discord mention handler.
  const { settings: inline, unknownFont, unknownTheme } = result.invocation;

  if (unknownFont) {
    await createNote({
      text: t(QUOTE_MESSAGES.unknownFont, locale, {
        token: unknownFont,
        aliases: FONT_ALIAS_LIST,
      }),
      replyId: note.id,
    });
    return;
  }
  if (unknownTheme) {
    await createNote({
      text: t(QUOTE_MESSAGES.unknownTheme, locale, {
        token: unknownTheme,
        themes: ALL_COLOR_THEME_LIST,
      }),
      replyId: note.id,
    });
    return;
  }

  const target = await fetchReferencedNote(note);
  if (!target || !target.text?.trim()) {
    await offerHelpOnReaction(note, locale);
    return;
  }

  const settings = resolveQuoteSettings({
    userId: caller.id,
    hostId: callerHostId,
    inline,
  });

  const data: QuoteData = new MiQ(miqOptions())
    .setFromNote(target, { markdown: "raw" })
    .setWatermark(watermarkLogo() ?? `@${self.username}`)
    .getData();
  const chainTop = await findChainTop(target, settings);
  const png = await renderQuote(data, settings, { chainTop });

  await postQuoteImage({
    png,
    replyId: note.id,
    quoteState: deleteReactionEnabled(callerHostId)
      ? { generatorId: caller.id, targetId: target.userId }
      : undefined,
  });
}

async function postQuoteImage(params: {
  png: Buffer;
  replyId: string;
  quoteState?: { generatorId: string; targetId: string };
}): Promise<void> {
  const fileId = await uploadImage(params.png, "quote.png");
  const posted = await createNote({
    text: null,
    replyId: params.replyId,
    fileIds: [fileId],
  });

  if (params.quoteState) {
    saveQuoteState(posted.id, params.quoteState);
    await react(posted.id, DELETE_REACTION_EMOJI).catch(() => {});
  }
}

/**
 * No note to quote: rather than a reply that just gets deleted a moment
 * later, react with a question mark the mentioning user can press for help
 * — quieter for a timeline that just wants the bot to stop talking to it.
 */
async function offerHelpOnReaction(
  note: entities.Note,
  locale: string,
): Promise<void> {
  const reacted = await react(note.id, HELP_REACTION_EMOJI)
    .then(() => true)
    .catch(() => false);
  if (!reacted) return;

  const timeout = setTimeout(() => {
    void unreact(note.id).catch(() => {});
  }, HELP_REACTION_TIMEOUT_MS);
  // Node's timer would otherwise keep the process alive just for this.
  timeout.unref?.();

  addPendingHelp(note.id, { requesterId: note.userId, locale, timeout });
}

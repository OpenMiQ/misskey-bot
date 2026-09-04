import type { entities } from "misskey-js";
import { MiQ, type QuoteData } from "makeitaquote";
import { MISSKEY_URL } from "./config/env.js";
import { fetchReferencedNote } from "./noteRefs.js";
import type { QuoteSettings } from "./quoteOptions.js";

/**
 * When `settings.chain` asked for it and `target` (the note being quoted)
 * is itself a reply, reads off the note it's replying to the same way
 * `target` itself gets read — for `render.ts`'s `RenderQuoteOptions.chainTop`.
 *
 * `null` when chaining wasn't requested, `target` isn't a reply, the reply
 * source has no text, or it couldn't be fetched (deleted, no access, …) —
 * callers fall back to a single quote in every one of those cases, same as
 * if `chain` had never been asked for.
 */
export async function findChainTop(
  target: entities.Note,
  settings: QuoteSettings,
): Promise<QuoteData | null> {
  if (!settings.chain) return null;

  const replySource = await fetchReferencedNote(target);
  if (!replySource || !replySource.text?.trim()) return null;

  const miqOptions = MISSKEY_URL ? { misskey: MISSKEY_URL } : undefined;
  return new MiQ(miqOptions)
    .setFromNote(replySource, { markdown: "raw" })
    .getData();
}

import { buildHelpPages } from "./commands/help.js";
import { creditsText } from "./commands/credits.js";
import { JsonStore } from "./config/store.js";
import { DEFAULT_LOCALE, MISSKEY_URL } from "./config/env.js";
import { createNote, getSelf, pin, showNote } from "./misskey/client.js";

type PinnedKind = "help" | "credits";

interface PinnedNoteRecord {
  /** Every note in the kind's reply chain, root first — all of them get pinned. */
  noteIds: string[];
}

const store = new JsonStore<PinnedNoteRecord>("pinnedNotes.json");

/** Loads the pinned-note record store from disk. Call once at startup, before `ensurePinnedNotes()`. */
export function loadPinnedNotesStore(): void {
  store.load();
}

/** The URL of the pinned help/credits note's root, if it's been posted yet. */
export function pinnedNoteUrl(kind: PinnedKind): string | undefined {
  const noteId = store.get(kind)?.noteIds[0];
  return noteId ? `${MISSKEY_URL}/notes/${noteId}` : undefined;
}

/**
 * Posts and pins the help/credits notes for the bot's `DEFAULT_LOCALE`,
 * once — replaces OpenMiQ's `help`/`credits` slash commands (and this
 * bot's own former `help`/`credits` text commands): rather than answering
 * each mention with a fresh copy, the bot keeps one standing, pinned copy
 * on its own profile. Skips a kind whose notes all still exist (checked
 * via `notes/show`, so one deleted out-of-band gets the whole kind
 * recreated); does *not* detect the notes' own text having drifted from
 * the current build — editing the help/credits content in code doesn't
 * refresh already-pinned notes, only recreating them does (delete the
 * stale ones, or their `data/pinnedNotes.json` entry, first).
 *
 * Only `DEFAULT_LOCALE`, not every `SUPPORTED_LOCALES` entry: Misskey caps
 * how many notes an account can pin (5 by default) — help alone needs two
 * notes (its font/color-theme lists don't fit in one), so pinning every
 * page for more than one language doesn't fit that limit.
 *
 * Every note in a multi-page thread gets pinned, not just the root — a
 * profile visitor would otherwise have to know to open the thread to find
 * page 2. `i/pin` prepends each newly-pinned note to the front of the
 * profile's pin list (most-recently-pinned first), so notes are pinned in
 * the *reverse* of their intended reading order — credits first, then
 * help's pages back-to-front — so the final list reads top-to-bottom as
 * help p1, help p2, credits.
 */
export async function ensurePinnedNotes(): Promise<void> {
  const botMention = `@${getSelf().username}`;
  const locale = DEFAULT_LOCALE;

  await ensurePinned("credits", [creditsText(locale)]);
  await ensurePinned("help", buildHelpPages(locale, botMention));
}

async function ensurePinned(
  kind: PinnedKind,
  pages: readonly string[],
): Promise<void> {
  const existing = store.get(kind)?.noteIds ?? [];
  if (existing.length > 0) {
    const stillThere = await Promise.all(existing.map(showNote));
    if (stillThere.every((note) => note !== null)) return;
  }

  const noteIds: string[] = [];
  let replyId: string | undefined;
  for (const text of pages) {
    const posted = await createNote({ text, replyId });
    noteIds.push(posted.id);
    replyId = posted.id;
  }
  if (noteIds.length === 0) return;

  await store.set(kind, { noteIds });
  for (const noteId of [...noteIds].reverse()) {
    await pin(noteId).catch((error: unknown) =>
      console.error(`Failed to pin a ${kind} note (${noteId}):`, error),
    );
  }
}

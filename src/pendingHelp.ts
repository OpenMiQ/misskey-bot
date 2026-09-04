/**
 * A mention with no note to quote reacts with ❓ instead of replying (and
 * then having to delete) a usage message — press that reaction within a
 * minute and it replies with `help`'s text. This tracks which mention notes
 * are currently waiting for that press. Mirrors OpenMiQ's Discord
 * `createReactionCollector` fallback in `handlers/messageCreate.ts`, using
 * a timer instead of discord.js's collector since `misskey-js` has no
 * built-in equivalent.
 */
export const HELP_REACTION_EMOJI = "❓";
export const HELP_REACTION_TIMEOUT_MS = 60_000;

export interface PendingHelp {
  requesterId: string;
  locale: string;
  timeout: NodeJS.Timeout;
}

const pending = new Map<string, PendingHelp>();

export function addPendingHelp(noteId: string, entry: PendingHelp): void {
  pending.set(noteId, entry);
}

/** Consumes (removes) the pending help offer for `noteId`, if any is still waiting. */
export function takePendingHelp(noteId: string): PendingHelp | undefined {
  const entry = pending.get(noteId);
  if (entry) pending.delete(noteId);
  return entry;
}

export function clearPendingHelp(noteId: string): void {
  const entry = pending.get(noteId);
  if (entry) {
    clearTimeout(entry.timeout);
    pending.delete(noteId);
  }
}

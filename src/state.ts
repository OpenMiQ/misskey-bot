import QuickLRU from "quick-lru";

/**
 * What the delete reaction needs to know about a posted quote — unlike
 * OpenMiQ's Discord version, v1 has no post-quote re-rendering (see the
 * plan/README), so this is much smaller than that version's `QuoteState`:
 * just enough to authorize a 🗑️ reaction and know what to delete.
 */
export interface QuoteState {
  /** Who ran the mention/command that generated this quote. */
  generatorId: string;
  /** Whose name/avatar (or quoted note) this quote is about — may be the same person as `generatorId`. */
  targetId: string;
}

/**
 * In-memory store of posted quotes eligible for the delete reaction, keyed
 * by the bot's reply note ID. Least-recently-used entries are evicted first
 * once the cache grows past `maxSize`; state does not survive a restart —
 * a note posted before the last restart just can't be deleted via reaction
 * anymore (mirrors OpenMiQ's own Discord-button caveat).
 */
const store = new QuickLRU<string, QuoteState>({ maxSize: 500 });

export function saveQuoteState(noteId: string, state: QuoteState): void {
  store.set(noteId, state);
}

export function getQuoteState(noteId: string): QuoteState | undefined {
  return store.get(noteId);
}

export function deleteQuoteState(noteId: string): void {
  store.delete(noteId);
}

import type { entities } from "misskey-js";
import { showNote } from "./misskey/client.js";

/**
 * The note `note` is a reply to, or `null` when it isn't a reply, or
 * fetching it fails (deleted, no access, …). Shared by the mention handler
 * (what the mention itself replies to) and chain building (what a quoted
 * note itself replies to).
 *
 * Misskey packs the immediate parent note inline as `note.reply` in most
 * contexts already, so this only falls back to a `notes/show` round-trip
 * when that wasn't included.
 */
export async function fetchReferencedNote(
  note: entities.Note,
): Promise<entities.Note | null> {
  if (!note.replyId) return null;
  if (note.reply) return note.reply;
  return showNote(note.replyId);
}

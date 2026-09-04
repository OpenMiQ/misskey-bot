import * as Misskey from "misskey-js";
import { MISSKEY_TOKEN, MISSKEY_URL } from "../config/env.js";

if (!MISSKEY_URL) {
  throw new Error("MISSKEY_URL is not set. Put it in .env or the environment.");
}
if (!MISSKEY_TOKEN) {
  throw new Error(
    "MISSKEY_TOKEN is not set. Put it in .env or the environment.",
  );
}

export const api = new Misskey.api.APIClient({
  origin: MISSKEY_URL,
  credential: MISSKEY_TOKEN,
});

/** The bot's own account — fetched once at startup and cached. */
let self: Misskey.entities.MeDetailed | undefined;

export async function loadSelf(): Promise<Misskey.entities.MeDetailed> {
  self = await api.request("i", {});
  return self;
}

/** The bot's own account, once `loadSelf()` has run at startup. */
export function getSelf(): Misskey.entities.MeDetailed {
  if (!self) throw new Error("loadSelf() hasn't run yet.");
  return self;
}

/**
 * A stable string key for "who this user's defaults are grouped with" — the
 * bot's own local instance's hostname for local users (Misskey's own API
 * represents that as `host: null`), or the remote instance's hostname
 * as-is. See `config/settings.ts`'s host-scope doc comment.
 */
export function resolveHostId(userHost: string | null | undefined): string {
  return userHost ?? new URL(MISSKEY_URL).host;
}

export async function showNote(
  noteId: string,
): Promise<Misskey.entities.Note | null> {
  try {
    return await api.request("notes/show", { noteId });
  } catch {
    return null;
  }
}

export async function showUser(params: {
  userId?: string;
  username?: string;
  host?: string | null;
}): Promise<Misskey.entities.UserDetailed | null> {
  try {
    if (params.userId) {
      return await api.request("users/show", { userId: params.userId });
    }
    if (params.username) {
      return await api.request("users/show", {
        username: params.username,
        host: params.host ?? null,
      });
    }
    return null;
  } catch {
    return null;
  }
}

export interface CreateNoteParams {
  text: string | null;
  replyId?: string;
  fileIds?: string[];
  visibility?: "public" | "home" | "followers" | "specified";
}

export async function createNote(
  params: CreateNoteParams,
): Promise<Misskey.entities.Note> {
  const { createdNote } = await api.request("notes/create", params);
  return createdNote;
}

export async function deleteNote(noteId: string): Promise<void> {
  await api.request("notes/delete", { noteId });
}

export async function react(noteId: string, reaction: string): Promise<void> {
  await api.request("notes/reactions/create", { noteId, reaction });
}

export async function unreact(noteId: string): Promise<void> {
  await api.request("notes/reactions/delete", { noteId });
}

/** Pins one of the bot's own notes to its profile — see `pinnedNotes.ts`. */
export async function pin(noteId: string): Promise<void> {
  await api.request("i/pin", { noteId });
}

/**
 * Uploads a PNG to the bot's drive and returns its file id, for
 * `notes/create`'s `fileIds`. Node ≥18's global `File`/`FormData`/`fetch`
 * are what `APIClient` actually sends this through — no extra HTTP/form
 * library needed.
 */
export async function uploadImage(
  png: Buffer,
  fileName: string,
): Promise<string> {
  const file = new File([new Uint8Array(png)], fileName, {
    type: "image/png",
  });
  const created = await api.request("drive/files/create", { file });
  return created.id;
}

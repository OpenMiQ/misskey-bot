import path from "node:path";

/** The Misskey instance to connect to, e.g. `https://misskey.example` (no trailing slash). */
export const MISSKEY_URL = (process.env.MISSKEY_URL ?? "").replace(/\/+$/, "");

/** The bot account's access token. */
export const MISSKEY_TOKEN = process.env.MISSKEY_TOKEN ?? "";

/** Misskey user IDs allowed to run the `admin` text command. */
export const ADMIN_IDS: ReadonlySet<string> = new Set(
  (process.env.ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

export function isAdmin(userId: string): boolean {
  return ADMIN_IDS.has(userId);
}

/** Where per-user/host/bot settings are persisted as JSON. */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");

/** Locale used when nothing else (user, host, bot default) sets one. */
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE?.trim() || "en";

/** Directory to also save a copy of every generated image to. Disabled (`null`) by default. */
export const SAVE_IMAGES_DIR = process.env.SAVE_IMAGES_DIR?.trim()
  ? path.resolve(process.env.SAVE_IMAGES_DIR.trim())
  : null;

/** The bot's logo image, drawn as the quote watermark in place of the bot's tag. Unset (`null`) by default — the watermark stays the bot's tag. */
export const LOGO_PATH = process.env.LOGO_PATH?.trim()
  ? path.resolve(process.env.LOGO_PATH.trim())
  : null;

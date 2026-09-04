import { MISSKEY_URL } from "./config/env.js";

/**
 * Strips the bot's own `@username`/`@username@host` mention token(s) from a
 * note's text, so the remainder can be parsed as command/option text —
 * Misskey mentions are plain text, unlike Discord's `<@id>` tokens, so
 * there's no ID to match against, just the bot's own handle.
 *
 * Matches case-insensitively (Misskey usernames are case-insensitive) and
 * requires a non-word character (or string boundary) on both sides, so
 * `@miqbot2` doesn't get truncated into a match for a bot named `miqbot`.
 * The optional `@host` half only matches the bot's *own* instance host
 * (from `MISSKEY_URL`) — a remote mentioner writes `@botname@thisHost`, a
 * local one just `@botname`.
 */
export function stripBotMention(text: string, botUsername: string): string {
  const host = MISSKEY_URL ? new URL(MISSKEY_URL).host : "";
  const escapedUser = botUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hostPart = host
    ? `(?:@${host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})?`
    : "";
  const re = new RegExp(`(?<![\\w@])@${escapedUser}${hostPart}\\b`, "gi");
  return text.replace(re, " ").trim();
}

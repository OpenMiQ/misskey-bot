import { DEFAULT_LOCALE } from "./env.js";
import { JsonStore } from "./store.js";
import { DEFAULT_SETTINGS, type QuoteSettings } from "../quoteOptions.js";

export interface ScopeSettings {
  language?: string;
  quoteDefaults?: Partial<QuoteSettings>;
  /**
   * `fakequote` is blocked here. Meaning depends on scope: for a user it
   * means "don't let others put words in my mouth"; for a host or the bot it
   * disables the command outright.
   */
  fakeQuoteDisabled?: boolean;
  /**
   * Hides the "(fake) @username" marker `fakequote` normally adds. Scope is
   * bot, host, or the *invoker* (not the impersonated author, unlike
   * `fakeQuoteDisabled` above) — see fakeQuoteLabelHidden().
   */
  fakeQuoteLabelDisabled?: boolean;
  /** Disables the delete reaction on posted quotes — host/bot scope only. */
  deleteReactionDisabled?: boolean;
}

const BOT_KEY = "bot";

const userStore = new JsonStore<ScopeSettings>("users.json");
const hostStore = new JsonStore<ScopeSettings>("hosts.json");
const botStore = new JsonStore<ScopeSettings>("bot.json");

/** Loads all three stores from disk. Call once at startup, before connecting. */
export function loadSettingsStores(): void {
  userStore.load();
  hostStore.load();
  botStore.load();
}

function mergeScope(
  current: ScopeSettings,
  patch: ScopeSettings,
): ScopeSettings {
  const quoteDefaults = { ...current.quoteDefaults, ...patch.quoteDefaults };
  return {
    language: patch.language ?? current.language,
    quoteDefaults: Object.keys(quoteDefaults).length
      ? quoteDefaults
      : undefined,
    fakeQuoteDisabled: patch.fakeQuoteDisabled ?? current.fakeQuoteDisabled,
    fakeQuoteLabelDisabled:
      patch.fakeQuoteLabelDisabled ?? current.fakeQuoteLabelDisabled,
    deleteReactionDisabled:
      patch.deleteReactionDisabled ?? current.deleteReactionDisabled,
  };
}

export function getUserSettings(userId: string): ScopeSettings {
  return userStore.get(userId) ?? {};
}
export async function setUserSettings(
  userId: string,
  patch: ScopeSettings,
): Promise<void> {
  await userStore.set(userId, mergeScope(getUserSettings(userId), patch));
}
export async function resetUserSettings(userId: string): Promise<void> {
  await userStore.delete(userId);
}

/**
 * `hostId` is the Misskey `host` of the user who mentioned the bot — the
 * bot's own local instance is just one host value among others (see
 * `resolveHostId()` in `misskey/client.ts`), not a special `null` case. This
 * is what used to be Discord's per-guild scope: there's no "server"
 * membership concept in Misskey, but grouping defaults by the mentioning
 * user's home instance serves the same purpose and generalizes to the bot
 * someday fielding mentions from many instances.
 */
export function getHostSettings(hostId: string): ScopeSettings {
  return hostStore.get(hostId) ?? {};
}
export async function setHostSettings(
  hostId: string,
  patch: ScopeSettings,
): Promise<void> {
  await hostStore.set(hostId, mergeScope(getHostSettings(hostId), patch));
}
export async function resetHostSettings(hostId: string): Promise<void> {
  await hostStore.delete(hostId);
}

export function getBotDefaults(): ScopeSettings {
  return botStore.get(BOT_KEY) ?? {};
}
export async function setBotDefaults(patch: ScopeSettings): Promise<void> {
  await botStore.set(BOT_KEY, mergeScope(getBotDefaults(), patch));
}
export async function resetBotDefaults(): Promise<void> {
  await botStore.delete(BOT_KEY);
}

/**
 * Merges saved quote-option defaults with what a mention actually asked
 * for: bot-wide < host < user < inline (this invocation's own options).
 */
export function resolveQuoteSettings(params: {
  userId: string;
  hostId: string;
  inline: Partial<QuoteSettings>;
}): QuoteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...getBotDefaults().quoteDefaults,
    ...getHostSettings(params.hostId).quoteDefaults,
    ...getUserSettings(params.userId).quoteDefaults,
    ...params.inline,
  };
}

/** Same precedence as {@link resolveQuoteSettings}, for the reply's language. */
export function resolveLocale(params: {
  userId: string;
  hostId: string;
}): string {
  return (
    getUserSettings(params.userId).language ??
    getHostSettings(params.hostId).language ??
    getBotDefaults().language ??
    DEFAULT_LOCALE
  );
}

/**
 * Why `fakequote` is blocked for this author, checked in the same
 * precedence as everything else — bot, then host, then the author's own
 * opt-out — or `null` if it isn't blocked.
 */
export function fakeQuoteBlockReason(params: {
  authorId: string;
  hostId: string;
}): "bot" | "host" | "user" | null {
  if (getBotDefaults().fakeQuoteDisabled) return "bot";
  if (getHostSettings(params.hostId).fakeQuoteDisabled) return "host";
  if (getUserSettings(params.authorId).fakeQuoteDisabled) return "user";
  return null;
}

/**
 * Whether the delete reaction should be offered on a posted quote —
 * bot-wide, then host, can turn it off; on by default. No user-level
 * override, since this is a moderation setting rather than a personal
 * preference.
 */
export function deleteReactionEnabled(hostId: string): boolean {
  if (getBotDefaults().deleteReactionDisabled) return false;
  if (getHostSettings(hostId).deleteReactionDisabled) return false;
  return true;
}

/**
 * Whether `fakequote`'s "(fake) @username" marker should be hidden for this
 * invocation — bot, host, or the *invoker themselves* can opt out (on by
 * default). This is about the invoker's own fakequotes, not the
 * impersonated author's — see fakeQuoteBlockReason() for that one.
 */
export function fakeQuoteLabelHidden(params: {
  invokerId: string;
  hostId: string;
}): boolean {
  if (getBotDefaults().fakeQuoteLabelDisabled) return true;
  if (getHostSettings(params.hostId).fakeQuoteLabelDisabled) return true;
  return Boolean(getUserSettings(params.invokerId).fakeQuoteLabelDisabled);
}

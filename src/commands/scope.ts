import {
  getBotDefaults,
  getHostSettings,
  getUserSettings,
  resetBotDefaults,
  resetHostSettings,
  resetUserSettings,
  resolveLocale,
  setBotDefaults,
  setHostSettings,
  setUserSettings,
  type ScopeSettings,
} from "../config/settings.js";
import { ALL_COLOR_THEME_LIST } from "../colorThemes.js";
import { FONT_ALIAS_LIST } from "../fonts.js";
import {
  getAvailableLocales,
  isSupportedLocale,
  t,
  type Translations,
} from "../i18n/index.js";
import { parseOptions, type QuoteSettings } from "../quoteOptions.js";

const STRINGS = {
  scopeUser: { en: "your", ja: "あなたの" },
  scopeHost: { en: "this instance's", ja: "このインスタンスの" },
  scopeBot: { en: "the bot's", ja: "Botの" },

  fieldLanguage: { en: "Language", ja: "言語" },
  fieldColor: { en: "Color", ja: "カラー" },
  fieldBold: { en: "Bold", ja: "太字" },
  fieldLight: { en: "Light theme", ja: "ライトテーマ" },
  fieldFlip: { en: "Flip", ja: "反転" },
  fieldLayout: { en: "Layout", ja: "レイアウト" },
  fieldChain: { en: "Chain", ja: "連結" },
  fieldFont: { en: "Font", ja: "フォント" },
  fieldTheme: { en: "Color theme", ja: "カラーテーマ" },
  fieldFakequoteBlocked: { en: "Fakequote blocked", ja: "Fakequoteのブロック" },
  fieldDeleteReaction: {
    en: "Delete reaction",
    ja: "削除リアクション",
  },
  fieldFakeLabel: { en: "Fake label", ja: "Fakeの表示" },

  valueOn: { en: "on", ja: "オン" },
  valueOff: { en: "off", ja: "オフ" },
  valueNotSet: { en: "not set", ja: "未設定" },
  valueSide: { en: "side", ja: "横画像" },
  valueNew: { en: "new", ja: "縦画像" },

  viewTitle: { en: "{{scope}} defaults", ja: "{{scope}}デフォルト" },
  viewEmpty: {
    en: "{{scope}} defaults aren't set — using the fallback for everything.",
    ja: "{{scope}}デフォルトは設定されていません。すべてフォールバック値が使われます。",
  },
  setSuccess: {
    en: "Saved {{scope}} defaults.",
    ja: "{{scope}}デフォルトを保存しました。",
  },
  resetSuccess: {
    en: "Reset {{scope}} defaults.",
    ja: "{{scope}}デフォルトをリセットしました。",
  },

  errorAdminOnly: {
    en: "Only bot admins can do this.",
    ja: "この操作はBot管理者のみ実行できます。",
  },
  errorInvalidLocale: {
    en: 'Unknown language "{{locale}}". Available: {{locales}}.',
    ja: '不明な言語です: "{{locale}}"。利用可能: {{locales}}',
  },
  errorInvalidFont: {
    en: 'Unknown font "{{token}}". Available: {{aliases}}.',
    ja: '不明なフォントです: "{{token}}"。利用可能: {{aliases}}',
  },
  errorInvalidTheme: {
    en: 'Unknown color theme "{{token}}". Available: {{themes}}.',
    ja: '不明なカラーテーマです: "{{token}}"。利用可能: {{themes}}',
  },
  errorNoOptions: {
    en: 'Give at least one option to set, e.g. "settings set color lang=ja".',
    ja: '少なくとも1つオプションを指定してください。例: "settings set color lang=ja"',
  },
  errorUnknownSubcommand: {
    en: 'Unknown subcommand "{{sub}}". Use "view", "set …" or "reset".',
    ja: '不明なサブコマンドです: "{{sub}}"。"view"、"set …"、"reset" のいずれかを指定してください。',
  },
} satisfies Record<string, Translations>;

/** Error message a caller-restricted scope command (`host-settings`, `admin`) needs before dispatching in. */
export const SCOPE_ERRORS = {
  adminOnly: STRINGS.errorAdminOnly,
};

const SCOPE_LABEL: Record<"user" | "host" | "bot", Translations> = {
  user: STRINGS.scopeUser,
  host: STRINGS.scopeHost,
  bot: STRINGS.scopeBot,
};

/**
 * A settings scope — user, host, or bot — abstracted so the `settings` /
 * `host-settings` / `admin` text commands can share one
 * view/set/reset implementation. Text-command equivalent of OpenMiQ's
 * Discord `Scope` (see commands/scope.ts there) — same shape, minus
 * anything tied to `ChatInputCommandInteraction`.
 */
export interface Scope {
  key: "user" | "host" | "bot";
  get: () => ScopeSettings;
  set: (patch: ScopeSettings) => Promise<void>;
  reset: () => Promise<void>;
}

export function userScope(userId: string): Scope {
  return {
    key: "user",
    get: () => getUserSettings(userId),
    set: (patch) => setUserSettings(userId, patch),
    reset: () => resetUserSettings(userId),
  };
}

export function hostScope(hostId: string): Scope {
  return {
    key: "host",
    get: () => getHostSettings(hostId),
    set: (patch) => setHostSettings(hostId, patch),
    reset: () => resetHostSettings(hostId),
  };
}

export function botScope(): Scope {
  return {
    key: "bot",
    get: () => getBotDefaults(),
    set: (patch) => setBotDefaults(patch),
    reset: () => resetBotDefaults(),
  };
}

function capitalize(text: string): string {
  return text.length ? text[0]!.toLocaleUpperCase() + text.slice(1) : text;
}

function formatBool(value: boolean | undefined, locale: string): string {
  if (value === undefined) return t(STRINGS.valueNotSet, locale);
  return t(value ? STRINGS.valueOn : STRINGS.valueOff, locale);
}

function formatLayout(
  value: QuoteSettings["layout"] | undefined,
  locale: string,
): string {
  if (value === undefined) return t(STRINGS.valueNotSet, locale);
  return t(value === "side" ? STRINGS.valueSide : STRINGS.valueNew, locale);
}

/** What `parseScopeSet()` found, or an error to show the caller instead. */
export type ScopeSetResult =
  | { ok: true; patch: ScopeSettings }
  | { ok: false; message: Translations; vars?: Record<string, string> };

const BOOLEAN_TOKENS: Record<
  string,
  { field: keyof ScopeSettings; value: boolean }
> = {
  "block-fakequote": { field: "fakeQuoteDisabled", value: true },
  "unblock-fakequote": { field: "fakeQuoteDisabled", value: false },
  "fake-label": { field: "fakeQuoteLabelDisabled", value: false },
  "no-fake-label": { field: "fakeQuoteLabelDisabled", value: true },
  "delete-reaction": { field: "deleteReactionDisabled", value: false },
  "no-delete-reaction": { field: "deleteReactionDisabled", value: true },
};

/**
 * Parses the token string after `settings set` / `host-settings set` /
 * `admin set` — the quote-option tokens `parseOptions()` already knows
 * (`color`, `font=pop`, `theme=sunset`, …), plus `lang=xx` and the
 * boolean scope-only tokens in {@link BOOLEAN_TOKENS}. Unlike a mention's
 * options string, this validates rather than silently ignoring an unknown
 * font/theme/language.
 */
export function parseScopeSet(text: string): ScopeSetResult {
  const tokens = text
    .trim()
    .split(/[,\s]+/)
    .filter(Boolean);
  let language: string | undefined;
  const scopeFlags: Partial<
    Record<
      "fakeQuoteDisabled" | "fakeQuoteLabelDisabled" | "deleteReactionDisabled",
      boolean
    >
  > = {};
  const remaining: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const langMatch = /^lang(?:uage)?[=:](.*)$/i.exec(token);
    if (langMatch) {
      language = langMatch[1] ?? "";
      continue;
    }
    const boolToken = BOOLEAN_TOKENS[lower];
    if (boolToken) {
      scopeFlags[
        boolToken.field as
          | "fakeQuoteDisabled"
          | "fakeQuoteLabelDisabled"
          | "deleteReactionDisabled"
      ] = boolToken.value;
      continue;
    }
    remaining.push(token);
  }

  if (language !== undefined && !isSupportedLocale(language)) {
    return {
      ok: false,
      message: STRINGS.errorInvalidLocale,
      vars: { locale: language, locales: getAvailableLocales().join(", ") },
    };
  }

  const {
    settings: quoteDefaults,
    unknownFont,
    unknownTheme,
  } = parseOptions(remaining.join(" "));
  if (unknownFont) {
    return {
      ok: false,
      message: STRINGS.errorInvalidFont,
      vars: { token: unknownFont, aliases: FONT_ALIAS_LIST },
    };
  }
  if (unknownTheme) {
    return {
      ok: false,
      message: STRINGS.errorInvalidTheme,
      vars: { token: unknownTheme, themes: ALL_COLOR_THEME_LIST },
    };
  }

  if (
    language === undefined &&
    Object.keys(quoteDefaults).length === 0 &&
    Object.keys(scopeFlags).length === 0
  ) {
    return { ok: false, message: STRINGS.errorNoOptions };
  }

  return {
    ok: true,
    patch: {
      ...(language !== undefined ? { language } : {}),
      ...(Object.keys(quoteDefaults).length ? { quoteDefaults } : {}),
      ...scopeFlags,
    },
  };
}

function formatView(scope: Scope, locale: string): string {
  const data = scope.get();
  const scopeLabel = t(SCOPE_LABEL[scope.key], locale);
  const isEmpty =
    data.language === undefined &&
    data.fakeQuoteDisabled === undefined &&
    data.fakeQuoteLabelDisabled === undefined &&
    data.deleteReactionDisabled === undefined &&
    (!data.quoteDefaults || Object.keys(data.quoteDefaults).length === 0);

  if (isEmpty) {
    return t(STRINGS.viewEmpty, locale, { scope: scopeLabel });
  }

  const qd = data.quoteDefaults ?? {};
  const lines = [
    `**${capitalize(t(STRINGS.viewTitle, locale, { scope: scopeLabel }))}**`,
    `${t(STRINGS.fieldLanguage, locale)}: ${data.language ?? t(STRINGS.valueNotSet, locale)}`,
    `${t(STRINGS.fieldColor, locale)}: ${formatBool(qd.color, locale)}`,
    `${t(STRINGS.fieldBold, locale)}: ${formatBool(qd.bold, locale)}`,
    `${t(STRINGS.fieldLight, locale)}: ${formatBool(qd.light, locale)}`,
    `${t(STRINGS.fieldFlip, locale)}: ${formatBool(qd.flip, locale)}`,
    `${t(STRINGS.fieldLayout, locale)}: ${formatLayout(qd.layout, locale)}`,
    `${t(STRINGS.fieldChain, locale)}: ${formatBool(qd.chain, locale)}`,
    `${t(STRINGS.fieldFont, locale)}: ${qd.font ?? t(STRINGS.valueNotSet, locale)}`,
    `${t(STRINGS.fieldTheme, locale)}: ${qd.colorTheme ?? t(STRINGS.valueNotSet, locale)}`,
    `${t(STRINGS.fieldFakequoteBlocked, locale)}: ${formatBool(data.fakeQuoteDisabled, locale)}`,
    `${t(STRINGS.fieldFakeLabel, locale)}: ${formatBool(
      data.fakeQuoteLabelDisabled === undefined
        ? undefined
        : !data.fakeQuoteLabelDisabled,
      locale,
    )}`,
    ...(scope.key === "user"
      ? []
      : [
          `${t(STRINGS.fieldDeleteReaction, locale)}: ${formatBool(
            data.deleteReactionDisabled === undefined
              ? undefined
              : !data.deleteReactionDisabled,
            locale,
          )}`,
        ]),
  ];
  return lines.join("\n");
}

/**
 * Dispatches `view`/`set <tokens>`/`reset` for a `settings`,
 * `host-settings` or `admin` text-command invocation. `callerId` is only
 * used to resolve the reply's own language (same precedence as
 * `resolveLocale()` everywhere else) — it is *not* an authorization check;
 * callers (`commands/settings.ts` etc.) gate that themselves before calling
 * in.
 */
export async function runScopeCommand(params: {
  scope: Scope;
  args: string;
  callerId: string;
  callerHostId: string;
}): Promise<string> {
  const { scope, callerId, callerHostId } = params;
  const [subRaw, ...rest] = params.args.trim().split(/\s+/);
  const sub = (subRaw ?? "view").toLowerCase();
  const locale = resolveLocale({ userId: callerId, hostId: callerHostId });

  if (sub === "view" || sub === "") {
    return formatView(scope, locale);
  }

  if (sub === "set") {
    const result = parseScopeSet(rest.join(" "));
    if (!result.ok) return t(result.message, locale, result.vars);
    await scope.set(result.patch);
    const newLocale = resolveLocale({ userId: callerId, hostId: callerHostId });
    return t(STRINGS.setSuccess, newLocale, {
      scope: t(SCOPE_LABEL[scope.key], newLocale),
    });
  }

  if (sub === "reset") {
    await scope.reset();
    return t(STRINGS.resetSuccess, locale, {
      scope: t(SCOPE_LABEL[scope.key], locale),
    });
  }

  return t(STRINGS.errorUnknownSubcommand, locale, { sub: sub || "" });
}

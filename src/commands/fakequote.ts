import { MiQ } from "makeitaquote";
import { watermarkLogo } from "../branding.js";
import { ALL_COLOR_THEME_LIST } from "../colorThemes.js";
import { MISSKEY_URL } from "../config/env.js";
import {
  deleteReactionEnabled,
  fakeQuoteBlockReason,
  fakeQuoteLabelHidden,
  resolveLocale,
  resolveQuoteSettings,
} from "../config/settings.js";
import { FONT_ALIAS_LIST } from "../fonts.js";
import { t, type Translations } from "../i18n/index.js";
import { getSelf, resolveHostId, showUser } from "../misskey/client.js";
import { parseOptions } from "../quoteOptions.js";
import { QUOTE_MESSAGES } from "../quoteMessages.js";
import { renderQuote } from "../render.js";

const STRINGS = {
  usage: {
    en: 'Usage: "fakequote @user: message text -- options" (options optional).',
    ja: '使い方: "fakequote @user: message text -- options" (optionsは省略可)',
  },
  userNotFound: {
    en: 'Couldn\'t find the user "{{token}}".',
    ja: '"{{token}}" というユーザーが見つかりませんでした。',
  },
  blockedByBot: {
    en: "The bot admins have disabled fakequote.",
    ja: "Bot管理者により fakequote は無効化されています。",
  },
  blockedByHost: {
    en: "fakequote is disabled for this instance.",
    ja: "このインスタンスでは fakequote は無効化されています。",
  },
  blockedByUser: {
    en: "That user has blocked being used in fakequote.",
    ja: "そのユーザーは fakequote で名前を使われることをブロックしています。",
  },
} satisfies Record<string, Translations>;

const BLOCK_MESSAGE: Record<"bot" | "host" | "user", Translations> = {
  bot: STRINGS.blockedByBot,
  host: STRINGS.blockedByHost,
  user: STRINGS.blockedByUser,
};

/** `@user[@host]: message text -- options` — parses the `fakequote` command's argument string. */
const FAKEQUOTE_RE = /^@([a-zA-Z0-9_]+)(?:@([a-zA-Z0-9.-]+))?:?\s+([\s\S]+)$/;

export type FakequoteResult =
  | { kind: "error"; text: string }
  | {
      kind: "image";
      png: Buffer;
      quoteState?: { generatorId: string; targetId: string };
    };

export async function runFakequoteCommand(params: {
  args: string;
  callerId: string;
  callerHost: string | null;
}): Promise<FakequoteResult> {
  const callerHostId = resolveHostId(params.callerHost);
  const locale = resolveLocale({
    userId: params.callerId,
    hostId: callerHostId,
  });

  const match = FAKEQUOTE_RE.exec(params.args.trim());
  if (!match) {
    return { kind: "error", text: t(STRINGS.usage, locale) };
  }
  const [, username, host, rest] = match as unknown as [
    string,
    string,
    string | undefined,
    string,
  ];

  const separatorIndex = rest.search(/\s--\s/);
  const messageText = (
    separatorIndex === -1 ? rest : rest.slice(0, separatorIndex)
  ).trim();
  const optionsText =
    separatorIndex === -1 ? "" : rest.slice(separatorIndex + 4).trim();

  const author = await showUser({ username, host: host ?? null });
  if (!author) {
    return {
      kind: "error",
      text: t(STRINGS.userNotFound, locale, {
        token: host ? `@${username}@${host}` : `@${username}`,
      }),
    };
  }
  const authorHostId = resolveHostId(author.host);

  const blockReason = fakeQuoteBlockReason({
    authorId: author.id,
    hostId: authorHostId,
  });
  if (blockReason) {
    return { kind: "error", text: t(BLOCK_MESSAGE[blockReason], locale) };
  }

  const {
    settings: inline,
    unknownFont,
    unknownTheme,
  } = parseOptions(optionsText);
  if (unknownFont) {
    return {
      kind: "error",
      text: t(QUOTE_MESSAGES.unknownFont, locale, {
        token: unknownFont,
        aliases: FONT_ALIAS_LIST,
      }),
    };
  }
  if (unknownTheme) {
    return {
      kind: "error",
      text: t(QUOTE_MESSAGES.unknownTheme, locale, {
        token: unknownTheme,
        themes: ALL_COLOR_THEME_LIST,
      }),
    };
  }

  const settings = resolveQuoteSettings({
    userId: params.callerId,
    hostId: callerHostId,
    inline,
  });

  const miqOptions = MISSKEY_URL ? { misskey: MISSKEY_URL } : undefined;
  const self = getSelf();
  const data = new MiQ(miqOptions)
    .setFromNote(
      {
        text: messageText,
        user: {
          username: author.username,
          name: author.name,
          host: author.host,
          avatarUrl: author.avatarUrl,
        },
      },
      { markdown: "raw" },
    )
    .setWatermark(watermarkLogo() ?? `@${self.username}`)
    .getData();

  const fake = !fakeQuoteLabelHidden({
    invokerId: params.callerId,
    hostId: callerHostId,
  });
  const png = await renderQuote(data, settings, { fake });

  return {
    kind: "image",
    png,
    quoteState: deleteReactionEnabled(callerHostId)
      ? { generatorId: params.callerId, targetId: author.id }
      : undefined,
  };
}

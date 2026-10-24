import { t, type Translations } from "../i18n/index.js";

const STRINGS = {
  title: { en: "🙏 Credits", ja: "🙏 クレジット" },
  project: {
    en: "https://github.com/otnc\n\nBy **otoneko.**\nOpenMiQ-Misskey — https://github.com/OpenMiQ/misskey-bot",
    ja: "https://github.com/otnc\n\n作者: **otoneko.**\nOpenMiQ-Misskey — https://github.com/OpenMiQ/misskey-bot",
  },
  basedOnTitle: { en: "Based on", ja: "ベース" },
  // Required by OpenMiQ's ADDITIONAL_TERMS.md (AGPL-3.0 Section 7):
  // conspicuous attribution — software name, author, repo URL — plus a
  // "based on OpenMiQ, with modifications" statement, wherever this bot's
  // own credits/help/about-equivalent is shown.
  basedOn: {
    en: "This bot is based on **OpenMiQ** (https://github.com/OpenMiQ/discord-bot) by **otoneko.**, with modifications for Misskey.",
    ja: "このBotは **otoneko.** 氏による **OpenMiQ** (https://github.com/OpenMiQ/discord-bot) をベースに、Misskey向けに改変したものです。",
  },
  libraryTitle: { en: "makeitaquote", ja: "makeitaquote" },
  library: {
    en: "The library this bot renders images with.\nhttps://github.com/OpenMiQ/makeitaquote\nhttps://www.npmjs.com/package/makeitaquote",
    ja: "このBotが画像描画に使用しているライブラリです。\nhttps://github.com/OpenMiQ/makeitaquote\nhttps://www.npmjs.com/package/makeitaquote",
  },
  inspirationTitle: { en: "Inspired by", ja: "インスピレーション元" },
  inspiration: {
    en: "Make it a Quote (Twitter) — https://twitter.com/MakeItAQuote\nMake it a Quote (Discord/Misskey/Bluesky) — https://miq.moe/",
    ja: "Make it a Quote (Twitter) — https://twitter.com/MakeItAQuote\nMake it a Quote (Discord/Misskey/Bluesky) — https://miq.moe/",
  },
} satisfies Record<string, Translations>;

/** The credits text, shared by the pinned credits note and `help`'s last section — see `pinnedNotes.ts`. */
export function creditsText(locale: string): string {
  return [
    `**${t(STRINGS.title, locale)}**`,
    t(STRINGS.project, locale),
    `**${t(STRINGS.basedOnTitle, locale)}**`,
    t(STRINGS.basedOn, locale),
    `**${t(STRINGS.libraryTitle, locale)}**`,
    t(STRINGS.library, locale),
    `**${t(STRINGS.inspirationTitle, locale)}**`,
    t(STRINGS.inspiration, locale),
  ].join("\n\n");
}

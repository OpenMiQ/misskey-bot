import { COLOR_THEME_LIST, CUSTOM_COLOR_THEME_LIST } from "../colorThemes.js";
import { FONT_ALIAS_LIST } from "../fonts.js";
import { t, type Translations } from "../i18n/index.js";
import { creditsText } from "./credits.js";

const STRINGS = {
  title: { en: "🤖 MiQ Bot help (1/2)", ja: "🤖 MiQ Bot ヘルプ (1/2)" },
  titlePage2: { en: "🤖 MiQ Bot help (2/2)", ja: "🤖 MiQ Bot ヘルプ (2/2)" },
  basicsTitle: { en: "📌 Quoting a note", ja: "📌 ノートを引用する" },
  basics: {
    en: "Reply to a note and mention this bot — the note becomes a quote image.",
    ja: "ノートにリプライした状態でこのBotをメンションすると、引用画像になります。",
  },
  commandsTitle: { en: "🤖 Text commands", ja: "🤖 テキストコマンド" },
  // Every command's own syntax is backtick-quoted (MFM inline code) rather
  // than plain quotes — besides reading as code, it keeps a placeholder
  // like `@user` from being parsed as a real mention token once this posts
  // as an actual note (mfm-js doesn't extract mentions out of inline code).
  commands: {
    en: "`settings view|set …|reset` — your own defaults\n`host-settings view|set …|reset` — this instance's defaults (bot admins only)\n`fakequote <options> @user message` — make up a quote in someone's name\n`admin view|set …|reset` — bot-wide defaults (bot admins only)",
    ja: "`settings view|set …|reset` — あなたのデフォルト設定\n`host-settings view|set …|reset` — このインスタンスのデフォルト設定 (Bot管理者のみ)\n`fakequote <options> @user message` — 誰かの名前で架空の引用を作る\n`admin view|set …|reset` — Bot全体のデフォルト設定 (Bot管理者のみ)",
  },
  optionsTitle: { en: "⚙️ Mention options", ja: "⚙️ メンションのオプション" },
  // {{bot}} is the bot's own real, working mention (e.g. "@miq") —
  // deliberately *not* inside backticks, unlike the placeholders above:
  // this one is meant to actually work if pressed/copied.
  optionsIntro: {
    en: "Combine freely after the mention, e.g. {{bot}} `color new font=pop`. Every toggle has a one-letter shortcut.",
    ja: "メンションの後ろに自由に組み合わせられます。例: {{bot}} `color new font=pop`。トグルには1文字の短縮形があります。",
  },
  options: {
    en: "`color`(c)/`mono`(m) — color/grayscale avatar\n`bold`(b)/`regular`(r) — bold/regular text\n`light`(l)/`dark`(d) — light/dark theme\n`flip`(f)/`unflip`(u) — avatar side (side layout only)\n`new`(n)/`side`(s) — layout\n`chain`/`unchain` — stack with the note it's replying to (wins over `new`)\n`font=<alias>` — pick a font, see page 2\n`theme=<alias>` — background color, `theme=default` clears it, see page 2",
    ja: "`color`(c)/`mono`(m) — カラー/モノクロのアバター\n`bold`(b)/`regular`(r) — 太字/通常の引用文\n`light`(l)/`dark`(d) — ライト/ダークテーマ\n`flip`(f)/`unflip`(u) — アバターの位置 (横画像のみ)\n`new`(n)/`side`(s) — レイアウト\n`chain`/`unchain` — 返信元があれば連結表示 (`new` より優先)\n`font=<alias>` — フォント指定。2ページ目参照\n`theme=<alias>` — 背景カラー指定。`theme=default` で解除。2ページ目参照",
  },
  fontsTitle: {
    en: "🔤 Fonts — `font=<alias>`",
    ja: "🔤 フォント — `font=<エイリアス>`",
  },
  colorThemesTitle: {
    en: "🎨 Color themes — `theme=<alias>`",
    ja: "🎨 カラーテーマ — `theme=<エイリアス>`",
  },
  customColorThemesTitle: {
    en: "🎨 Custom color themes",
    ja: "🎨 オリジナルカラーテーマ",
  },
  defaultsTitle: { en: "💾 Saving defaults", ja: "💾 デフォルトの保存" },
  defaults: {
    en: "`settings set …` saves your own defaults. The matching `reset` clears them.",
    ja: "`settings set …` で自分のデフォルトを保存できます。対応する `reset` で解除できます。",
  },
  fakequoteTitle: { en: "🎭 fakequote", ja: "🎭 fakequote" },
  fakequote: {
    en: "`fakequote <options> @user message` makes up a quote in someone else's name — options (`color`, `font=pop`, …) come before the @mention. Don't want it used on you? Block it with `settings set block-fakequote`.",
    ja: "`fakequote <options> @user message` は指定したユーザーの名前で引用文をでっち上げます。オプション(`color`、`font=pop` など)は@メンションより前に置きます。使われたくない場合は `settings set block-fakequote` でブロックできます。",
  },
} satisfies Record<string, Translations>;

/**
 * The pinned help note's content (see `pinnedNotes.ts`), as one note per
 * "page" — posted as a reply chain when it doesn't fit in one note.
 * `botMention` is the bot's own real `@name` (or `@name@host`), so the
 * usage example actually works if pressed/copied rather than showing a
 * stale hardcoded placeholder.
 */
export function buildHelpPages(locale: string, botMention: string): string[] {
  const page1 = [
    `**${t(STRINGS.title, locale)}**`,
    `**${t(STRINGS.basicsTitle, locale)}**\n${t(STRINGS.basics, locale)}`,
    `**${t(STRINGS.commandsTitle, locale)}**\n${t(STRINGS.commands, locale)}`,
    `**${t(STRINGS.optionsTitle, locale)}**\n${t(STRINGS.optionsIntro, locale, { bot: botMention })}\n${t(STRINGS.options, locale)}`,
  ].join("\n\n");

  const page2 = [
    `**${t(STRINGS.titlePage2, locale)}**`,
    `**${t(STRINGS.fontsTitle, locale)}**\n${FONT_ALIAS_LIST}`,
    `**${t(STRINGS.colorThemesTitle, locale)}**\n${COLOR_THEME_LIST}`,
    `**${t(STRINGS.customColorThemesTitle, locale)}**\n${CUSTOM_COLOR_THEME_LIST}`,
    `**${t(STRINGS.defaultsTitle, locale)}**\n${t(STRINGS.defaults, locale)}`,
    `**${t(STRINGS.fakequoteTitle, locale)}**\n${t(STRINGS.fakequote, locale)}`,
    creditsText(locale),
  ].join("\n\n");

  return [page1, page2];
}

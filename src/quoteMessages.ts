import type { Translations } from "./i18n/index.js";

/**
 * User-facing messages shared by every place that can turn a note into a
 * quote: the mention handler, the `fakequote` text command, and the delete
 * reaction handler.
 */
export const QUOTE_MESSAGES = {
  deleteExpired: {
    en: "Couldn't find this quote's data — it was posted before the last restart, so it can't be deleted with a reaction anymore.",
    ja: "この引用の情報が見つかりませんでした。Botの再起動前に投稿されたため、リアクションでの削除はできません。",
  },
  // {{token}} is backtick-quoted (MFM inline code), not just quote marks —
  // it's attacker-controlled (whatever font=/theme= token they typed), and
  // mfm-js doesn't extract mentions out of inline code, so a token crafted
  // as e.g. "font=@someone" can't turn this reply into an unwanted mention.
  unknownFont: {
    en: "Unknown font `{{token}}`. Available: {{aliases}}.",
    ja: "不明なフォントです: `{{token}}`。利用可能: {{aliases}}",
  },
  unknownTheme: {
    en: "Unknown color theme `{{token}}`. Available: {{themes}}.",
    ja: "不明なカラーテーマです: `{{token}}`。利用可能: {{themes}}",
  },
} satisfies Record<string, Translations>;

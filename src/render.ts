import { MiQ, MiQChain, stripMfm, type QuoteData } from "makeitaquote";
import { MISSKEY_URL } from "./config/env.js";
import { saveImageLocally } from "./imageStore.js";
import { buildTheme, type QuoteSettings } from "./quoteOptions.js";

export interface RenderQuoteOptions {
  /** Marks a `fakequote` render — see buildTheme(). */
  fake?: boolean;
  /**
   * The note `data` is replying to, when `settings.chain` asked for one and
   * one was found — see `findChainTop()` in `quoteChain.ts`. Renders as a
   * `MiQChain` (`chainTop` on top, `data` on the bottom) instead of a single
   * quote. `buildTheme()` already forces the effective layout back to
   * `side` whenever `settings.chain` is on, so `theme` below is never `new`
   * here — no extra layout check needed.
   */
  chainTop?: QuoteData | null;
}

/**
 * Renders a quote image from data already read off a note (as returned by
 * `new MiQ({ misskey: MISSKEY_URL }).setFromNote(note, { markdown: "raw" }).getData()`),
 * and — if `SAVE_IMAGES_DIR` is set — saves a copy locally.
 *
 * `data`/`chainTop` are expected to still carry the *unstripped* note text
 * (`markdown: "raw"`, not `stripMfm: true`/`markdown: false`) —
 * `applyMarkdownSetting()` below decides at render time, from
 * `settings.markdown`, whether to show it verbatim, real MFM formatting
 * rendered, or (the default) stripped back to plain text. Only `false`
 * throws away the original markup for good, so keeping the source at
 * `"raw"` is what lets `settings.markdown` re-render the same quote either
 * way.
 */
export async function renderQuote(
  data: QuoteData,
  settings: QuoteSettings,
  options?: RenderQuoteOptions,
): Promise<Buffer> {
  const theme = buildTheme(settings, { fake: options?.fake });
  const chainTop = options?.chainTop;
  const renderData = applyMarkdownSetting(data, settings.markdown);
  const renderChainTop = chainTop
    ? applyMarkdownSetting(chainTop, settings.markdown)
    : null;

  const miqOptions = MISSKEY_URL ? { misskey: MISSKEY_URL } : undefined;
  const png = renderChainTop
    ? await new MiQChain(
        new MiQ(miqOptions).setFromObject(renderChainTop).setTheme(theme),
        new MiQ(miqOptions).setFromObject(renderData).setTheme(theme),
        { flip: settings.flip },
      ).toBuffer("png")
    : await new MiQ(miqOptions)
        .setFromObject(renderData)
        .setTheme(theme)
        .toBuffer("png");

  await saveImageLocally(png);
  return png;
}

/**
 * `on` renders real MFM formatting; off (the default) strips it back to
 * plain text with `stripMfm()` — the same visible result stripping at
 * creation time used to bake in, just computed fresh from the preserved raw
 * text on every render instead.
 */
function applyMarkdownSetting(data: QuoteData, on: boolean): QuoteData {
  return on
    ? { ...data, markdown: "misskey" }
    : { ...data, text: stripMfm(data.text), markdown: "raw" };
}

import { describe, expect, it } from "vitest";
import {
  buildTheme,
  DEFAULT_SETTINGS,
  parseOptions,
} from "../src/quoteOptions.js";

describe("parseOptions", () => {
  it("parses toggles and their one-letter shortcuts", () => {
    expect(parseOptions("color bold light flip new").settings).toEqual({
      color: true,
      bold: true,
      light: true,
      flip: false, // "new" clears flip
      layout: "new",
    });
    expect(parseOptions("c b l f n").settings).toEqual({
      color: true,
      bold: true,
      light: true,
      flip: false,
      layout: "new",
    });
  });

  it("accepts commas as separators", () => {
    expect(parseOptions("c,n").settings).toEqual({
      color: true,
      flip: false,
      layout: "new",
    });
  });

  it("resolves theme= and clears it back to null with default aliases", () => {
    expect(parseOptions("theme=sunset").settings.colorTheme).toBe("sunset");
    expect(parseOptions("theme=default").settings.colorTheme).toBeNull();
    expect(parseOptions("theme=def").settings.colorTheme).toBeNull();
  });

  it("reports an unresolved theme= token", () => {
    const result = parseOptions("theme=not-a-real-theme");
    expect(result.unknownTheme).toBe("not-a-real-theme");
    expect(result.settings.colorTheme).toBeUndefined();
  });

  it("resolves font= and takes everything after it to the end", () => {
    const result = parseOptions("color font=pop");
    expect(result.settings.color).toBe(true);
    expect(result.settings.font).toBeTruthy();
  });

  it("reports an unresolved font= token", () => {
    const result = parseOptions("font=not-a-real-font");
    expect(result.unknownFont).toBe("not-a-real-font");
  });

  it("chain/unchain toggle with no one-letter shortcut", () => {
    expect(parseOptions("chain").settings.chain).toBe(true);
    expect(parseOptions("unchain").settings.chain).toBe(false);
  });
});

describe("buildTheme", () => {
  it("forces the layout back to side and disables flip when chain is on and layout is new", () => {
    const theme = buildTheme({
      ...DEFAULT_SETTINGS,
      layout: "new",
      chain: true,
      flip: true,
    });
    expect(theme.layout).toBe("side");
    expect(theme.avatar?.position).toBe("right");
  });

  it("markdown wins over bold", () => {
    const theme = buildTheme({
      ...DEFAULT_SETTINGS,
      bold: true,
      markdown: true,
    });
    expect(theme.text?.weight).toBeUndefined();
  });

  it("marks a fake render with the (fake) @ username prefix", () => {
    const theme = buildTheme(DEFAULT_SETTINGS, { fake: true });
    expect(theme.username?.prefix).toBe("(fake) @");
  });
});

import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// DATA_DIR is read once at module load, so it must be set before the first
// (dynamic) import of src/config/*, ahead of every static import in this
// project — hence importing the module under test at runtime, not statically.
describe("settings resolution", () => {
  let settingsMod: typeof import("../src/config/settings.js");
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "openmiq-misskey-test-"));
    process.env.DATA_DIR = tmpDir;
    settingsMod = await import("../src/config/settings.js");
    settingsMod.loadSettingsStores();
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("falls back to hardcoded defaults with nothing saved", () => {
    const settings = settingsMod.resolveQuoteSettings({
      userId: "u1",
      hostId: "misskey.local",
      inline: {},
    });
    expect(settings).toEqual({
      color: false,
      light: false,
      flip: false,
      bold: false,
      layout: "side",
      font: "M PLUS Rounded 1c",
      colorTheme: null,
      chain: false,
      markdown: false,
    });
  });

  it("merges quote-option defaults as bot < host < user < inline", async () => {
    await settingsMod.setBotDefaults({
      quoteDefaults: { color: true, layout: "new" },
    });
    await settingsMod.setHostSettings("h1", {
      quoteDefaults: { color: false },
    });
    await settingsMod.setUserSettings("u1", {
      quoteDefaults: { layout: "side" },
    });

    const settings = settingsMod.resolveQuoteSettings({
      userId: "u1",
      hostId: "h1",
      inline: { flip: true },
    });
    expect(settings.color).toBe(false); // host overrides bot
    expect(settings.layout).toBe("side"); // user overrides bot
    expect(settings.flip).toBe(true); // inline overrides everything
  });

  it("resolves locale with the same precedence", async () => {
    await settingsMod.setBotDefaults({ language: "en" });
    expect(settingsMod.resolveLocale({ userId: "u2", hostId: "h2" })).toBe(
      "en",
    );

    await settingsMod.setHostSettings("h2", { language: "ja" });
    expect(settingsMod.resolveLocale({ userId: "u2", hostId: "h2" })).toBe(
      "ja",
    );

    await settingsMod.setUserSettings("u2", { language: "en" });
    expect(settingsMod.resolveLocale({ userId: "u2", hostId: "h2" })).toBe(
      "en",
    );
  });

  it("reset clears a scope back to nothing saved", async () => {
    await settingsMod.setUserSettings("u3", { quoteDefaults: { color: true } });
    await settingsMod.resetUserSettings("u3");
    expect(settingsMod.getUserSettings("u3")).toEqual({});
  });

  it("a second set() merges into, rather than replaces, saved quote defaults", async () => {
    await settingsMod.setUserSettings("u4", { quoteDefaults: { color: true } });
    await settingsMod.setUserSettings("u4", { quoteDefaults: { flip: true } });
    expect(settingsMod.getUserSettings("u4").quoteDefaults).toEqual({
      color: true,
      flip: true,
    });
  });

  it("fakeQuoteBlockReason is null when nothing blocks it", () => {
    expect(
      settingsMod.fakeQuoteBlockReason({ authorId: "u5", hostId: "h5" }),
    ).toBeNull();
  });

  it("fakeQuoteBlockReason checks bot, then host, then the author themselves", async () => {
    await settingsMod.setUserSettings("u6", { fakeQuoteDisabled: true });
    expect(
      settingsMod.fakeQuoteBlockReason({ authorId: "u6", hostId: "h6a" }),
    ).toBe("user");

    await settingsMod.setHostSettings("h6", { fakeQuoteDisabled: true });
    expect(
      settingsMod.fakeQuoteBlockReason({ authorId: "u7", hostId: "h6" }),
    ).toBe("host");

    await settingsMod.setBotDefaults({ fakeQuoteDisabled: true });
    expect(
      settingsMod.fakeQuoteBlockReason({ authorId: "u8", hostId: "h8" }),
    ).toBe("bot");
  });

  it("deleteReactionEnabled is true by default", () => {
    expect(settingsMod.deleteReactionEnabled("h9")).toBe(true);
  });

  it("deleteReactionEnabled respects a host override", async () => {
    await settingsMod.setHostSettings("h10", { deleteReactionDisabled: true });
    expect(settingsMod.deleteReactionEnabled("h10")).toBe(false);
    expect(settingsMod.deleteReactionEnabled("h11")).toBe(true);
  });

  it("deleteReactionEnabled respects a bot-wide override", async () => {
    await settingsMod.setBotDefaults({ deleteReactionDisabled: true });
    expect(settingsMod.deleteReactionEnabled("h12")).toBe(false);
  });

  it("fakeQuoteLabelHidden is false by default", () => {
    expect(
      settingsMod.fakeQuoteLabelHidden({ invokerId: "u13", hostId: "h13" }),
    ).toBe(false);
  });

  it("fakeQuoteLabelHidden checks bot, then host, then the invoker themselves", async () => {
    await settingsMod.setUserSettings("u14", { fakeQuoteLabelDisabled: true });
    expect(
      settingsMod.fakeQuoteLabelHidden({ invokerId: "u14", hostId: "h14a" }),
    ).toBe(true);
    expect(
      settingsMod.fakeQuoteLabelHidden({ invokerId: "u15", hostId: "h14a" }),
    ).toBe(false);

    await settingsMod.setHostSettings("h14", { fakeQuoteLabelDisabled: true });
    expect(
      settingsMod.fakeQuoteLabelHidden({ invokerId: "u15", hostId: "h14" }),
    ).toBe(true);

    await settingsMod.setBotDefaults({ fakeQuoteLabelDisabled: true });
    expect(
      settingsMod.fakeQuoteLabelHidden({ invokerId: "u16", hostId: "h16" }),
    ).toBe(true);
  });
});

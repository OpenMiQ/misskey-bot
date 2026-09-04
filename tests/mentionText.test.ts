import { beforeAll, describe, expect, it } from "vitest";

// MISSKEY_URL is read once at module load by src/config/env.ts, so it must
// be set before the first (dynamic) import of src/mentionText.ts — same
// reasoning as settings.test.ts's DATA_DIR handling.
describe("stripBotMention", () => {
  let stripBotMention: typeof import("../src/mentionText.js").stripBotMention;

  beforeAll(async () => {
    process.env.MISSKEY_URL = "https://misskey.example";
    ({ stripBotMention } = await import("../src/mentionText.js"));
  });

  it("strips a bare local mention", () => {
    expect(stripBotMention("@miq color new", "miq")).toBe("color new");
  });

  it("strips a mention with the bot's own host", () => {
    expect(stripBotMention("@miq@misskey.example color", "miq")).toBe("color");
  });

  it("matches case-insensitively", () => {
    expect(stripBotMention("@MiQ color", "miq")).toBe("color");
  });

  it("doesn't truncate a mention of a different, longer-named bot", () => {
    expect(stripBotMention("@miqbot2 color", "miq")).toBe("@miqbot2 color");
  });
});

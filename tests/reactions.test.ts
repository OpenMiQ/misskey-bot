import { beforeAll, describe, expect, it } from "vitest";

// handlers/reaction.ts transitively imports misskey/client.ts, which throws
// at module load if MISSKEY_URL/MISSKEY_TOKEN aren't set — same reasoning
// as settings.test.ts's DATA_DIR handling, hence the dynamic imports below.
describe("stripVariationSelector", () => {
  let stripVariationSelector: typeof import("../src/handlers/reaction.js").stripVariationSelector;

  beforeAll(async () => {
    process.env.MISSKEY_URL = "https://misskey.example";
    process.env.MISSKEY_TOKEN = "test-token";
    ({ stripVariationSelector } = await import("../src/handlers/reaction.js"));
  });

  it("strips a trailing U+FE0F variation selector", () => {
    expect(stripVariationSelector("🗑️")).toBe("🗑");
  });

  it("leaves an already-bare emoji untouched", () => {
    expect(stripVariationSelector("🗑")).toBe("🗑");
    expect(stripVariationSelector("❓")).toBe("❓");
  });
});

// Regression test for a real bug: Misskey's ReactionService.normalize()
// strips U+FE0F from any non-ZWJ emoji before storing/broadcasting a
// reaction, so a reaction constant written with the VS16 form (as most
// emoji pickers produce, e.g. "🗑️") never matched a `notification.reaction`
// coming back off the stream — the delete reaction silently did nothing.
describe("reaction constants have no variation selector", () => {
  it("DELETE_REACTION_EMOJI", async () => {
    const { DELETE_REACTION_EMOJI } = await import("../src/reactions.js");
    const { stripVariationSelector } =
      await import("../src/handlers/reaction.js");
    expect(DELETE_REACTION_EMOJI).toBe(
      stripVariationSelector(DELETE_REACTION_EMOJI),
    );
  });

  it("HELP_REACTION_EMOJI", async () => {
    const { HELP_REACTION_EMOJI } = await import("../src/pendingHelp.js");
    const { stripVariationSelector } =
      await import("../src/handlers/reaction.js");
    expect(HELP_REACTION_EMOJI).toBe(
      stripVariationSelector(HELP_REACTION_EMOJI),
    );
  });
});

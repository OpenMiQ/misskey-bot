import { describe, expect, it } from "vitest";
import { parseScopeSet } from "../src/commands/scope.js";

describe("parseScopeSet", () => {
  it("rejects an empty options string", () => {
    const result = parseScopeSet("");
    expect(result.ok).toBe(false);
  });

  it("parses quote-option tokens via parseOptions", () => {
    const result = parseScopeSet("color new");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.patch.quoteDefaults).toEqual({
        color: true,
        layout: "new",
        flip: false,
      });
    }
  });

  it("parses lang= into a top-level language field", () => {
    const result = parseScopeSet("lang=ja");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.patch.language).toBe("ja");
    }
  });

  it("rejects an unsupported language", () => {
    const result = parseScopeSet("lang=xx");
    expect(result.ok).toBe(false);
  });

  it("parses the boolean scope-only tokens", () => {
    const result = parseScopeSet(
      "block-fakequote no-fake-label no-delete-reaction",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.patch).toEqual({
        fakeQuoteDisabled: true,
        fakeQuoteLabelDisabled: true,
        deleteReactionDisabled: true,
      });
    }
  });

  it("their opposites clear the flags back to false", () => {
    const result = parseScopeSet(
      "unblock-fakequote fake-label delete-reaction",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.patch).toEqual({
        fakeQuoteDisabled: false,
        fakeQuoteLabelDisabled: false,
        deleteReactionDisabled: false,
      });
    }
  });

  it("surfaces an unknown font= the same way a mention would", () => {
    const result = parseScopeSet("font=not-a-real-font");
    expect(result.ok).toBe(false);
  });
});

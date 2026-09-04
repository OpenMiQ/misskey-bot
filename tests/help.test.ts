import { describe, expect, it } from "vitest";
import { buildHelpPages } from "../src/commands/help.js";

describe("buildHelpPages", () => {
  it("uses the given bot mention, unescaped, in the options example", () => {
    const [page1] = buildHelpPages("en", "@testbot");
    expect(page1).toContain("e.g. @testbot `color new font=pop`");
  });

  // Regression test: every literal "@user" placeholder must be inside a
  // backtick-quoted (MFM inline code) span — mfm-js doesn't extract
  // mentions out of inline code, so that's what keeps a placeholder like
  // "@user" from being parsed as a real mention once the help note posts.
  // Strip every well-formed `...` span first; nothing should be left over.
  it("keeps every @user placeholder inside backticks", () => {
    for (const page of buildHelpPages("en", "@testbot")) {
      const withoutCodeSpans = page.replace(/`[^`]*`/g, "");
      expect(withoutCodeSpans).not.toContain("@user");
    }
  });
});

import { beforeAll, describe, expect, it } from "vitest";

// commands/fakequote.ts transitively imports misskey/client.ts, which
// throws at module load if MISSKEY_URL/MISSKEY_TOKEN aren't set — same
// reasoning as settings.test.ts's DATA_DIR handling.
describe("runFakequoteCommand usage message", () => {
  let runFakequoteCommand: typeof import("../src/commands/fakequote.js").runFakequoteCommand;

  beforeAll(async () => {
    process.env.MISSKEY_URL = "https://misskey.example";
    process.env.MISSKEY_TOKEN = "test-token";
    ({ runFakequoteCommand } = await import("../src/commands/fakequote.js"));
  });

  // Regression test, same reasoning as help.test.ts: the "@user" placeholder
  // in the usage message must stay inside backticks (MFM inline code) so
  // it can never be parsed as a real mention once posted as a reply.
  it("keeps the @user placeholder inside backticks (no network call needed — malformed args fail before any lookup)", async () => {
    const result = await runFakequoteCommand({
      args: "not a valid invocation",
      callerId: "u1",
      callerHost: null,
    });
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.text.replace(/`[^`]*`/g, "")).not.toContain("@user");
    }
  });
});

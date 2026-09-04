import { beforeAll, describe, expect, it } from "vitest";

// commands/fakequote.ts transitively imports misskey/client.ts, which
// throws at module load if MISSKEY_URL/MISSKEY_TOKEN aren't set — same
// reasoning as settings.test.ts's DATA_DIR handling.
describe("fakequote", () => {
  let runFakequoteCommand: typeof import("../src/commands/fakequote.js").runFakequoteCommand;
  let parseFakequoteArgs: typeof import("../src/commands/fakequote.js").parseFakequoteArgs;

  beforeAll(async () => {
    process.env.MISSKEY_URL = "https://misskey.example";
    process.env.MISSKEY_TOKEN = "test-token";
    ({ runFakequoteCommand, parseFakequoteArgs } =
      await import("../src/commands/fakequote.js"));
  });

  describe("parseFakequoteArgs", () => {
    it("parses `<options> @user message`", () => {
      expect(parseFakequoteArgs("color new @testuser hello world")).toEqual({
        username: "testuser",
        host: null,
        optionsText: "color new",
        messageText: "hello world",
      });
    });

    it("works with no options at all", () => {
      expect(parseFakequoteArgs("@testuser hello world")).toEqual({
        username: "testuser",
        host: null,
        optionsText: "",
        messageText: "hello world",
      });
    });

    it("captures a remote @user@host target", () => {
      expect(parseFakequoteArgs("@testuser@example.com hi")).toEqual({
        username: "testuser",
        host: "example.com",
        optionsText: "",
        messageText: "hi",
      });
    });

    it("doesn't let font= (which reads to the end) swallow the mention or message", () => {
      expect(parseFakequoteArgs("font=pop @testuser hello world")).toEqual({
        username: "testuser",
        host: null,
        optionsText: "font=pop",
        messageText: "hello world",
      });
    });

    it("leaves a literal @ inside the message alone once past the mention", () => {
      expect(parseFakequoteArgs("@testuser hello @world")).toMatchObject({
        messageText: "hello @world",
      });
    });

    it("returns null with no @user token at all", () => {
      expect(parseFakequoteArgs("not a valid invocation")).toBeNull();
    });

    it("returns null with a mention but no message text", () => {
      expect(parseFakequoteArgs("color @testuser")).toBeNull();
    });
  });

  // Regression test, same reasoning as help.test.ts: the "@user" placeholder
  // in the usage message must stay inside backticks (MFM inline code) so
  // it can never be parsed as a real mention once posted as a reply.
  it("keeps the @user placeholder inside backticks in the usage message (no network call needed — malformed args fail before any lookup)", async () => {
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

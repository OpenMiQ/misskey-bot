import { runAdminCommand } from "./admin.js";
import { runFakequoteCommand, type FakequoteResult } from "./fakequote.js";
import { runHostSettingsCommand } from "./hostSettings.js";
import { runSettingsCommand } from "./settings.js";
import { resolveHostId } from "../misskey/client.js";
import { parseOptions, type ParsedInvocation } from "../quoteOptions.js";

export interface TextCommandCaller {
  id: string;
  host: string | null;
}

export type TextCommandResult =
  | { kind: "text"; text: string }
  | { kind: "fakequote"; result: FakequoteResult }
  /** No recognized command keyword — the whole text is quote options for the default "quote the replied note" flow. */
  | { kind: "quote"; invocation: ParsedInvocation };

const KEYWORDS = new Set(["settings", "host-settings", "admin", "fakequote"]);

/**
 * Dispatches the text after a mention (with the bot's own `@name` token
 * already stripped — see `handlers/mention.ts`) to a text command, or falls
 * through to the default "quote the replied note" behavior when the first
 * token isn't a recognized command keyword. Misskey has no slash commands,
 * so this — plain keywords inside the mention text — is this bot's
 * equivalent of OpenMiQ's Discord slash-command dispatch
 * (`handlers/interactionCreate.ts` there).
 *
 * `help`/`credits` aren't text commands here — see `pinnedNotes.ts`: the
 * bot posts and pins one standing copy of each per locale at startup
 * instead of answering each request fresh.
 */
export async function dispatchTextCommand(
  text: string,
  caller: TextCommandCaller,
): Promise<TextCommandResult> {
  const trimmed = text.trim();
  const spaceIndex = trimmed.search(/\s/);
  const firstToken = (
    spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex)
  ).toLowerCase();
  const rest = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1);

  if (!KEYWORDS.has(firstToken)) {
    return { kind: "quote", invocation: parseOptions(trimmed) };
  }

  const callerHostId = resolveHostId(caller.host);

  switch (firstToken) {
    case "settings":
      return {
        kind: "text",
        text: await runSettingsCommand({
          args: rest,
          callerId: caller.id,
          callerHostId,
        }),
      };
    case "host-settings":
      return {
        kind: "text",
        text: await runHostSettingsCommand({
          args: rest,
          callerId: caller.id,
          callerHostId,
        }),
      };
    case "admin":
      return {
        kind: "text",
        text: await runAdminCommand({
          args: rest,
          callerId: caller.id,
          callerHostId,
        }),
      };
    case "fakequote":
      return {
        kind: "fakequote",
        result: await runFakequoteCommand({
          args: rest,
          callerId: caller.id,
          callerHost: caller.host,
        }),
      };
    default:
      // Unreachable — firstToken passed the KEYWORDS.has() check above.
      return { kind: "quote", invocation: parseOptions(trimmed) };
  }
}

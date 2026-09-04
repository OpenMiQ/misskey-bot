import { runScopeCommand, userScope } from "./scope.js";

/** `settings view|set <tokens>|reset` — the caller's own defaults. */
export async function runSettingsCommand(params: {
  args: string;
  callerId: string;
  callerHostId: string;
}): Promise<string> {
  return runScopeCommand({
    scope: userScope(params.callerId),
    args: params.args,
    callerId: params.callerId,
    callerHostId: params.callerHostId,
  });
}

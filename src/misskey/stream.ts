import * as Misskey from "misskey-js";
import { MISSKEY_TOKEN, MISSKEY_URL } from "../config/env.js";

export type ReactionNotification = Extract<
  Misskey.entities.Notification,
  { type: "reaction" }
>;

/**
 * Connects to the `main` stream channel and returns typed hooks for the two
 * event kinds this bot cares about — replaces discord.js's `MessageCreate`/
 * `InteractionCreate` client events. `misskey-js`'s `Stream` reconnects on
 * its own (`reconnecting-websocket` under the hood), so no manual retry
 * logic is needed here.
 */
export function connectStream(handlers: {
  onMention: (note: Misskey.entities.Note) => void;
  onReaction: (notification: ReactionNotification) => void;
}): Misskey.Stream {
  const stream = new Misskey.Stream(
    MISSKEY_URL,
    { token: MISSKEY_TOKEN },
    { WebSocket: globalThis.WebSocket as never },
  );

  const main = stream.useChannel("main");
  main.on("mention", handlers.onMention);
  main.on("notification", (notification) => {
    if (notification.type === "reaction") {
      handlers.onReaction(notification);
    }
  });

  return stream;
}

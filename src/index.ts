import { loadSettingsStores } from "./config/settings.js";
import { onMention } from "./handlers/mention.js";
import { onReaction } from "./handlers/reaction.js";
import { loadSelf } from "./misskey/client.js";
import { connectStream } from "./misskey/stream.js";

export async function main(): Promise<void> {
  loadSettingsStores();

  const self = await loadSelf();
  console.log(`Logged in as @${self.username}`);

  const stream = connectStream({
    onMention: (note) => {
      void onMention(note).catch((error) =>
        console.error("Mention handler failed:", error),
      );
    },
    onReaction: (notification) => {
      void onReaction(notification).catch((error) =>
        console.error("Reaction handler failed:", error),
      );
    },
  });

  stream.on("_connected_", () => console.log("Stream connected."));
  stream.on("_disconnected_", () => console.log("Stream disconnected."));
}

// Nothing imports this module — it's only ever run directly as the process
// entrypoint — so it just runs.
void main();

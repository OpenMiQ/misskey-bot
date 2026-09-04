<div align="center">

<img src=".github/assets/icon.png" width="120" alt="OpenMiQ icon">

<br />

<img src=".github/assets/logo.png" width="320" alt="OpenMiQ logo">

</div>

[![CI](https://img.shields.io/github/actions/workflow/status/otnc/OpenMiQ-Misskey/ci.yml?branch=main&label=ci)](https://github.com/otnc/OpenMiQ-Misskey/actions/workflows/ci.yml) [![License](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue)](./LICENSE) [![Additional Terms](https://img.shields.io/badge/additional%20terms-important)](./ADDITIONAL_TERMS.md) [![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org)

_[日本語](./README-ja.md)_

A self-hosted **Misskey** bot that turns a note into a quote image. Based on [OpenMiQ](https://github.com/otnc/OpenMiQ) (a Discord bot), with modifications for Misskey — see [Credits](#credits).

Reply to a note and mention the bot: it renders that note as a quote image (via [makeitaquote](https://github.com/otnc/makeitaquote), which has native Misskey support) and replies with it.

## What's different from the Discord version

Misskey has no slash commands, buttons, select menus, or application emoji, and this bot targets a Misskey version with no `notes/edit` endpoint — a posted note's attached image can't be rewritten in place. So, compared to OpenMiQ:

- **No post-quote interactive editing.** All quote options (`color`, `theme=`, …) are set at mention time only — same syntax as OpenMiQ's Discord options string, just no buttons/select menus afterward to change them.
- **Commands are plain text inside a mention** (`@bot settings view`, …) instead of slash commands.
- **The "server" settings tier is a "host" tier** instead — grouped by the mentioning user's Misskey `host` (their home instance), since Misskey has no server/guild concept.
- **The delete reaction really deletes the note** (`notes/delete`), rather than editing away the attachment like OpenMiQ's Discord delete button — there's no edit API to soft-delete with.

## Usage

**Mention the bot in a reply**, with optional options after the mention — identical syntax to OpenMiQ:

```
@miq                            … quote the replied-to note
@miq color                      … keep the avatar in color
@miq bold                       … bold quote text
@miq light                      … light theme
@miq flip                       … avatar on the right (side layout only)
@miq new                        … new layout — avatar full-bleed, quote over the bottom
@miq chain                      … stack with the note it's replying to, if there is one (side layout only)
@miq font=pop                   … pick a font by alias
@miq theme=sunset               … pick a named background color
@miq theme=default              … clear a saved color-theme default for this note
@miq theme=sunset new font=pop  … options combine freely — put font= last, it reads to the end
@miq c b l f n                  … same as "color bold light flip new"
@miq c,n                        … commas work as separators too, same as "c n"
```

Every toggle has an opposite (and a one-letter shortcut, except `font=`/`theme=`/`chain`):

| Option  | Shortcut | Opposite  | Shortcut |
| ------- | -------- | --------- | -------- |
| `color` | `c`      | `mono`    | `m`      |
| `bold`  | `b`      | `regular` | `r`      |
| `light` | `l`      | `dark`    | `d`      |
| `flip`  | `f`      | `unflip`  | `u`      |
| `new`   | `n`      | `side`    | `s`      |
| `chain` | —        | `unchain` | —        |

`chain` stacks the quoted note with the note _it's_ replying to into one image (top and bottom, via makeitaquote's `MiQChain`). `chain` and `new` can't combine — `chain` wins, forcing the `side` layout for as long as it's on.

Mentioning the bot without replying to anything reacts with ❓ instead of sending (and then deleting) a usage message — press that reaction within a minute and it replies with the `help` text.

Fonts are chosen by short alias (`sans`, `mplus`, `dela`, `dot`, `pop`, `rampart`, `reggae`, `rocknroll`, `serif`, `yuji`, `yusei`, `inconsolata`, `exo2`, `bruno`, `poltawski`, `vina`, `script`, `castoro` — `mplus`/M PLUS Rounded 1c is the default), and `theme=` picks one of makeitaquote's 21 official + 18 original named background colors. Run `help` for the full lists.

A posted quote gets a 🗑️ reaction from the bot as a hint: react with it yourself (as the generator or the quoted note's author) to delete the note.

### Text commands

Misskey has no slash commands, so these are plain keywords inside a mention — `@miq settings view`, `@miq help`, etc.:

- `settings view|set <tokens>|reset` — your own default quote options and language, applied whenever you don't specify them after a mention. `set` takes the same tokens as after a mention, plus `lang=xx`, plus `block-fakequote`/`unblock-fakequote` to control whether others can put words in your mouth with `fakequote`, plus `fake-label`/`no-fake-label` to control the "(fake)" marker on your own `fakequote` renders (shown by default).
- `host-settings view|set <tokens>|reset` — defaults for your own host (home instance). **Bot-admin only** (`ADMIN_IDS`) — Misskey's public API has no way for the bot to check whether an arbitrary caller moderates a given instance, only whether it's the bot's own account (`i`), so this can't be opened up the way OpenMiQ's Discord `/server-settings` is to anyone with "Manage Server". Also has `delete-reaction`/`no-delete-reaction` to show/hide the delete-reaction hint instance-wide.
- `admin view|set <tokens>|reset` — the bot's own fallback defaults, bot admins only (`ADMIN_IDS`). Same extra tokens as `host-settings`.
- `help` — usage help in your resolved language, as a short reply chain (two notes).
- `credits` — who made this bot and what it's built on.
- `fakequote @user: message text -- options` — makes a quote image in someone else's name and avatar, with fabricated text. `--` separates the free-text message from the trailing option tokens (same syntax as after a mention). Its username line reads "(fake) @user" instead of the usual "@user" unless disabled — the target author can block being used at all with `settings set block-fakequote`, and bot admins can disable it everywhere with `admin set block-fakequote`.

Defaults are resolved as: options typed after a mention > your settings > this host's settings > the bot's own defaults > built-in fallback. The same order picks which language a reply is shown in.

## Required

- Node.js v24 or later
  - `fnm` or `nvm` recommended
- [pnpm](https://pnpm.io/) — via [Corepack](https://nodejs.org/api/corepack.html) (bundled with Node): `corepack enable`, then `pnpm` uses the version pinned in `package.json`'s `packageManager` field automatically
- A Misskey account for the bot, and an access token for it with these permissions: `read:account`, `write:notes`, `read:notifications`, `write:notifications`, `write:reactions`, `read:drive`, `write:drive`. Generate one from the account's Settings → API, or via [MiAuth](https://misskey-hub.net/en/docs/for-developers/api/token/miauth/).

## Setup

```bash
# Install dependencies
pnpm install

# If pnpm warns about "Ignored build scripts", review and allow any that
# turn out to be needed: pnpm approve-builds

# Install all fonts (makeitaquote's CLI)
pnpm run setup

# Build
pnpm run build

# Start
pnpm start
```

## Running with pm2

To keep the bot running long-term (auto-restarting it if it crashes), use the included `ecosystem.config.cjs` with [pm2](https://pm2.io/) instead of `pnpm start`:

```bash
pnpm run pm2:start
pnpm run pm2:logs
pnpm run pm2:restart
pnpm run pm2:stop
```

It reads `.env` on its own (both for `PM2_APP_NAME` below and the bot's own variables), so there's nothing extra to export first. Set `PM2_APP_NAME` to name the process something other than the default `openmiq-misskey`.

## Configuration

All of these go in `.env` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `MISSKEY_URL` | The Misskey instance to connect to, e.g. `https://misskey.example` (no trailing slash) |
| `MISSKEY_TOKEN` | The bot account's access token (see [Required](#required) for scopes) |
| `ADMIN_IDS` | Comma-separated Misskey user IDs allowed to run `admin`/`host-settings` |
| `DEFAULT_LOCALE` | Locale used when nothing else sets one (default `en`) |
| `DATA_DIR` | Where per-user/host/bot settings are stored as JSON (default `./data`) |
| `SAVE_IMAGES_DIR` | If set, also save a copy of every generated image here (disabled by default) |
| `LOGO_PATH` | Path to a logo image drawn as the quote watermark in place of the bot's own handle (unset by default) |
| `PM2_APP_NAME` | Process name pm2 registers the bot under (default `openmiq-misskey`) |

Every user-facing string lives in `src/i18n/index.ts`'s `Translations` objects, colocated with the code that uses it, rather than in separate per-locale files. Adding a language beyond English/Japanese means adding its code to `SUPPORTED_LOCALES` in `src/i18n/index.ts` and filling in that new entry everywhere a `Translations` object is defined.

## Development

```bash
pnpm run dev   # loads .env / .env.local
pnpm test      # vitest
pnpm run lint  # eslint
```

## Known v1 limitations

- No post-quote button/select-menu equivalent — re-pick options by mentioning again.
- The delete reaction only works for quotes posted since the last restart (in-memory state, same caveat OpenMiQ's Discord buttons have).
- `host-settings` only ever targets the caller's own host, not an arbitrary remote one.
- Reaction matching compares the reaction string directly against `❓`/`🗑️` — an instance-specific custom-emoji override of those glyphs won't match.

## Author

otoneko. https://github.com/otnc

## Credits

- **OpenMiQ** — https://github.com/otnc/OpenMiQ — this bot is based on OpenMiQ (a Discord bot) by **otoneko.**, with modifications for Misskey.
- **makeitaquote** — https://github.com/otnc/makeitaquote — the library this bot renders images with, including its native Misskey support.
- Make it a Quote (Twitter) — https://twitter.com/MakeItAQuote
- Make it a Quote (Discord/Misskey/Bluesky) — https://miq.moe/

## License

This project is licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE), carrying forward the [additional terms](./ADDITIONAL_TERMS.md) OpenMiQ itself is licensed under (AGPL-3.0 Section 7) — preserved here, unmodified, since this bot is a modified version of that software.

- **SPDX:** `AGPL-3.0-or-later` (with additional terms under AGPL-3.0 Section 7)
- If you distribute or run a modified version of _this_ bot, the same additional terms require you to make your modified source available under AGPL-3.0 and to display attribution to OpenMiQ (original repository URL: https://github.com/otnc/OpenMiQ) as described in [ADDITIONAL_TERMS.md](./ADDITIONAL_TERMS.md).

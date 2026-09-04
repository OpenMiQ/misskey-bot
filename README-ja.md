<div align="center">

<img src=".github/assets/icon.png" width="120" alt="OpenMiQ icon">

<br />

<img src=".github/assets/logo.png" width="320" alt="OpenMiQ logo">

</div>

[![CI](https://img.shields.io/github/actions/workflow/status/otnc/OpenMiQ-Misskey/ci.yml?branch=main&label=ci)](https://github.com/otnc/OpenMiQ-Misskey/actions/workflows/ci.yml) [![License](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue)](./LICENSE) [![Additional Terms](https://img.shields.io/badge/additional%20terms-important)](./ADDITIONAL_TERMS.md) [![Node](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org)

_[English](./README.md)_

ノートを引用画像に変換する、セルフホスト用の **Misskey** Bot。 [OpenMiQ](https://github.com/otnc/OpenMiQ)(Discord Bot)をベースに、Misskey向けに改変したものです — [クレジット](#クレジット) 参照。

ノートにリプライした状態でBotをメンションすると、そのノートを [makeitaquote](https://github.com/otnc/makeitaquote)(Misskeyに標準対応) で引用画像にして画像リプライします。

## Discord版との違い

Misskeyにはスラッシュコマンド・ボタン・セレクトメニュー・アプリケーション絵文字が無く、また本Botが対象とするMisskeyのバージョンには `notes/edit` 相当のAPIが無いため、投稿済みノートの添付画像を後から書き換えることができません。そのためOpenMiQと比べて:

- **投稿後のインタラクティブな設定変更は無し。** 引用オプション (`color`、`theme=` など)はメンション時にのみ指定します — 構文自体はOpenMiQのDiscord版オプション文字列と同じですが、後からボタン/ セレクトメニューで変更することはできません。
- **コマンドはメンション文中のプレーンテキスト**(`@bot settings view` など)で、スラッシュコマンドではありません。
- **「サーバー」設定の段は「host」段** に置き換わっています —メンションしてきたユーザーのMisskeyの `host`(ホームインスタンス)でグループ化します。Misskeyにはサーバー/ギルドという概念が無いためです。
- **削除リアクションは本当にノートを削除します**(`notes/delete`)。OpenMiQのDiscord削除ボタンのように添付を外すだけの見た目上の削除ではありません — ソフトデリートできる編集APIが無いためです。

## 使い方

**リプライ内でBotをメンションする** — メンションの後ろにオプションを付けられます。構文はOpenMiQと同じです:

```
@miq                            … リプライ先のノートをquote
@miq color                      … アバターをカラーのままにする
@miq bold                       … 引用文を太字にする
@miq light                      … ライトテーマ
@miq flip                       … アバターを右側に配置 (横画像レイアウトのみ)
@miq new                        … 縦画像レイアウト — アバターを全面に、下部に引用文
@miq chain                      … リプライ元があれば、そのノートと連結する (横画像レイアウトのみ)
@miq font=pop                   … フォントをエイリアスで指定
@miq theme=sunset               … 背景カラーを名前で指定
@miq theme=default              … 保存済みのカラーテーマ指定をそのノートだけ解除
@miq theme=sunset new font=pop  … 組み合わせも自由 — font= は末尾に置く(それ以降を読み切るため)
@miq c b l f n                  … "color bold light flip new" と同じ
@miq c,n                        … カンマ区切りも可能 — "c n" と同じ
```

それぞれのオプションには逆の指定と1文字の短縮形があります (`font=`/`theme=`/`chain`を除く):

| オプション | 短縮形 | 逆の指定  | 短縮形 |
| ---------- | ------ | --------- | ------ |
| `color`    | `c`    | `mono`    | `m`    |
| `bold`     | `b`    | `regular` | `r`    |
| `light`    | `l`    | `dark`    | `d`    |
| `flip`     | `f`    | `unflip`  | `u`    |
| `new`      | `n`    | `side`    | `s`    |
| `chain`    | —      | `unchain` | —      |

`chain` は、引用するノートがさらに別のノートへのリプライだった場合、その2つを1枚の画像に上下連結して表示します(makeitaquoteの `MiQChain` を使用)。`chain` と `new` は併用できません — `chain` が優先され、有効な間は強制的に横画像(`side`)レイアウトになります。

リプライせずにBotをメンションした場合、使い方メッセージを送ってすぐ削除する代わりに ❓ をリアクションします — 1分以内にそのリアクションを押すと、ピン留めされたヘルプノートへのリンクが返信されます(下記[ヘルプとクレジット](#ヘルプとクレジット)参照)。

フォントは短いエイリアスで指定します(`sans`, `mplus`, `dela`, `dot`, `pop`, `rampart`, `reggae`, `rocknroll`, `serif`, `yuji`, `yusei`, `inconsolata`, `exo2`, `bruno`, `poltawski`, `vina`, `script`, `castoro` — 何も指定しない場合のデフォルトは `mplus`/M PLUS Rounded 1c)。 `theme=` はmakeitaquoteの公式21種類+オリジナル18種類の名前付き背景カラーから選べます。全一覧はピン留めされたヘルプノートを確認してください。

引用画像が投稿されると、Botが目印として🗑️をリアクションします —生成者本人か引用対象本人がそのリアクションを押すと、ノートが削除されます。

### テキストコマンド

Misskeyにはスラッシュコマンドが無いため、メンション文中のプレーンなキーワードとして提供します — `@miq settings view` など:

- `settings view|set <tokens>|reset` — あなた自身のデフォルト引用オプションと言語。メンション時に指定しない場合に使われます。`set` はメンション時と同じトークンに加え、`lang=xx`、`fakequote` であなたの名前を使われるのをブロックする `block-fakequote`/`unblock-fakequote`、自分の `fakequote` に付く "(fake)" 表示を制御する `fake-label`/`no-fake-label`(デフォルトはオン)を指定できます。
- `host-settings view|set <tokens>|reset` — あなた自身のhost (ホームインスタンス)のデフォルト設定。**Bot管理者限定** (`ADMIN_IDS`) — MisskeyのパブリックAPIには、任意の呼び出し元があるインスタンスのモデレーターかどうかをBot側から確認する手段が無く (`i` エンドポイントで分かるのはBot自身のアカウントについてだけ)、OpenMiQのDiscord版 `/server-settings` のように「サーバー管理」権限を持つ誰でも、という形では開放できないためです。インスタンス全体で削除リアクションの目印表示を切り替える `delete-reaction`/`no-delete-reaction` も指定できます。
- `admin view|set <tokens>|reset` — Botのフォールバックデフォルト。Bot管理者のみ(`ADMIN_IDS`)。`host-settings` と同じ追加トークンが使えます。
- `fakequote <options> @user message text` — 指定したユーザーの名前とアイコンで、でっち上げた引用画像を作成します。オプション(メンション時と同じ構文)は `@user` より前に置きます — メンションより後ろはすべて区切り記号なしでそのままメッセージになります。ユーザー名の行は通常の "@user" ではなく "(fake) @user" と表示されます (無効化されていない限り) — 引用対象本人は `settings set block-fakequote` で使われること自体をブロックでき、Bot管理者は `admin set block-fakequote` で全体的に無効化できます。

デフォルトは次の優先順位で解決されます: メンション時に指定したオプション ＞ あなたの設定 ＞ このhostの設定 ＞ Botのデフォルト ＞ 組み込みフォールバック。返信の言語も同じ優先順位で決まります。

### ヘルプとクレジット

`help`/`credits` テキストコマンドはありません。代わりに、起動時に `DEFAULT_LOCALE` の言語でヘルプノートとクレジットノートを投稿(初回のみ)してピン留めします — 全`SUPPORTED_LOCALES`分ではありません。Misskeyのピン留め上限(デフォルト5件)に対し、ヘルプだけで2ノート(フォント/カラーテーマ一覧が1ノートに収まらないため)必要なためです。既に存在するものはスキップするため、再起動しても再投稿・再ピン留めはされません。コード側でヘルプ/クレジットの文言を変更しても、既にピン留めされたノートは自動更新されません — 更新したい場合は `admin repost-pins`(Bot管理者のみ)をメンションすると、古いノートを削除して新しいものを投稿し直します。

合計3ノートすべてがピン留めされます — ヘルプの2ページ(返信チェーン/スレッドとして投稿)とクレジットで、プロフィール上は上からヘルプ1ページ目・2ページ目・クレジットの順に並びます。

## 必要なもの

- Node.js v24 以降
  - `fnm` または `nvm` 推奨
- [pnpm](https://pnpm.io/) — Node同梱の [Corepack](https://nodejs.org/api/corepack.html) 経由: `corepack enable` の後、`package.json` の `packageManager` フィールドに固定されたバージョンが自動的に使われます
- Bot用のMisskeyアカウントと、以下の権限を持つアクセストークン: `read:account`、`write:notes`、`read:notifications`、 `write:notifications`、`write:reactions`、`read:drive`、 `write:drive`。アカウントの 設定→API から発行するか、 [MiAuth](https://misskey-hub.net/ja/docs/for-developers/api/token/miauth/) を使用してください。

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# pnpmが "Ignored build scripts" と警告する場合、内容を確認して必要なら許可:
# pnpm approve-builds

# フォント一式のインストール (makeitaquoteのCLI)
pnpm run setup

# ビルド
pnpm run build

# 起動
pnpm start
```

## pm2で実行する

長期稼働(クラッシュ時の自動再起動)には、`pnpm start` の代わりに同梱の `ecosystem.config.cjs` と [pm2](https://pm2.io/) を使用します:

```bash
pnpm run pm2:start
pnpm run pm2:logs
pnpm run pm2:restart
pnpm run pm2:stop
```

`.env` は自動的に読み込まれます(下記の `PM2_APP_NAME` とBot自体の変数の両方)。デフォルトの `openmiq-misskey` 以外の名前にしたい場合は `PM2_APP_NAME` を設定してください。

## 設定

以下はすべて `.env` に設定します(`.env.example` 参照):

| 変数 | 用途 |
| --- | --- |
| `MISSKEY_URL` | 接続先のMisskeyインスタンス。例: `https://misskey.example` (末尾スラッシュ無し) |
| `MISSKEY_TOKEN` | Botアカウントのアクセストークン (必要な権限は [必要なもの](#必要なもの) 参照) |
| `ADMIN_IDS` | `admin`/`host-settings` を実行できるMisskeyユーザーIDのカンマ区切り |
| `DEFAULT_LOCALE` | 他に何も設定されていない場合に使われる言語 (デフォルト `en`) |
| `DATA_DIR` | ユーザー/host/Botの設定と、ピン留めしたヘルプ/クレジットノートの記録をJSONとして保存する場所 (デフォルト `./data`) |
| `SAVE_IMAGES_DIR` | 設定すると、生成した画像のコピーもここに保存します (デフォルトで無効) |
| `LOGO_PATH` | Bot自身のハンドルの代わりに引用画像のウォーターマークとして描画するロゴ画像のパス (デフォルトで未設定) |
| `PM2_APP_NAME` | pm2がBotを登録するプロセス名 (デフォルト `openmiq-misskey`) |

すべてのユーザー向け文字列は `src/i18n/index.ts` の `Translations` オブジェクトとして、使用箇所のコードの近くに定義されています(別ファイルの言語別リソースではありません)。英語/日本語以外の言語を追加するには、 `src/i18n/index.ts` の `SUPPORTED_LOCALES` にコードを追加し、 `Translations` オブジェクトが定義されている全箇所に新しいエントリを追加してください。

## 開発

```bash
pnpm run dev   # .env / .env.local を読み込む
pnpm test      # vitest
pnpm run lint  # eslint
```

## v1の既知の制限

- 投稿後のボタン/セレクトメニュー相当は無し — 設定を変更したい場合は再度メンションしてください。
- 削除リアクションは、直近の再起動以降に投稿された引用にのみ有効です (インメモリの状態管理のため。OpenMiQのDiscordボタンと同じ制約)。
- `host-settings` は常に呼び出し元自身のhostのみを対象とし、任意のリモートhostを指定することはできません。
- リアクションの照合は(異体字セレクタを除去した)リアクション文字列を `❓`/`🗑` と比較します —インスタンス側でこれらの絵文字がカスタム絵文字に置き換えられている場合は一致しません。

## 作者

otoneko. https://github.com/otnc

## クレジット

- **OpenMiQ** — https://github.com/otnc/OpenMiQ — このBotは **otoneko.** 氏によるOpenMiQ(Discord Bot)をベースに、Misskey向けに改変したものです。
- **makeitaquote** — https://github.com/otnc/makeitaquote — このBotが画像描画に使用しているライブラリです。Misskeyへの標準対応を含みます。
- Make it a Quote (Twitter) — https://twitter.com/MakeItAQuote
- Make it a Quote (Discord/Misskey/Bluesky) — https://miq.moe/

## ライセンス

このプロジェクトは [GNU Affero General Public License v3.0 or later](./LICENSE) の下でライセンスされており、OpenMiQ自体がライセンスされている [追加条項](./ADDITIONAL_TERMS.md)(AGPL-3.0 第7条)を、本Botがその改変版であるため、そのまま(未改変で)引き継いでいます。

- **SPDX:** `AGPL-3.0-or-later` (AGPL-3.0 第7条に基づく追加条項あり)
- この _Bot_ の改変版を配布または運用する場合、同じ追加条項により、改変後のソースコードをAGPL-3.0の下で公開し、OpenMiQへの帰属表示 (元リポジトリURL: https://github.com/otnc/OpenMiQ)を [ADDITIONAL_TERMS.md](./ADDITIONAL_TERMS.md) の定めに従って表示する必要があります。

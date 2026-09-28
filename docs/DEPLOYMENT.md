# Confirmed Cat Bluff deployment

- Network: Midnight Preprod.
- Contract: `63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16`.
- Transaction identifier: `009987c5cac7b5ebd9176f885dcf012358e1ab705d79548519cd4faff4ad8870e8`.
- Transaction hash: `236f9df716f807191b23d4f4c8474a80f8383fcf0b00815f56de9cb73fd879ae`.
- Block: 2,734,912.
- SDK confirmation: `SucceedEntirely`, verified 2026-09-27 16:39:19 UTC.
- Explorer: [contract](https://preprod.midnightexplorer.com/contracts/0x63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16), [successful transaction](https://preprod.midnightexplorer.com/transactions/0x236f9df716f807191b23d4f4c8474a80f8383fcf0b00815f56de9cb73fd879ae).

`src/deploy.ts` queried the public indexer after confirmation. It compared game context, both role commitments, round 1, Empty phase, and the `commit`, `challenge`, and `resolve` verifier keys against local generated artifacts. Exact source-file and verifier-key hashes are recorded in [deployment.json](evidence/deployment.json). The source hash covers the actual local source bytes used for this run; line-ending conversions can change that file hash without changing its circuits.

The screenshots are genuine browser captures. `deployment.png` displays the actual saved verification metadata; `explorer-contract.png` shows the independent explorer. `compile-tests.png` displays genuine saved compiler output and the test summary. None are generated images or simulated terminal output.

## Network preparation and recovered failure

The dedicated wallet received only free faucet tNight. The faucet transaction and dust registration each have a separately recorded successful indexer result. Initial dust synchronization replayed approximately 1.57 million events. Supported SDK batching and private checkpoints reduced repeated work; no events or cryptographic checks were skipped.

The first custom deployment transaction was rejected by the node with `1010: Invalid Transaction: Custom error: 170`. The [official node mapping](https://github.com/midnightntwrk/midnight-node/blob/main/ledger/src/ledger_8/types.rs) identifies this as `InvalidDustSpendProof`. This attempt never produced a deployment-success record.

The application now waits for full synchronization after dust registration and immediately before balancing. A local reservation from the explicitly rejected spend remained in the SDK snapshot. A diagnostic copy using the pinned ledger's `DustLocalState.processTtls` restored one reserved coin; both generation and commitment Merkle roots remained identical, and its balance was evaluated at the actual current time. The original snapshot was backed up privately. This follows the reservation-expiry mechanism used by the pinned SDK's rejected-transaction path; it did not fabricate ledger events, balances, or keys. A fresh deployment transaction then succeeded and was independently verified.

An additional faucet request returned service unavailable and was not used to claim funding. The successful deployment used the original funded wallet.

For future recovery, preserve `.private/wallet-before-balance.json` and inspect the public identifiers saved in `.private/last-submission.json`. Never restore an old snapshot until any possibly submitted transaction is resolved. Recovery material, private-state databases, role capabilities, salts, and wallet checkpoints are intentionally excluded from Git.

## Level 2 audit and published frontend

On 2026-09-28 at 13:22:36 UTC, the public Preprod indexer still returned round 1
in Empty phase. All three on-chain verifier keys matched both tracked generated
artifacts and the original receipt. See [fresh audit](evidence/level2-contract-audit.json).
This was read-only; no new deployment or contract action occurred.

The existing contract is suitable for one operator-authorized frontend commitment.
It cannot be reset. Connecting Lace does not grant its player capability. Do not
run `npm run deploy` to replace this address, delete its saved receipt, or rotate
its private material. A fresh deployment needs a separate human-approved procedure
and new evidence, only if the original round is unavailable.

### Local prover prerequisite

The existing compose file pins `midnightntwrk/proof-server:8.1.0` and binds port
6300 to `127.0.0.1`. Docker was installed but its Linux daemon was unavailable
during the initial audit. A later authorized restart attempt failed with a
`sailor-ingest.sock` error: “The file cannot be accessed by the system.” After
the user approved a reversible backup and repair of Docker's runtime folder,
Docker Desktop **4.91.0** and engine **29.8.0** started successfully. The existing
project proof-server **8.1.0** resumed with only `127.0.0.1:6300` exposed.
At **2026-09-28 14:36:42 UTC**, `/health` returned `status: ok`; see the
[readiness record](evidence/level2-proof-server.json). This verifies the native
local server, not hosted-origin Lace proving. Recheck readiness with:

```bash
docker compose up -d
curl --fail http://127.0.0.1:6300/health
docker compose ps
```

Do not stop unrelated containers, publish the port, change Docker settings, or
disable browser security. If Docker requests a restart/admin permission, the
human completes it. The implemented browser path asks Lace for its proving provider;
the installed wallet's configuration must establish that it uses the intended
user-local prover. Wallet configuration instructions must be based on its actual
UI/version, which has not yet been inspected. A health response alone does not
verify a browser-origin proof request.

### Level 2 frontend build and hosting

Live URL: **[cat-bluff-midnight.vercel.app](https://cat-bluff-midnight.vercel.app)**.
The user authorized push, publication and Rise In submission after verification;
wallet approvals remain human-only. Vercel CLI 50.13.2 published the site under
the signed-in `ayushpaul26` account's free Hobby project scope. The deployment
installed 660 packages and passed both TypeScript targets and the Vite build.
The repository's [`vercel.json`](../vercel.json) defines a static `dist/` deployment. The
configuration selects Vite, runs a pinned npm 11.11.1 clean install and
`npm run build`, and serves only `dist/`. There is no SPA fallback rewrite:
a missing circuit or WASM URL must fail instead of returning `index.html`.
Vercel documents these [`vercel.json` build and output settings](https://vercel.com/docs/project-configuration/vercel-json)
and its [Vite preset](https://vercel.com/docs/frameworks/frontend/vite).

The project targets Node **22.22.0 or newer within 22.x**. Vercel selects a major
version from `package.json` engines or Project Settings and can update the
minor/patch version. The project setting was explicitly changed to Node **22.x**
after initial publication. The subsequent successful
[production build log](evidence/level2-vercel-build.log) explicitly records
**Node v22.23.2 and npm 11.11.1**, satisfying the configured Node range. That
[deployment](https://cat-bluff-midnight-gs6lcguc1-ayush-pauls-projects-bd0a7c11.vercel.app)
was then aliased to the stable live URL; the merged `main` deployment below
subsequently replaced it. The initial project's default was 24.x, while
the package engine requested 22.x; no exact initial runtime version is claimed.
[Vercel's Node version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
describes that behavior. The project-local npm 10 resolver failed in the optional
peer graph while updating dependencies; a project-local npm 11.11.1 install
succeeded. No global npm change is needed. The host install command bootstraps
npm 11.11.1 under `.tools/npm-bootstrap` and invokes its CLI directly, avoiding
an `npx` executable-link dependency. It uses `ci --include=dev --ignore-scripts`.
The scripts-enabled clean Windows install failed because `bin-links=false`
prevented a dependency from finding `node-gyp-build`. A fresh isolated install
with scripts disabled installed 660 packages and built successfully, without
Compact or any private files. The public browser build needs the packaged Vite,
Rollup and WASM assets; it does not execute the Node wallet's native dependencies.
See [complete clean-install/build log](evidence/level2-clean-build.log), including
failed attempts. The subsequent Vercel build passed independently. The
[latest Linux CI run](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36437930406)
also passed real compilation of three circuits, 79 Node tests, 15 mocked UI tests,
both typechecks, lint and build on Node 22.22.0 at `6ffb12d`.

`.vercelignore` explicitly excludes private records, encrypted packages, local
tool/cache directories and environment files from CLI uploads. Public circuit
prover/verifier keys remain included. The user completed Vercel authentication;
the agent performed the authorized publication without approving any wallet request.

For a local review from the project root, use the tested local Node 22.22.0
runtime and the project's pinned dependencies:

```powershell
& ./.tools/node-v22.22.0-win-x64/node.exe --version
& ./.tools/node-v22.22.0-win-x64/node.exe node_modules/typescript/bin/tsc --noEmit
& ./.tools/node-v22.22.0-win-x64/node.exe node_modules/typescript/bin/tsc -p tsconfig.web.json --noEmit
& ./.tools/node-v22.22.0-win-x64/node.exe scripts/copy-web-artifacts.mjs
& ./.tools/node-v22.22.0-win-x64/node.exe node_modules/vite/bin/vite.js build
```

For the complete production build, run `npm run build` in an environment whose
active `node` is 22.22.0 or newer within 22.x. That script typechecks both targets,
copies genuine compiler assets, and builds Vite. `scripts/copy-web-artifacts.mjs`
checks the public deployment receipt and verifier hashes before copying all
three circuits' `.prover`, `.verifier`, and binary `.bzkir` files to `public/zk/`.
It also writes a public integrity manifest and deployment metadata. Generated
bindings and circuit artifacts stay in Git; wallet seeds, capabilities, salts,
checkpoints, encrypted packages and `.private/` stay out of Git and hosting.
The host does not run Compact or a proof server.

The published HTTPS origin passed the following public-asset check:

```bash
node scripts/verify-web-assets.mjs https://cat-bluff-midnight.vercel.app
```

The [2026-09-28 14:32:28 UTC result](evidence/level2-hosted-assets.log) verified
the public manifest/receipt, nine genuine circuit artifacts, three WASM files
and artwork against the expected hashes/bytes. The actual hosted browser screen
loaded Preprod round 1 Empty; no compatible Lace wallet was injected there.
[Hosted screenshot](evidence/level2-hosted.png) records this public-read state.
Wallet connection and the actual proof request path from that HTTPS origin
remain unverified. A hosted frontend supplies public code and circuit assets; each
operator still needs the intended user-local prover. A wallet-reported localhost
URI alone does not prove traffic reached that server.

[PR #1](https://github.com/AyushPaul26/cat-bluff-midnight/pull/1) is merged into
default `main` at `c462dabd1e9e0115f3d35408ffe03993e150aa86`; its tree matches
reviewed `6ffb12d`. Vercel inspection/API confirmed the resulting production
deployment **Ready**: `dpl_BcuweiS9hT2aduLStNbovxnxf5vQ`, configured for Node
22.x, with metadata matching that exact `main` commit. Its
[deployment URL](https://cat-bluff-midnight-fkugx8bxt-ayush-pauls-projects-bd0a7c11.vercel.app)
is aliased to [cat-bluff-midnight.vercel.app](https://cat-bluff-midnight.vercel.app).
See the [publication record](evidence/level2-main-publication.json).

The [2026-09-28 14:47:28 UTC asset check](evidence/level2-main-assets.log)
passed for nine circuit artifacts and three WASM files at the live alias.
A real browser reload showed Preprod round 1 Empty, with no Lace injected in
the inspection browser. These checks verify hosting and public reads; real
wallet connection, local proof traffic and a circuit transaction remain pending.

### Lace funding

The [official token guide](https://docs.midnight.network/guides/acquire-tokens)
requires an **unshielded Preprod address**, beginning `mn_addr_preprod1`, for
the [free faucet](https://midnight-tmnight-preprod.nethermind.dev/).
The operator's Receive screen currently shows only a shielded address, with
no address-type tabs. The exact cause in that installed wallet is unverified.

1. Connect Lace on Preprod at the live Cat Bluff site.
2. Select **Show faucet address**. The connector reads `getUnshieldedAddress()`;
   the pinned address-format SDK checks its checksum, type, network and length.
   Session guards run before and after the read. No wallet transaction occurs.
3. Select **Copy faucet address**, then **Open free Preprod faucet**. Paste it
   there and complete the CAPTCHA/request personally. Do not use the shielded
   or DUST address, buy tokens, or change to mainnet.
4. Once tNIGHT appears in Lace, choose **Generate tDUST** and review/approve
   the wallet request personally, using the wallet's own DUST recipient.
   Wait for actual available tDUST before the one-time demo.

The public faucet address exists only in the connected component's memory; it
is removed on disconnect or identity change. It is not automatically sent to
the faucet. Refresh also clears unlocked demo data; retain and reimport the
original encrypted package when ready to record. Real faucet funding, tDUST
generation and the hosted proof remain pending for this Lace wallet.

### Human-only operator preparation and one-time action

Use a private, interactive terminal in this project root after confirming the
indexed contract is still round 1 Empty. The export command reads the existing
ignored `.private/local.json`, checks the original deployment receipt and live
public state, prompts twice for a passphrase without echo, encrypts only the
player capability and opening, and writes an exclusive file at
`.private/cat-bluff-demo.enc.json`. Do not pass the password as a command-line
argument or put the file in Git, chat, screenshots or Vercel.

```powershell
npm run demo:export
docker compose up -d
curl.exe --fail http://127.0.0.1:6300/health
docker compose ps
```

`npm run demo:export` requires a TTY and will not overwrite an existing export.
The compose file pins `midnightntwrk/proof-server:8.1.0` and binds only
`127.0.0.1:6300`. Start Docker Desktop's Linux engine first if it is stopped.
Use Lace on Preprod with its local prover at `http://localhost:6300` (equivalent
to this project's `127.0.0.1:6300`). Lace 2.4's default Blockfrost Preprod indexer
and node form a separately allowlisted endpoint tuple; they need not match the
dApp's official Midnight public indexer. The wallet displays these endpoints
read-only, so do not attempt to edit them. The defaults and API 4.0.1 are verified
against [Lace 2.4 configuration](https://github.com/input-output-hk/lace/blob/lace-extension@2.4.0/packages/contract/midnight-context/src/const.ts)
and [connector source](https://github.com/input-output-hk/lace/blob/lace-extension@2.4.0/packages/module/dapp-connector-midnight/src/midnight-wallet-api.ts).
The user reports Lace installed, a password created and all three wallet accounts
activated. Preprod selection, funding and dApp connection remain unverified;
password entry and wallet approval must be completed personally. The real
wallet UI/version has not yet been inspected, so no menu path is asserted.
Confirm the wallet reports the intended
loopback prover URI **and** observe a genuine wallet-mediated proof request at
that local server; test browser local-network access/CORS from the hosted origin.
Do not weaken browser security to make that request work. Use free Preprod
assets only; never use mainnet funds.

The original contract has a single Empty round. Reserve its first `commit`
for the hosted-origin recording after local checks and human wallet approval.
Connecting a wallet is not player authorization. The user imports the encrypted
package into the browser at runtime and approves the wallet request personally.
If the public round is no longer Empty, stop and inspect; do not redeploy or
submit another transaction automatically. Keep public pending identifiers so an
uncertain submission can be reconciled before retry. Verify successful indexed
status, expected Committed ledger state, and explorer link before reporting a
proof. No Level 2 live transaction or hosted-origin proof is claimed here.

### Baseline commands actually executed

From the dedicated project root in PowerShell, using local Node 22.22.0:

```powershell
& ./.tools/node-v22.22.0-win-x64/node.exe node_modules/typescript/bin/tsc --noEmit
& ./.tools/node-v22.22.0-win-x64/node.exe --experimental-strip-types --test tests/*.test.ts
```

Typecheck exit 0; 22/22 tests passed. A restricted-process log-capture attempt
failed at Node child-process creation with `spawn EPERM`; rerunning unchanged
with execution permission passed. No assertion or production code was changed.
Logs: [typecheck](evidence/level2-baseline-typecheck.log),
[passing tests](evidence/level2-baseline-tests.log),
[sandbox failure](evidence/level2-baseline-tests-sandbox.log).

The audit sourced `scripts/env.sh` inside Ubuntu and ran `compact --version`,
`compact compile +0.31.1 --version`, and the real compiler with the same arguments
as `scripts/compile.py` into a fresh `.tools/level2-baseline-*` directory. It
compared generated prover/verifier bytes to `managed/` without replacing files.
[Compiler log](evidence/level2-baseline-compile.log). The supported normal
reproduction remains `source scripts/env.sh` then `npm run compile` inside WSL.

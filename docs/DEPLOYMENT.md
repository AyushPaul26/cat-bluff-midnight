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

## Level 2 audit and planned browser deployment

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
6300 to `127.0.0.1`. Docker was installed but its Linux daemon was stopped/unavailable
during this audit; no current server readiness is claimed. Once the human has
started Docker Desktop's Linux engine, the existing commands are:

```bash
docker compose up -d
curl --fail http://127.0.0.1:6300/health
docker compose ps
```

Do not stop unrelated containers, publish the port, change Docker settings, or
disable browser security. If Docker requests a restart/admin permission, the
human completes it. The planned browser path asks Lace for its proving provider;
the installed wallet's configuration must establish that it uses the intended
user-local prover. Wallet configuration instructions must be based on its actual
UI/version, which has not yet been inspected. A health response alone does not
verify a browser-origin proof request.

### Frontend hosting

Live URL: **not deployed**. Vercel configuration and frontend build commands are
**not implemented yet**. They will be added and tested in the browser milestone;
do not treat the Level 1 npm scripts as a frontend deployment procedure.

Planned clean-build approach: retain generated bindings, binary circuit IR,
prover keys and verifier keys in Git; copy them to tested static asset paths as
part of Vite's build. They are public circuit artifacts, not wallet private keys.
The host will not need Compact. Preserve existing license notices and reject
asset responses that contain the SPA fallback HTML.

The human will authenticate and publish the reviewed build. Then verify the real
hosted origin, its Preprod address/endpoints, circuit/WASM files, Lace connection,
wallet proving path, any local-network permission/CORS behavior and confirmed
transaction. A hosted frontend supplies code/assets, not a local proof server to
every visitor. A shared serverless prover proxy is outside this design.

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

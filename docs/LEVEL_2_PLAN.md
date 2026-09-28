# Level 2: audited design and implementation plan

Checked 2026-09-28. Status: **frontend published; real-wallet E2E checkpoints pending**.
The human approved this plan, authorized local development commits, and later
explicitly authorized push, frontend publication and Rise In submission once
verified. Wallet approvals remain human-only. References below to manual
development commits and publication describe the original checkpoint plan;
the current authorization permits those routine agent actions without another
permission request. No new contract deployment is needed or claimed.

## Implementation outcome

The approved flow is now implemented in `src/web/` and the local encrypted export
tool. The contract and deployed address are unchanged. Local commits include the
audit (`4f773f0`), private-state milestone (`15a5391`), frontend integration
(`c4328df`) and final local evidence (`b07fef0`). At `b07fef0`: **15 total /
4 new Level 2 commits**, with the 11-commit Level 1 baseline preserved. The
subsequent publication and Lace compatibility commits brought the total to
**17 meaningful non-merge commits: 11 Level 1 + 6 Level 2**. A normal merge of
[PR #1](https://github.com/AyushPaul26/cat-bluff-midnight/pull/1) preserved this
history on default `main` at `c462dabd1e9e0115f3d35408ffe03993e150aa86`;
its tree matches reviewed head `6ffb12d`. [Merge screenshot](evidence/level2-merged.png).

Current evidence: 81 Node tests, 15 mocked UI/hook tests, both TypeScript targets,
ESLint and production build pass. The actual browser production preview reads
Preprod round 1 Empty and verifies all three circuit keys. All nine generated
circuit files and three WASM files pass served-byte checks. Desktop/mobile
screenshots are real local preview evidence, not wallet-transaction evidence.
The [Vercel frontend](https://cat-bluff-midnight.vercel.app) is now published.
Its production build passed, the hosted page loaded public Preprod state, and
[latest hosted verification](evidence/level2-main-assets.log) passed for all nine
circuit artifacts and three WASM files. The independent
[latest Linux CI run](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36437930406)
passed compilation of all three circuits, 79 Node tests, 15 mocked UI tests,
both typechecks, lint and build at `6ffb12d`. The merge-triggered production
deployment is **Ready**, identifies `main` commit `c462dabd` in Vercel metadata,
and serves the stable live alias. [Publication record](evidence/level2-main-publication.json).
The 14:47:28 UTC asset check passed; a real browser reload again showed Preprod
round 1 Empty with no injected wallet. This establishes no circuit transaction.

Important implementation adjustments from the original plan below:

- A real Lace authorization exposed an unnecessary `hintUsage` requirement.
  The [source-backed correction and regression evidence](evidence/level2-wallet-api-fix.md)
  retain all 16 wallet-operation checks, network/identity validation and session
  guards. Reconnection on the updated frontend remains pending.

- Lace 2.4.0's read-only Blockfrost Preprod services are accepted as one complete
  allowlisted tuple, alongside the original Midnight tuple. Four regression
  tests exercise the real commit configuration gate; network/session/verifier
  and local-prover checks remain in place. [Validation](evidence/level2-lace-compatibility.log)
  records the initially failing regression and passing 79 Node / 15 UI suite.

- npm 11.11.1 is bootstrapped locally because bundled npm 10 failed resolving the
  optional-peer graph. No global machine configuration was changed.
- Native ES2022 top-level await replaces an unnecessary plugin whose SWC
  transformation failed. The browser build uses a pinned `assert` polyfill and
  native WebSocket adapter for SDK imports. The ZK provider receives bound
  browser `fetch`, fixing a failure observed during real browser testing.
- Web Locks serialize commit and reconciliation across tabs. Identity-checked
  public records prevent overwriting another in-flight transaction. A definitely
  unsent cancellation is distinct from an ambiguous wallet submission failure.
  Independent review reproduced both races before the fixes and verified them.
- The inspected local and hosted browser has no compatible wallet injection.
  The user now reports Lace installed, a password created and all three wallet
  accounts activated. Preprod selection, funding and actual dApp connection
  remain unverified; passwords and transaction approvals remain human-only.
  Docker startup was retried and failed with a `sailor-ingest.sock` error:
  “The file cannot be accessed by the system.” The user then approved a
  reversible runtime-folder backup and repair. Docker Desktop 4.91.0 / engine
  29.8.0 started, and the existing proof-server 8.1.0 resumed on loopback only.
  Its [14:36:42 UTC health check](evidence/level2-proof-server.json) returned
  `ok`. This verifies native readiness; real proving, Lace requests,
  hosted-origin local-network access and video remain unverified.
- Frontend publication used Vercel CLI 50.13.2 after the human signed in, on a
  free Hobby project. The project is set to Node 22.x, and the subsequent
  [production build log](evidence/level2-vercel-build.log) records Node v22.23.2
  and npm 11.11.1. No new contract deployment,
  Rise In submission or wallet approval was performed.

The rest of this document preserves the audit and originally approved design;
historical phrases such as “planned” and “none installed yet” describe that audit,
not the current code. The [submission evidence matrix](LEVEL_2_SUBMISSION.md) is
the current completion gate.

## Goal and scope

Build a React + TypeScript + Vite **Private Action Demo** for Cat Bluff. Connect
Lace on Preprod, call the existing `commit(claim)` circuit from the browser, and
verify its public result without rendering the rank, salt, or player capability.
Keep npm and the compatible Level 1 stack. The future 2–4-player, 52-card game is
product direction, not this milestone. No wagering, tokens, NFTs, matchmaking,
multiplayer service, reset protocol, or full-deck production is included.

## Baseline audit

- Root: dedicated `cat-bluff-midnight` repository, initially clean.
- HEAD: `92aa7b459339e4f83b925f53234c3073123df62c`; branch `codex/level1`.
- 11 existing meaningful commits; 0 new Level 2 commits. The materials say at
  least eight commits, not explicitly eight additional commits.
- Public GitHub repository and default `main` branch inspected in the browser:
  [AyushPaul26/cat-bluff-midnight](https://github.com/AyushPaul26/cat-bluff-midnight).
- Windows / PowerShell 7.6.5; Ubuntu WSL2. Node 22.22.0 is installed locally.
  No applicable `AGENTS.md` was found in the repository or checked ancestors.
- Existing modules implement Node wallet/deployment, real generated bindings,
  private witnesses, safe checkpoint recovery, and 22 tests. There is no frontend,
  browser wallet integration, hosting configuration, or artwork to preserve.
- Compile succeeded with CLI 0.5.1 / compiler 0.31.1 in fresh ignored output;
  all three prover/verifier key pairs match tracked artifacts. `managed/` unchanged.
- Typecheck passed. All 22 tests passed, including real generated-contract tests.
  A log-capture rerun initially failed before execution with sandbox `spawn EPERM`;
  the identical command passed with child-process permission. Both logs retained.
- No existing lint or frontend build command: NOT APPLICABLE to this baseline.
- Docker is installed but the Linux daemon was unavailable (named pipe absent).
  Its configuration was not changed. Proof-server readiness is not verified today.
- Rise In Level 1 now shows **Approved / Completed** for this repository.
  Level 2 shows **Awaiting submission**. September is active, labelled
  Aug 31–Sep 30; the page does not specify the cutoff time or timezone.

## Existing on-chain contract

Preprod address:
`63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16`.

The [fresh indexer audit](evidence/level2-contract-audit.json), at
2026-09-28T13:22:36.555Z, found round 1 **Empty** and matched every on-chain
verifier key to the generated files and original deployment receipt.
[Original confirmation](evidence/deployment.json) records `SucceedEntirely`.

Transactions: `commit(claim: bigint)`, `challenge()`, `resolve()`; all return `[]`.
Witnesses: `secret -> Bytes<32>`, `rank -> Uint<8>`, `salt -> Bytes<32>`.
Witness callbacks return `[privateState, value]`. Public fields and constraints
are detailed in [PRIVACY_MODEL.md](PRIVACY_MODEL.md).

**Critical limitation:** constructor-fixed capability commitments authorize the
roles. Lace connection is not role authorization. This address supports exactly
one round and no reset. After commitment, visitors can inspect its public result;
they cannot repeatedly commit or obtain a role just by connecting a wallet.

## Chosen approach and alternatives

1. **Recommended: reuse the unchanged deployed contract.** The operator privately
   imports a capability/opening package, connects their own Lace wallet, and makes
   one genuine browser commitment. Everyone can inspect public state. This keeps
   the strongest existing primitive and needs no redeployment.
2. Deploy the unchanged contract per demo session: supports fresh sessions, but
   adds manual deployment, funding, address, and evidence work. Prepare this only
   if the current round becomes unavailable; never silently redeploy.
3. Add a reusable/multiplayer contract: out of scope for this milestone.

The first real commitment consumes the only Empty round. Reserve it for the
hosted-origin recording and verification after automated/local checks. Human
wallet approval is the final checkpoint. Do not automatically challenge or reveal.

## End-to-end design

1. Load validated public Preprod configuration and set the network ID before
   constructing SDK providers. Fetch current ledger and check verifier identities.
   A missing/mismatched address or artifacts disables the action.
2. Enumerate compatible injected wallets under `window.midnight`; explicitly
   select Lace when necessary. Connect only on a user click with `preprod`.
   Revalidate status/network and display the actual **shielded address** with copy.
3. Import an encrypted, capability-only demo package at runtime. It contains the
   existing player secret and unused rank/salt plus network/address/context/round,
   never the CLI wallet seed, challenger secret, database password, or checkpoints.
   A local export tool will ask the human for an encryption passphrase without
   echoing it and refuse missing/mismatched source records. This tool is planned,
   not present yet. No fresh secrets may be substituted for missing role material.
   Write the encrypted package only under ignored `.private/`, with exclusive
   creation, no plaintext temporary file and no overwrite of the original record.
   Verify decrypting the saved package and its scope before enabling commitment.
   Exclude even encrypted packages from Git, static hosting, screenshots and uploads.
4. Decrypt only into a dedicated in-memory private-state module. Validate the
   role against the indexed player commitment. Keep witnesses out of React UI
   state, DOM, attributes, errors, analytics, URLs, and public network requests.
   Preserve the original local Level 1 record and encrypted package for recovery.
5. The public claimed rank (1–13) is selected independently of the hidden rank;
   bluffing remains valid. On one guarded click, revalidate wallet/public state,
   execute generated `commit`, obtain the real proof, request human wallet
   balancing/approval, submit, and observe the indexer.
6. Wrap actual provider boundaries to report preparing, proving, wallet approval,
   submission, and confirmation. No timer-based success or percentage animation.
   Record the public transaction identifier before submission. Require successful
   indexed status and the expected ledger transition/commitment for confirmation.
   An uncertain result remains pending and is checked using the same identifier.
7. On refresh fetch public state again. On disconnect/account/network changes,
   invalidate session generations, remove references/subscriptions/polls, and
   release in-memory witness data. Recheck generation, account and network before
   every subsequent prove, balance/sign and submit boundary, not just UI updates.
   Stop unsent work after invalidation; preserve public metadata for any possibly
   submitted transaction across disconnect, and reconcile it before retrying.
   Ignore stale UI promises. Do not claim revocation
   of Lace's saved site permission; the installed connector has no such method.

### Provider and proving decisions

Use the installed 4.1.1 types as the implementation contract. Provide public
indexer data, an in-memory private-state provider, fetched public ZK artifacts,
proof provider, wallet balancing, and transaction submission. Node filesystem
providers and `node:crypto` witness helpers must not enter the browser bundle.

Preferred composition: connector 4.0.1 `getProvingProvider()` with
`zkConfigProvider.asKeyMaterialProvider()`, adapted by Midnight.js
`createProofProvider()`. Confirm this exists and operates in the installed Lace
version before claiming success. Its abstract API does not establish the proving
location. Inspect wallet configuration and verify the selected user-local prover.
No shared developer prover or hosting proxy is allowed. If Lace cannot provide
this path, evaluate its documented local HTTP path and record that limitation.

The connector has status/configuration queries, but no documented disconnect,
network-switch, or account-change event API. Poll/revalidate supported queries
and session identity. Its submit call returns no transaction identifier; derive
the identifier from the actual finalized SDK transaction, then await indexer data.

### Private-state recovery

Use the existing unused locally generated opening, not a newly generated opening
on each render. The encrypted export uses a versioned authenticated envelope:
AES-256-GCM with a fresh 12-byte IV, and PBKDF2-HMAC-SHA256 with 600,000 iterations
and a fresh 16-byte KDF salt. Authenticate network/address/context/round metadata
as additional data. Enforce fixed supported parameters, length bounds and a
64 KiB input limit. Test Node/Web Crypto round trips, tampering and wrong
passphrases; require a strong human passphrase. Ask for the
passphrase only locally, clear that field promptly, and never store it. Contract
witness values are never placed in an input element. Recovery is reimport of the
same package. In Empty phase, validate network/address/context/round, player role,
rank bounds and salt length; the all-zero commitment is a sentinel. In subsequent
phases also recompute `deriveCard` and require the indexed commitment to match.
Always retain the original opening. No plaintext browser
persistence. Record only public pending-transaction metadata across refreshes.
Lost passphrase/package requires the preserved original local record; no reset
or claim of recoverability without that material. JavaScript cannot guarantee
zeroization of every garbage-collected copy; trust the browser and its extensions.

### Screen and hosting

One responsive card-club screen: identity, Preprod badge, Lace controls, public
claim selector/action, real status and receipt, public/private explanation, and
first-use guide. Use solid cream/ink/terracotta colors, readable restrained type,
visible cat artwork independent of the witness, keyboard focus, reduced motion,
and a muted-by-default optional sound. Original replaceable artwork/provenance
will be documented; no supplied asset exists in the repository yet.

Add root Vite configuration and a separate browser TS config; keep the Node CLI
and its tests intact. Copy reviewed `managed/` artifacts into the production
static output with an integrity manifest. Verify WASM/assets from production
paths. Prepare Vercel config (`npm ci` and tested build command), but the human
authenticates and publishes. A hosted site does not provide visitors a prover.

## Files and ordered manual milestones

| Milestone | Files / work | Verification and human checkpoint |
| --- | --- | --- |
| 1. Audit/design | This plan, privacy/deployment/submission docs, README scope, baseline logs | Review design; manual file-scoped commit before implementation |
| 2. Browser setup | `package.json`, lockfile, Vite/browser TS config, `src/web/`, artifact-copy script | Verify exact package exports/engines/peers; clean build and asset loads; manual commit |
| 3. Lace lifecycle | `src/web/components/WalletConnect.tsx`, `hooks/useMidnight.ts`, wallet/config modules | Typed mocks for injection/rejection/network/session races/disconnect; manual commit |
| 4. Private/provider integration | Capability export, envelope codec, witnesses, memory state, browser providers | Real-binding authorization/opening tests, tamper/scope/recovery tests, bundle isolation; manual commit |
| 5. Circuit flow/UI | `CircuitCall.tsx`, transaction/state modules, style/artwork/guide/sound | Duplicate clicks, errors, timeout reconciliation, privacy leakage checks, responsive browser inspection; manual commit |
| 6. Delivery/evidence | Vercel config, docs, README, public results only | Full checks; human hosting + wallet approval + video; verify live origin; manual commit/push/submission |

These are meaningful checkpoints, not a requirement to create six or eight new
commits. Use `codex/level2-integration` from the audited baseline; no worktree is
needed while this dedicated clean project has no competing edits. Recheck status
after every manual checkpoint and preserve any new user changes.

## Test and completion gates

- Preserve/run all 22 baseline tests with the actual generated contract.
- New logic: fail-first tests for invalid configuration, private package bounds,
  role/context/round/commitment binding, memory isolation, wallet lifecycle,
  duplicate execution, errors, account changes, and delayed confirmation.
- UI tests use typed mocks and are labelled **mocked**. Check text, attributes,
  accessibility tree, logs, and outbound public-service payloads with throwaway
  witnesses. Treat the declared user-local prover as a separate private boundary.
- Run compile, both TypeScript targets, lint, tests, and production build. Verify
  packaged circuit/WASM URLs and desktop/mobile layouts using browser tools.
- Real E2E requires actual Lace, local proving, human approval, Preprod successful
  status plus expected public state, hosted-origin verification, and recorded video.
- No Level 2 completion claim before all mandatory evidence is present. See the
  [status matrix and manual checkpoints](LEVEL_2_SUBMISSION.md).

## Source record and conflicts

Read the supplied `midnight_prompts (1).pdf`, physical pages 5–7, including rendered
pages; also exported/read the live [linked prompt guide](https://docs.google.com/document/d/17DWYHc7q_e_qFfe0JeszqIMpSAf2S0cMwbPVOpPs4BU/edit).
They agree. No additional Level 2 screenshot files were supplied in this turn.
The [live task](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/K7CxZD1QjK5zhzL8u)
is the pass/submission authority; safeguards in this plan are engineering choices.

- PDF p6 says “Proof is generated locally in the browser”. Native Docker/HTTP
  proving is not browser-WASM execution. That book-specific item remains unresolved;
  use the focused organizer question in the submission document.
- The [video](https://www.youtube.com/watch?v=o3QgMhD1a_o) was accessible through a
  browser-exported **auto-generated English transcript**. It describes Preview
  hello-world deployment, not the titled frontend integration. This audit read the
  transcript, not the video. Follow the task's Preprod requirement.
- The book's Claude MCP command is not a Codex command. `codex mcp add --help`
  and `codex mcp list` were checked. Midnight docs MCP is absent, and no callable
  Midnight tool was available. No persistent config changed. Official web docs
  and installed package sources are the authorized fallback; no MCP query passed.
- The book's example counter and dependency list are tutorial suggestions, not
  reasons to replace Cat Bluff or install unverified packages.
- The [Preprod matrix](https://docs.midnight.network/relnotes/support-matrix) checked
  today matches existing CLI 0.5.1, compiler 0.31.1, runtime 0.16.0, Midnight.js
  4.1.1, connector 4.0.1, Wallet SDK 1.2.0 and proof server 8.1.0. Ledger v8 8.1.0
  is pinned in the lockfile. Preserve them. Frontend package pins must be verified
  for exports/peers/browser compatibility before installing in milestone 2.
- Current general Midnight.js web reference identifies 4.0.4; installed 4.1.1
  declarations control signatures. The tutorial uses optional/deprecated
  `proverServerUri`; connector 4.0.1 exposes wallet-mediated proving instead.

Further official sources read for the design: [documentation index](https://docs.midnight.network/llms.txt),
[endpoints](https://docs.midnight.network/relnotes/network),
[React wallet guide](https://docs.midnight.network/guides/react-wallet-connect),
[connector](https://docs.midnight.network/api-reference/dapp-connector),
[browser integration](https://docs.midnight.network/tutorials/leaderboard/browser-dapp),
[hosting](https://docs.midnight.network/tutorials/leaderboard/deployment),
[proof server](https://docs.midnight.network/guides/run-proof-server),
[local proving](https://docs.midnight.network/guides/local-proving),
[security boundaries](https://docs.midnight.network/guides/security-best-practices),
[Midnight documentation MCP](https://docs.midnight.network/ai-integration/kapa-mcp-server),
[Codex MCP](https://developers.openai.com/codex/mcp).

### Frontend dependency candidates verified before installation

Read-only public npm metadata checks found these concrete compatible candidates;
none is installed yet. Preserve exact pins rather than selecting `latest`:

| Area | Candidate versions |
| --- | --- |
| React | `react` / `react-dom` 19.2.4 |
| Vite | `vite` 7.3.1, `@vitejs/plugin-react` 5.1.4 |
| Browser types | `@types/react` 19.2.14, `@types/react-dom` 19.2.3 |
| Tests | `vitest` 4.1.7, `jsdom` 27.4.0 |
| Testing Library | React 16.3.2, DOM 10.4.1, user-event 14.6.1, jest-dom 6.9.1 |
| Browser build support | `buffer` 6.0.3, `vite-plugin-wasm` 3.5.0, `vite-plugin-top-level-await` 1.6.0 |
| Version parsing | `semver` 7.7.4, `@types/semver` 7.7.1 |
| ZK fetch | `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` 4.1.1 |

Declared Node engines and peer ranges fit Node 22.22.0 / TypeScript 5.9.3 / Vite 7 /
React 19. Resolve and inspect the resulting lockfile before claiming runtime
compatibility; production WASM and extension behavior remain unverified. Choose
and validate lint-tool pins in the setup milestone. Directly declare connector
4.0.1 rather than relying on its current transitive installation.

The fetch provider's published tarball exports ESM/CJS and matching declarations;
it has no filesystem imports and fetches `keys/<circuit>.prover`,
`keys/<circuit>.verifier`, and **`zkir/<circuit>.bzkir`**. Preserve binary IR files;
copying only human-readable `.zkir` files is insufficient. Its dependencies include
Midnight.js types/utils 4.1.1 and `cross-fetch ^4.1.0` (lock exact resolution).

Primary metadata: [React DOM](https://registry.npmjs.org/react-dom/19.2.4),
[Vite](https://registry.npmjs.org/vite/7.3.1),
[React plugin](https://registry.npmjs.org/@vitejs/plugin-react/5.1.4),
[Vitest](https://registry.npmjs.org/vitest/4.1.7),
[jsdom](https://registry.npmjs.org/jsdom/27.4.0),
[Testing Library](https://registry.npmjs.org/@testing-library/react/16.3.2),
[fetch provider](https://registry.npmjs.org/@midnight-ntwrk/midnight-js-fetch-zk-config-provider/4.1.1).

# Level 2 submission evidence and checkpoints

Audit date: 2026-09-29. **Not submission ready.** The user approved the design,
local development commits, and subsequently push, frontend publication and Rise In
submission once verified. The frontend is published at
[cat-bluff-midnight.vercel.app](https://cat-bluff-midnight.vercel.app); local checks,
Linux CI and hosted public asset/state checks passed. A real Lace/prover flow,
video and confirmed Level 2 transaction are still pending. Wallet approvals,
password entry and other account-only actions remain human-only.

## Official requirements and evidence

The [live Level 2 task](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/K7CxZD1QjK5zhzL8u)
was read in the signed-in browser. Its five pass requirements are distinct from
the submission package and this project's engineering safeguards.

| Item | Status | Concrete evidence / missing work |
| --- | --- | --- |
| Lace connect and disconnect | IMPLEMENTED BUT UNVERIFIED | [Real connection screenshot](evidence/level2-lace-connection.md) verifies Lace connected on Preprod after human authorization. Actual disconnect and reconnect still require verification; faucet receipt and DUST registration are separately confirmed |
| Successful frontend Compact circuit call | IMPLEMENTED BUT UNVERIFIED | Browser `commit(claim)` integration targets existing contract; no Cat Bluff transaction or circuit-call wallet approval yet |
| Observable proof without showing private input | IMPLEMENTED BUT UNVERIFIED | Local UI and contract tests; hosted public read verified, actual proving path and confirmed circuit result pending |
| Verifiable Preprod deployment | VERIFIED | [Original successful deployment](evidence/deployment.json); [fresh ledger/key check](evidence/level2-contract-audit.json) |
| At least eight meaningful commits | VERIFIED | 11 Level 1 + 6 Level 2 = 17 meaningful non-merge commits at the PR #1 merge; normal merge preserves all six Level 2 commits. No claim that eight additional commits are required |
| Public repository with README | VERIFIED | [Public repository](https://github.com/AyushPaul26/cat-bluff-midnight); [PR #1](https://github.com/AyushPaul26/cat-bluff-midnight/pull/1) merged into default `main` at `c462dabd1e9e0115f3d35408ffe03993e150aa86`, with the same tree as reviewed `6ffb12d`. [Merge screenshot](evidence/level2-merged.png) |
| Live frontend URL | VERIFIED | [Published Vercel app](https://cat-bluff-midnight.vercel.app); diagnostic revision `515af18` **Ready**, [latest hosted artifact checks passed](evidence/level2-connection-diagnostic-hosted-assets.log). [Publication record](evidence/level2-connection-diagnostic-publication.json) |
| Demo video: connect and successful circuit call | BLOCKED | Not recorded |
| README privacy claim | VERIFIED | README on default `main` describes the exact statement, capability authorization, local-prover trust and unresolved real E2E |

The commit wording does not explicitly demand eight additional commits after
Level 1. Record total and new counts separately. This audit does not determine
how organizers will assess the quality of future development history.

## Book-specific items and safeguards

| Item | Status | Evidence / next check |
| --- | --- | --- |
| Read physical PDF pages 5–7 and live prompt guide | VERIFIED | Text extraction plus visual inspection; live Google Doc export agrees |
| Connected address, rejection/missing-wallet/network errors | IMPLEMENTED BUT UNVERIFIED | Real connected address was shown in operator evidence, and a later actual `connect.status/Rejected` was displayed safely. Wrong-network handling remains mocked; no successful reconnect is claimed |
| Loading/result UI and absent private witness | IMPLEMENTED BUT UNVERIFIED | Local UI tests and privacy inspection with throwaway witnesses; hosted page inspected without Lace, real processing/private traffic remains unverified |
| Literal local **browser** proving (PDF p6) | BLOCKED | Native proof-server guidance differs; obtain clarification or prove supported browser execution |
| Video under two minutes | BLOCKED | Human recording after hosted transaction |
| Compiler / generated artifact baseline | VERIFIED | [Compile log](evidence/level2-baseline-compile.log); three circuits and matching key pairs |
| Baseline typecheck / contract tests | VERIFIED | [Typecheck](evidence/level2-baseline-typecheck.log), [22 passing tests](evidence/level2-baseline-tests.log) |
| Frontend build/lint | VERIFIED | Latest local diagnostic [build/both typechecks](evidence/level2-connection-diagnostic-build.log) and [ESLint](evidence/level2-connection-diagnostic-lint.log) pass; revision `515af18` is published |
| Generated-contract and application tests | VERIFIED | [99 local Node tests](evidence/level2-connection-diagnostic-full-node.log), including safe connection diagnostics, endpoint/faucet regressions and original generated-contract behavior. Wallet orchestration uses mocks |
| Mocked UI/hook tests | VERIFIED | [20 local tests](evidence/level2-connection-diagnostic-full-ui.log); these do not test a real wallet, prover or wallet outbound payloads |
| Local production browser and asset delivery | VERIFIED | [Desktop](evidence/level2-desktop.png), [mobile](evidence/level2-mobile.png), [nine circuit/three WASM checks](evidence/level2-assets.log); live Preprod state and verifier read succeeded |
| Hosted production page and public assets | VERIFIED | [Live app](https://cat-bluff-midnight.vercel.app) serves Ready revision `515af18`; [nine circuit/three WASM checks](evidence/level2-connection-diagnostic-hosted-assets.log) passed at 18:32:54 UTC and [delivered diagnostic code](evidence/level2-connection-diagnostic-hosted-code.json) was verified. Earlier screenshots preserve their historical state |
| Clean build without Compact or private files | VERIFIED | [Isolated Windows install/build](evidence/level2-clean-build.log); Vercel independently installed 660 packages and passed typechecks/Vite. [Subsequent build log](evidence/level2-vercel-build.log) records Node v22.23.2 and npm 11.11.1 |
| Linux validation | VERIFIED | [CI run](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36465711677) at the published `515af18` revision completed successfully at 18:32:12 UTC: all 3 circuits and both key types, 99 Node + 20 mocked UI tests, both TypeScript targets, ESLint and Vite build |
| Known-secret and credential-pattern audit | VERIFIED | [135 staged files and 189 history blobs checked](evidence/level2-secret-audit.log), including comparison with five local secret values without printing them |
| Current proof-server readiness | VERIFIED | [2026-09-28 14:36:42 UTC health record](evidence/level2-proof-server.json): proof-server 8.1.0 returned `ok`, bound only to `127.0.0.1:6300`, after user-approved Docker runtime repair. Native readiness only; hosted-origin proving pending |
| Operator faucet receipt and DUST registration | VERIFIED | [Funding evidence](evidence/level2-lace-funding.md): 5,000 tNIGHT received; personally approved registration succeeded at block 2748825, with the intended DUST destination and initial output |
| Operator wallet synchronization / spendable DUST | BLOCKED | Lace 2.4.1 showed Midnight Syncing 99% after Chrome restart/unlock. A subsequent dApp retry returned `connect.status/Rejected` even after an extension restart. Confirmed registration and process activity do not establish spendability |
| Current Blockfrost endpoint compatibility | IMPLEMENTED BUT UNVERIFIED | [Correction and audit](evidence/level2-blockfrost-compatibility.md): 7 focused / 92 full Node tests, 18 mocked UI tests, types/lint/build and independent review pass; published `014eec4` is delivered and CI verified. Actual wallet proof remains pending |
| Bounded connection support code | VERIFIED | [Diagnostic evidence](evidence/level2-connection-diagnostic.md): published at `515af18`, exact-head CI and hosted assets/code verified. A real retry returned `connect.status/Rejected` for a previously authorized session and after an extension restart. The underlying cause remains unverified; no raw error logging/storage or sync-fix claim |
| Midnight docs MCP query | NOT APPLICABLE | Not configured/callable; official docs fallback used without changing persistent config |
| Real-wallet E2E / hosted-origin proving | BLOCKED | Real Preprod connection and registration exist; synchronization, spendable DUST, current endpoint compatibility, actual local proof traffic and personal Cat Bluff approval remain pending |
| Fresh contract deployment | NOT APPLICABLE | Existing contract is Empty and verifier-compatible; only revisit if state changes |

Status vocabulary: VERIFIED means observed evidence; IMPLEMENTED BUT UNVERIFIED
means code exists without the necessary runtime proof; BLOCKED means incomplete
or awaiting its prerequisite; NOT APPLICABLE explains why a check is outside the
present evidence. The former 22-test baseline remains historical. Current totals
come from the final integrated logs linked above. Localhost screenshots show no
wallet connected and no transaction performed; they are not Level 2 proof evidence.
The hosted app's public read and asset delivery likewise establish no wallet
connection, approval, proof generation or circuit transaction.
The original merge-triggered deployment is preserved in historical evidence.
The latest verified production revision is **Ready** at `515af18`, including
the endpoint correction and bounded connection diagnostic. Its local checks,
independent review and actual hosted code/asset delivery are verified. The
completed exact-head CI run below verifies the same revision; wallet
synchronization and circuit execution remain separate unresolved checks.
[Exact-head CI](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36465711677)
passed three real circuits, 99 Node tests, 20 mocked UI tests, both typechecks,
lint and build. A real operator retry produced `connect.status/Rejected`;
the wallet-mediated circuit call and video remain blocked.

## Current Rise In state

- Level 1: **Approved** and **Completed**, correct `cat-bluff-midnight` repository.
- Level 2: **Awaiting submission**; September selected and active (Aug 31–Sep 30).
- No precise cutoff time/timezone was displayed; do not promise a countdown.
- GitHub integration area displayed “Not connected” with disabled connection
  controls; a repository URL input was available. No submission field was changed.
- Submitted, accepted, and completed are separate states. None applies to Level 2.

## Original audit checkpoint (subsequently approved)

The human reviewed and approved [LEVEL_2_PLAN.md](LEVEL_2_PLAN.md) and authorized
the agent to create local development commits. The original file-scoped audit
commands are retained below as historical audit evidence; that audit commit is
already local. **Do not rerun the branch-creation/commit block.** It is not the
current deployment procedure. The original PowerShell record was:

```powershell
git switch -c codex/level2-integration
$level2AuditFiles = @(
  'README.md',
  'docs/LEVEL_2_PLAN.md',
  'docs/PRIVACY_MODEL.md',
  'docs/DEPLOYMENT.md',
  'docs/LEVEL_2_SUBMISSION.md',
  'docs/evidence/level2-baseline-compile.log',
  'docs/evidence/level2-baseline-typecheck.log',
  'docs/evidence/level2-baseline-tests.log',
  'docs/evidence/level2-baseline-tests-sandbox.log',
  'docs/evidence/level2-contract-audit.json'
)
git add -- $level2AuditFiles
git diff --cached --stat
git diff --cached --check
git diff --cached
git commit -m "docs: audit Level 2 baseline and define private action integration"
```

At that historical checkpoint the instruction was to inspect unexpected changes
and avoid pushing. The later explicit publication authorization supersedes that
restriction; do not rerun this completed checkpoint.

## Current checkpoints

1. **Completed:** review local milestone diffs, typechecks, 81 Node tests, 15
   mocked UI tests, lint, production build and served assets. The integration
   branch's six Level 2 commits are merged into default `main` at `c462dabd`,
   preserving 17 meaningful non-merge commits overall. Its tree matches the
   reviewed and CI-verified `6ffb12d`; PR #1 and CI evidence are linked above.
2. In a private interactive terminal run `npm run demo:export`; enter and confirm
   a strong passphrase without recording it. Keep the exclusive output
   `.private/cat-bluff-demo.enc.json` on the operator machine, and import it into
   the browser only at runtime. Never share the passphrase, capability, opening,
   wallet seed or encrypted package in chat, screenshots, Git or hosting.
3. **Native readiness verified:** the existing loopback proof server returned
   `ok` after the user-approved Docker runtime repair. Before the wallet test,
   start Docker Desktop's Linux engine if stopped. Run `docker compose up -d`,
   `curl.exe --fail http://127.0.0.1:6300/health` and `docker compose ps` from the
   project root. The pinned 8.1.0 prover is loopback-only. Match the Lace wallet's
   actual Preprod/indexer/node/prover settings and verify a real proof request
   reaches the local server from the hosted origin. A configured URI or health
   response by itself is insufficient.
4. **Publication completed:** the human signed in and the agent published the
   reviewed static Vite build through Vercel CLI 50.13.2 on free Hobby hosting.
   The live URL, hosted public read and circuit/WASM integrity are verified.
   Project settings now select Node 22.x; the subsequent successful build log
   records Node v22.23.2 and npm 11.11.1. Lace account activation and Preprod
   connection are verified, and faucet receipt/DUST registration are confirmed.
   Finish wallet synchronization, verify spendable DUST and the current endpoint
   correction, then verify local-prover access from this HTTPS origin separately.
   No hosted proof service is supplied.
5. Record the first real commitment only after confirming the existing contract
   is still Empty. The human approves wallet requests. This consumes the sole
   available round at the original address. No extra deployment is planned.
6. Verify successful indexed transaction and expected Committed public state;
   preserve public evidence, update actual links, and commit/push the final
   reviewed files under the existing authorization. A pending ID is not confirmation.
7. After all required evidence is verified, the agent may submit the
   repository/live URL/video/address to Rise In under the user's authorization.
   Revisit the UI to verify submitted/pending state; do not call that accepted
   or completed. The proving-language conflict below remains unresolved.

## Focused organizer clarification (prepared, not sent)

“The Level 2 prompt book says proof generation happens locally in the browser.
Current Midnight guidance supports Lace with a native proof server on the user's
own machine. Does wallet-mediated, user-local native proving satisfy Level 2, or
is literal browser-WASM execution required? We will identify the actual proving
path and its private-data trust boundary in the README and demo.”

## Proposed recording script (under two minutes)

This is a script, not evidence of a recording or successful transaction.

- 0:00–0:15: Open the real live URL. Show Cat Bluff, Preprod and verified contract.
  Say this demonstrates one private commitment, not the full multiplayer game.
- 0:15–0:30: Connect Lace and show its actual shielded address. Import and unlock
  the operator package before recording or pause recording for the private step;
  never display the file, passphrase, recovery material or witness.
- 0:30–0:50: Select a public claim and click Commit. Show genuine proving and
  wallet approval stages. Approve personally when prompted.
- 0:50–1:25: Show the real wait for proving/indexing and the successful indexed
  result, Committed phase, public claim, commitment and transaction explorer.
  Keep a truthful pause or clearly label a cut/time compression if it is slow;
  do not call a pending ID confirmed.
- 1:25–1:45: Explain that the circuit proved authorized knowledge of a rank 1–13
  without displaying it. Claim can differ; fair dealing is not proved. Identify
  the verified local-prover trust assumption.
- 1:45–1:55: Disconnect. Show disconnected state and disabled action. Explain
  that this clears the dApp session, not Lace's stored permission.

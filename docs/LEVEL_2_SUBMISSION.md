# Level 2 submission evidence and checkpoints

Audit date: 2026-09-28. **Not submission ready.** The human approved the design
and authorized local development commits. Browser code, tests and hosting
configuration are implemented and locally verified; a live URL, real Lace/prover flow,
video and confirmed Level 2 transaction are still pending. Pushes, deployment,
submission and wallet approvals remain human-only actions.

## Official requirements and evidence

The [live Level 2 task](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/K7CxZD1QjK5zhzL8u)
was read in the signed-in browser. Its five pass requirements are distinct from
the submission package and this project's engineering safeguards.

| Item | Status | Concrete evidence / missing work |
| --- | --- | --- |
| Lace connect and disconnect | IMPLEMENTED BUT UNVERIFIED | Local connector 4.0.1 session and UI; real Lace connect, refusal and disconnect pending |
| Successful frontend Compact circuit call | IMPLEMENTED BUT UNVERIFIED | Browser `commit(claim)` integration targets existing contract; no live transaction or wallet approval yet |
| Observable proof without showing private input | IMPLEMENTED BUT UNVERIFIED | Local UI and contract tests; hosted browser, actual proving path and confirmed public result pending |
| Verifiable Preprod deployment | VERIFIED | [Original successful deployment](evidence/deployment.json); [fresh ledger/key check](evidence/level2-contract-audit.json) |
| At least eight meaningful commits | VERIFIED | 11 Level 1 commits; 14 total at integration commit `c4328df` (3 new). Final evidence commit adds one; remote remains Level 1 |
| Public repository with README | VERIFIED | [Public repository](https://github.com/AyushPaul26/cat-bluff-midnight), inspected on default `main`; publishing Level 2 files remains BLOCKED on human push/merge |
| Live frontend URL | BLOCKED | Not deployed |
| Demo video: connect and successful circuit call | BLOCKED | Not recorded |
| README privacy claim | VERIFIED | Local README describes exact statement, capability authorization, local-prover trust and unresolved real E2E; human must publish it |

The commit wording does not explicitly demand eight additional commits after
Level 1. Record total and new counts separately. This audit does not determine
how organizers will assess the quality of future development history.

## Book-specific items and safeguards

| Item | Status | Evidence / next check |
| --- | --- | --- |
| Read physical PDF pages 5–7 and live prompt guide | VERIFIED | Text extraction plus visual inspection; live Google Doc export agrees |
| Connected address, rejection/missing-wallet/network errors | IMPLEMENTED BUT UNVERIFIED | Local wallet tests; actual Lace behavior pending |
| Loading/result UI and absent private witness | IMPLEMENTED BUT UNVERIFIED | Local UI tests and privacy inspection with throwaway witnesses; live origin pending |
| Literal local **browser** proving (PDF p6) | BLOCKED | Native proof-server guidance differs; obtain clarification or prove supported browser execution |
| Video under two minutes | BLOCKED | Human recording after hosted transaction |
| Compiler / generated artifact baseline | VERIFIED | [Compile log](evidence/level2-baseline-compile.log); three circuits and matching key pairs |
| Baseline typecheck / contract tests | VERIFIED | [Typecheck](evidence/level2-baseline-typecheck.log), [22 passing tests](evidence/level2-baseline-tests.log) |
| Frontend build/lint | VERIFIED | [Build and both typechecks](evidence/level2-build.log), [ESLint](evidence/level2-lint.log) |
| Generated-contract and application tests | VERIFIED | [75 Node tests](evidence/level2-tests.log); actual generated bindings for contract behavior, mocks for wallet/transaction orchestration |
| Mocked UI/hook tests | VERIFIED | [15 tests](evidence/level2-ui-tests.log); these do not test a real wallet, prover or wallet outbound payloads |
| Local production browser and asset delivery | VERIFIED | [Desktop](evidence/level2-desktop.png), [mobile](evidence/level2-mobile.png), [nine circuit/three WASM checks](evidence/level2-assets.log); live Preprod state and verifier read succeeded |
| Clean build without Compact or private files | VERIFIED | [Isolated Windows install/build](evidence/level2-clean-build.log); tested npm 11.11.1 scripts-disabled install. Hosted Linux build remains unverified |
| Known-secret and credential-pattern audit | VERIFIED | [135 staged files and 189 history blobs checked](evidence/level2-secret-audit.log), including comparison with five local secret values without printing them |
| Current proof-server readiness | BLOCKED | Docker Linux daemon unavailable during audit; do not infer current health from old logs |
| Midnight docs MCP query | NOT APPLICABLE | Not configured/callable; official docs fallback used without changing persistent config |
| Real-wallet E2E / hosted-origin proving | BLOCKED | Requires hosted app, Lace, measured local proof traffic and human approvals |
| Fresh contract deployment | NOT APPLICABLE | Existing contract is Empty and verifier-compatible; only revisit if state changes |

Status vocabulary: VERIFIED means observed evidence; IMPLEMENTED BUT UNVERIFIED
means code exists without the necessary runtime proof; BLOCKED means incomplete
or awaiting its prerequisite; NOT APPLICABLE explains why a check is outside the
present evidence. The former 22-test baseline remains historical. Current totals
come from the final integrated logs linked above. Localhost screenshots show no
wallet connected and no transaction performed; they are not Level 2 proof evidence.

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

Stop if the branch already exists or status contains unexpected changes; inspect
before choosing it. Do not push. Recheck HEAD/status before the next milestone.

## Later manual checkpoints

1. Review local milestone diffs and final typecheck, tests, lint, build and asset
   responses. Record actual counts and commit hashes; the root task coordinates
   file-scoped local commits. Nothing is pushed yet.
2. In a private interactive terminal run `npm run demo:export`; enter and confirm
   a strong passphrase without recording it. Keep the exclusive output
   `.private/cat-bluff-demo.enc.json` on the operator machine, and import it into
   the browser only at runtime. Never share the passphrase, capability, opening,
   wallet seed or encrypted package in chat, screenshots, Git or hosting.
3. Start Docker Desktop's Linux engine if stopped. Run `docker compose up -d`,
   `curl.exe --fail http://127.0.0.1:6300/health` and `docker compose ps` from the
   project root. The pinned 8.1.0 prover is loopback-only. Match the Lace wallet's
   actual Preprod/indexer/node/prover settings and verify a real proof request
   reaches the local server from the hosted origin. A configured URI or health
   response by itself is insufficient.
4. The human authenticates and publishes the reviewed static Vite build to
   Vercel using [`vercel.json`](../vercel.json). Set Node 22.x and inspect build
   logs for an actual Node release compatible with the project's >=22.22.0 range.
   Provide the real URL and verify assets, WASM, wallet connection and local
   network access from that HTTPS origin.
   To publish the local branch for review, run `git push -u origin codex/level2-integration`
   yourself, then review/merge it into `main` on GitHub. Import that repository into
   Vercel, choose the Vite preset and root directory `.`, keep the checked-in build
   settings, and publish personally. No billable service is required by this setup.
5. Record the first real commitment only after confirming the existing contract
   is still Empty. The human approves wallet requests. This consumes the sole
   available round at the original address. No extra deployment is planned.
6. Verify successful indexed transaction and expected Committed public state;
   preserve public evidence, update actual links, then manually commit/push the
   final reviewed files. A pending ID is not confirmation.
7. Human submits the repository/live URL/video/address to Rise In. Revisit the
   UI to verify submitted/pending state; do not call that accepted or completed.

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

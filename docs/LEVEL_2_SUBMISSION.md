# Level 2 submission evidence and checkpoints

Audit date: 2026-09-28. **Not submission ready.** The human has now approved the
design and authorized local development commits. Implementation is starting;
pushes, deployment, submission and wallet approvals remain human-only actions.

## Official requirements and evidence

The [live Level 2 task](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/K7CxZD1QjK5zhzL8u)
was read in the signed-in browser. Its five pass requirements are distinct from
the submission package and this project's engineering safeguards.

| Item | Status | Concrete evidence / missing work |
| --- | --- | --- |
| Lace connect and disconnect | BLOCKED | Browser integration not implemented; real wallet test pending |
| Successful frontend Compact circuit call | BLOCKED | No frontend transaction; intended circuit is existing `commit(claim)` |
| Observable proof without showing private input | BLOCKED | Contract constraints verified; browser privacy and live proof still pending |
| Verifiable Preprod deployment | VERIFIED | [Original successful deployment](evidence/deployment.json); [fresh ledger/key check](evidence/level2-contract-audit.json) |
| At least eight meaningful commits | VERIFIED | 11 existing commits on GitHub `main` and local baseline; new Level 2 count 0 |
| Public repository with README | VERIFIED | [Public repository](https://github.com/AyushPaul26/cat-bluff-midnight), inspected on default `main` |
| Live frontend URL | BLOCKED | Not deployed |
| Demo video: connect and successful circuit call | BLOCKED | Not recorded |
| README privacy claim | VERIFIED | Contract-only claim documented; browser-specific verification remains pending |

The commit wording does not explicitly demand eight additional commits after
Level 1. Record total and new counts separately. This audit does not determine
how organizers will assess the quality of future development history.

## Book-specific items and safeguards

| Item | Status | Evidence / next check |
| --- | --- | --- |
| Read physical PDF pages 5–7 and live prompt guide | VERIFIED | Text extraction plus visual inspection; live Google Doc export agrees |
| Connected address, rejection/missing-wallet/network errors | BLOCKED | Implement and test, then verify with Lace |
| Loading/result UI and absent private witness | BLOCKED | Implement, inspect DOM/log/public traffic with throwaway witnesses |
| Literal local **browser** proving (PDF p6) | BLOCKED | Native proof-server guidance differs; obtain clarification or prove supported browser execution |
| Video under two minutes | BLOCKED | Human recording after hosted transaction |
| Compiler / generated artifact baseline | VERIFIED | [Compile log](evidence/level2-baseline-compile.log); three circuits and matching key pairs |
| Baseline typecheck / contract tests | VERIFIED | [Typecheck](evidence/level2-baseline-typecheck.log), [22 passing tests](evidence/level2-baseline-tests.log) |
| Existing frontend build/lint | NOT APPLICABLE | No frontend/build/lint scripts in Level 1; add for Level 2 |
| Current proof-server readiness | BLOCKED | Docker Linux daemon unavailable during audit; do not infer current health from old logs |
| Midnight docs MCP query | NOT APPLICABLE | Not configured/callable; official docs fallback used without changing persistent config |
| Real-wallet E2E / hosted-origin proving | BLOCKED | Requires implementation, hosted app, Lace and human approvals |
| Fresh contract deployment | NOT APPLICABLE | Existing contract is Empty and verifier-compatible; only revisit if state changes |

Status vocabulary: VERIFIED means observed evidence; IMPLEMENTED BUT UNVERIFIED
means code exists without the necessary runtime proof; BLOCKED means incomplete
or awaiting its prerequisite; NOT APPLICABLE explains why a check is outside the
present baseline. No browser integration is currently claimed implemented.

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
commands are retained below for reproducibility; there is no outstanding manual
commit gate. In PowerShell from this repo:

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

1. Review milestone diffs and tests; stage only their listed files and commit.
2. Privately export/import the scoped demo package and unlock Lace. Never share
   the passphrase, capability, opening or seed in chat, screenshots or Git.
3. Start Docker Desktop's Linux engine if stopped, then verify the pinned local
   prover. Installation/config changes requiring permissions remain user actions.
4. Publish the reviewed frontend to Vercel after its build passes. Provide its
   actual URL; test configuration, assets and wallet/prover behavior from that origin.
5. Record the first real commitment from the hosted origin. The human approves
   wallet requests. This consumes the sole available round at the existing address.
6. Verify successful indexed transaction plus expected public state; preserve
   public evidence, update actual links, manually commit/push the final files.
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
- 0:15–0:30: Connect Lace and show its actual shielded address. Privately import
  the operator package off-camera; never record recovery material/passphrase.
- 0:30–0:50: Select a public claim and click Commit. Show genuine proving and
  wallet approval stages. Approve personally when prompted.
- 0:50–1:25: Show successful indexed result, Committed phase, public claim,
  commitment and real transaction reference/explorer. Do not call a pending ID
  confirmed. If proving is slow, clearly disclose a cut/time compression.
- 1:25–1:45: Explain that the circuit proved authorized knowledge of a rank 1–13
  without displaying it. Claim can differ; fair dealing is not proved. Identify
  the verified local-prover trust assumption.
- 1:45–1:55: Disconnect. Show disconnected state and disabled action. Explain
  that this clears the dApp session, not Lace's stored permission.

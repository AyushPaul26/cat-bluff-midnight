# Cat Bluff implementation plan

Execute in this session using the executing-plans workflow. The user authorized routine design and implementation choices without additional approvals.

Goal: compile, test, deploy, publish, and submit the actual Cat Bluff contract for the active Level 1 period.

Spec: [DESIGN.md](DESIGN.md). Acceptance: [LEVEL1-CHECKLIST.md](LEVEL1-CHECKLIST.md).

## Constraints

Only this dedicated project repository may change. Use `codex/` for development. Final files must be on the remote default branch. No mainnet, payments, invented artifacts, or secret logging. Stop at user-only setup, CAPTCHA, restart, or account barriers.

## Tasks

1. [x] Inspect authenticated requirements, guide, public program, GitHub account, and official version matrix; document initial idea and protocol model.
2. [x] Resolve Linux and Docker prerequisites. Install project-compatible Node 22, official Compact CLI 0.5.1 and compiler 0.31.1. Verify both versions separately. Read official SDK and compiler usage before choosing exact transitive dependencies. Commit verified tooling and setup.
3. [x] Write tests against expected real compiled contract exports for Empty defaults, authorized commit with a mismatching claim, rank bounds, and unchanged ledger after failures. Implement `contracts/cat-bluff.compact` and `src/witnesses.ts`, then compile to `managed/`. Verify the tests genuinely exercise generated code. Commit working commitment foundation.
4. [x] Add challenge and resolution tests for each authorized transition; incorrect rank/salt/role secret; resolve-before-challenge; second commit/challenge/resolve; distinct context binding; secrets absent from public ledger and public outputs. Complete the circuits and witness integration. Commit verified transitions and adversarial tests.
5. [x] Implement dedicated test wallet/private-state integration and deployment scripts using pinned Midnight.js, static ZK artifacts, indexer provider, local proof provider, and wallet provider. Reject unexpected network and protect state files. Add exact proof-server image to compose. Verify local proof generation. Commit deployment integration.
6. [x] Fund only through free test faucet; deploy Cat Bluff to Preprod and wait for actual confirmation. Independently verify address/transaction through indexer. Save public metadata and real screenshots plus compiler/test logs. Commit genuine evidence.
7. [x] Complete README setup/privacy/limitations/roadmap, LICENSE and third-party notices; run compile, typecheck, tests, artifact presence and secret checks. Commit final documentation and audit.
8. [x] Create public `AyushPaul26/cat-bluff-midnight` only after rechecking existence. Push final history to default branch, inspect public links and five meaningful commits. Submit via active September UI and verify exact resulting state.

## Review focus

- Failure must not mutate public phase or replace an existing commitment.
- Public return values and ledger fields must not leak witnesses through reversible representations.
- Reusing a capability across contexts must fail authorization.
- Inputs 0 and 14 must fail rank constraints; claims unequal to actual ranks must succeed.
- Missing private files, wrong network, proof-server failure, and unconfirmed transactions must never produce deployment-success evidence.

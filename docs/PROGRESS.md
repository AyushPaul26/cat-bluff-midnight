# Execution ledger: docs/IMPLEMENTATION-PLAN.md

Task 1 complete: requirements and design, commit e2031ab.

Task 2 in progress: Ubuntu first-launch completed by user; Docker Linux engine 29.8.0 running; proof-server 8.1.0 HTTP /health returned 200. Project-local Node 22.22.0 and npm 10.9.4 execute. Official Compact CLI 0.5.1 installed and compiler 0.31.1 downloaded.

Ruling: use the user's dedicated standalone repository on codex/level1 in place; no second worktree needed for an otherwise empty, isolated project.

Ruling: tools remain in ignored .tools; no changes to global Node or unrelated projects. WSL extraction cannot preserve timestamps on this Windows mount. Use non-preserving extraction; compiler ZIP was extracted with Windows Expand-Archive after a missing unzip dependency blocked CLI extraction.

Ruling: official compiler 0.31.1 shell launcher does not quote dirname and fails in the user's space-containing path. Correct only that shell quote in the ignored local launcher; compiler and ZK binaries are unchanged. Record this fix in reproducible setup.

Pre-flight: tests, witnesses and deployment all consume the same generated managed/cat-bluff/contract/index.js; no handwritten replacement. Deployment cannot start until real compilation and behavioral tests pass.

Task 2 complete: official CLI/compiler, Node 22, Docker and proof server verified. Commit 287396b; reproducible extraction improvements are in progress.

Task 3 complete: generated commitment contract and eight passing behavioral checks; commit 0ed592a.

Task 4 complete: three real circuits and keys, sixteen passing behavioral checks including challenge, resolution, wrong openings and replay; commit 91ea183. Tests now use the shared application witness implementation.

Task 5 in progress: pinned SDK providers, dedicated private seed storage, encrypted state provider, strict Preprod guard and confirmed-deployment/indexer verification implemented; runtime verification pending.

Ruling: npm executable links fail chmod on this Windows mount. Use `npm ci --ignore-scripts` and invoke the bundled native prebuild checks explicitly through Node; preserve exact dependencies in package-lock.json.

Ruling: use FluentWalletBuilder.withSeed with a cryptographically generated local seed. Avoid tutorial helpers that log wallet seeds or supply dummy CAPTCHA headers. Faucet funding uses the genuine browser UI.

Task 5 update: complete provider typecheck, 17 tests and native classic-level prebuild check passed. Dedicated wallet created successfully; public address saved. Commit b47acf3 contains deployment integration. Network deployment is still pending initial wallet sync.

Ruling: use project-local official Windows Node 22.22.0 for SDK operations after measuring multi-minute WSL/DrvFS imports. Both platforms use the same repository and secrets. WSL remains the compiler environment. The Windows Node archive SHA-256 matched official SHASUMS256.txt, wallet derivation matched Ubuntu, and all 17 Windows tests passed.

Setup verification: extraction into ignored scratch succeeded. Node 22.22.0, npm 10.9.4, and compiler 0.31.1 execute from the fresh extracted copy. The first smoke command had a shell-expanded PATH error; sourcing env.sh in the shell corrected that verification command.

GitHub repository created publicly under verified AyushPaul26 through existing Git Credential Manager authentication after the browser create button did not submit. Faucet UI successfully submitted a free 5000 tNight request. Neither event establishes contract deployment or Rise In submission.

Whole-branch fresh review of d0f9a69 found one important issue: the demo initializer used a predictable fixed rank. Added a failing privacy regression test, then changed new configurations to cryptographically random ranks and salts. Typecheck and the full 18-test suite pass. The current deployed-in-progress configuration will be refreshed through the encrypted private-state provider only after the indexed contract is verified Empty, before its first commitment. src/refresh-private-card.ts implements that guarded repair; runtime repair still pending deployment.

Recovery update: the in-flight attempt was stopped before any transaction to improve supported SDK batching. The local private card was refreshed before restarting, so no post-deployment repair is needed. Direct official SDK construction derives the same funded wallet address. New private checkpoint save/restore validates account/network, and lifecycle cleanup still attempts wallet shutdown after checkpoint failure. Typecheck and all 22 tests pass. Full dust history replay remains required; no events are skipped.

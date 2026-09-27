# Cat Bluff

Cat Bluff is a multiplayer bluffing card game concept: players make public claims while their actual cards remain hidden. Midnight's programmable privacy lets a player commit to a hidden rank, prove authorized transitions, and selectively reveal the rank after a challenge. This Level 1 prototype implements that foundation for one round. A complete multiplayer game and frontend are planned for Level 2.

**Status:** The custom contract compiles and all 17 tests pass. Deployment integration is in progress. There is no confirmed deployment address or Rise In submission yet. See [verification checklist](docs/LEVEL1-CHECKLIST.md) and [current status](docs/STATUS.md).

## Contract behavior

| Phase | Authorized action | Result |
| --- | --- | --- |
| Empty | Player calls `commit(claim)` | Checks hidden rank and public claim are 1–13; publishes salted commitment and claim |
| Committed | Challenger calls `challenge()` | Opens the resolution phase |
| Challenged | Player calls `resolve()` | Verifies the original opening, publishes rank and whether the claim was truthful |
| Resolved | No further actions | Terminal state rejects replay |

The claimed rank can differ from the hidden rank. Authorization proves knowledge of a role secret bound to the game context; it does not assert a wallet identity. Deployment creates distinct player and challenger role commitments. The local CLI is a trusted setup/demo operator holding both secrets. A future multiplayer client must distribute those capabilities securely to separate participants.

## Privacy

Public ledger fields are `gameContext`, `round`, `phase`, `player`, `challenger`, `commitment`, `claimedRank`, `revealedRank`, and `truthful`. `revealedRank` is zero until resolution; `truthful` only has meaning once resolved.

Private witnesses are the acting role's `secret`, the actual `rank`, and its fresh 32-byte `salt`. The application stores these locally under ignored `.private/`. Never publish that directory. The encrypted private-state database password and dedicated test wallet seed also remain there. Anyone with access to the local secrets can act as either role; this prototype does not provide encrypted wallet recovery storage.

`persistentCommit` uses domain separation (`cat-bluff:card:v1` versus `cat-bluff:role:v1`). Card commitments bind the context, round, player commitment, rank, and fresh high-entropy salt. A rank has only 13 possible values, so the unpredictable salt is essential. Role commitments bind context and role number to an independent secret. The single fixed round and terminal phase reject repeated actions.

`disclose()` is deliberate: constructor context/role commitments are public; commitment and claimed rank become public during commit; verified actual rank and truth result become public during resolution. The salt and role secrets are never disclosed. The [contract's opening comment](contracts/cat-bluff.compact) and [design](docs/DESIGN.md) document this boundary.

## Toolchain and setup

Use Linux x86-64 or Ubuntu on WSL2, Python 3, curl, and Docker with a running Linux engine. On Windows, complete Ubuntu's first-launch username/password prompt yourself. Run project commands from this repository root inside Ubuntu. Windows' system `compact.exe` is unrelated to Midnight.

| Component | Pinned version |
| --- | --- |
| Node.js | 22.22.0 |
| Compact CLI | 0.5.1 |
| Compact compiler | 0.31.1 |
| Compact runtime | 0.16.0 |
| Midnight.js | 4.1.1 |
| Proof server | 8.1.0 |
| Wallet SDK umbrella | 1.2.0 |
| TypeScript | 5.9.3 |

Versions were selected from the official [support matrix](https://docs.midnight.network/relnotes/support-matrix) for Preprod. The CLI version is different from the compiler version. Exact transitive JavaScript versions are captured in `package-lock.json`.

```bash
bash scripts/bootstrap-tools.sh
source scripts/env.sh
bash scripts/install-dependencies.sh
npm run compile
npm run typecheck
npm test
```

Tools install into ignored `.tools/`, without changing global Node. The setup extractor avoids unsupported chmod/timestamp changes on Windows-mounted paths, and quotes the compiler launcher's path to support usernames containing spaces. Compiler binaries and generated artifacts are unchanged. Dependency installation avoids npm executable-link failures and explicitly validates bundled native modules.

Compilation builds in a fresh temporary directory then copies real compiler output to `managed/cat-bluff/`. All three circuits (`commit`, `challenge`, `resolve`), `.prover` keys, `.verifier` keys and generated contract JavaScript are included. Never hand-edit generated output.

## Verification evidence

Behavioral tests run the real generated contract and shared application witnesses. They cover initial state, valid bluff and truthful claims, wrong capabilities/openings, rank bounds, phase violations/replay, context/round binding, and the public/private boundary. These tests validate contract execution; they do not establish network deployment or complete zero-knowledge privacy on their own.

- [Genuine compilation log](docs/evidence/compile.log)
- [Genuine behavioral test log](docs/evidence/tests.log)
- [Compilation and test screenshot](docs/evidence/compile-tests.png)

![Real compiler and test output](docs/evidence/compile-tests.png)

## Proof server and deployment

```bash
npm run proof:up
curl --fail http://127.0.0.1:6300/health
npm run wallet:address
# Request free tokens for the printed public address in the faucet UI.
npm run deploy
```

The proof server is bound to localhost. Use only the official free [Preprod faucet](https://midnight-tmnight-preprod.nethermind.dev/). CAPTCHA or login must be completed by the user. Never fund this prototype with mainnet assets or purchased tokens.

`wallet:address` creates or reuses one dedicated local wallet and prints only its public address. `deploy` checks proof-server health, synchronizes the wallet, registers test NIGHT for dust if necessary, submits the custom constructor, waits for confirmation, and checks the indexed ledger and all three on-chain verifier keys. Only after those checks does it write `docs/evidence/deployment.json`. A saved deployment receipt prevents accidental duplicate deployment.

Windows-mounted WSL directories can make SDK imports unusually slow. The same pinned Node release can run the wallet/deployment CLI directly in PowerShell:

```powershell
powershell -File scripts/setup-windows-node.ps1
& ./.tools/node-v22.22.0-win-x64/node.exe --experimental-strip-types src/wallet-address.ts
& ./.tools/node-v22.22.0-win-x64/node.exe --experimental-strip-types src/deploy.ts
```

Keep compilation in Ubuntu. The native wallet CLI uses the same project files, private state and pinned dependencies. The [faucet request](docs/evidence/faucet.json) succeeded for this dedicated wallet, but funding is not deployment. No confirmed contract address is available yet.

## Limitations and Level 2

This prototype does not prove fair dealing, card uniqueness, unique players, wallet ownership, shuffle randomness, or honesty of the trusted setup. A player can withhold resolution. There are no timeouts, scoring, stakes, payouts, multiple simultaneous rounds, or multiplayer networking.

Level 2 will add a game interface, wallet connection, separate participant private stores, secure role provisioning, transaction progress, challenge/reveal views, and a documented timeout protocol before extending to a full game.

## Submission and license

The active Rise In period inspected on September 27, 2026 is September (Aug 31–Sep 30). The program end date is September 30; no precise cutoff timezone was shown. Submission is pending completion of every official checklist item.

Apache-2.0. See [LICENSE](LICENSE) and [third-party notices](THIRD-PARTY-NOTICES.md).

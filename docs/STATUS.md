# Current status — 2026-09-27

The custom Cat Bluff contract compiles into `commit`, `challenge`, and `resolve` circuits with real proving/verification keys. Typechecking and all 22 tests pass, including 16 generated-contract behavioral tests and wallet/configuration/privacy recovery checks.

Ubuntu/WSL2 and Docker's Linux engine are working. The official proof server 8.1.0 health endpoint returned HTTP 200. Compact CLI 0.5.1 and compiler 0.31.1 were verified separately. Pinned Windows Node 22.22.0 runs SDK commands to avoid slow WSL imports from Windows-mounted paths; compilation remains in WSL.

The public repository is [AyushPaul26/cat-bluff-midnight](https://github.com/AyushPaul26/cat-bluff-midnight), with default branch `main` and eight meaningful published commits. An earlier revision passed [Linux CI](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36329636667); its exact commit is recorded in `docs/evidence/ci.json`. This does not establish CI success for later revisions.

The free Preprod faucet reported a successful 5000 tNight request for the dedicated wallet; public evidence is in `docs/evidence/faucet.json`. Initial dust synchronization is still running against approximately 1.57 million events. No deployment transaction has been submitted or confirmed, no contract address is claimed, and no Rise In submission has been made.

Wallet seed, role secrets, salt, storage password, private-state database, and wallet checkpoints live only in ignored `.private/`. The original predictable demo rank was replaced with cryptographic randomness and the local private card was refreshed before any deployment transaction.

# Current status — 2026-09-27

Ubuntu/WSL2 first launch is complete. Docker's Linux engine runs, and the local official proof-server 8.1.0 health endpoint returned HTTP 200. Compact CLI 0.5.1 and compiler 0.31.1 are separate, verified tools.

The Cat Bluff contract has compiled successfully with generated `commit`, `challenge`, and `resolve` circuits and real proving/verification keys. Sixteen behavioral tests passed against the generated contract. The provider integration's first typecheck passed; final wallet/deployment checks are underway.

Deployment is not confirmed. No address is claimed. No repository has been published and no Rise In submission has been made.

Secrets will live only in ignored `.private/`. The dedicated wallet address may be recorded publicly for faucet funding. Do not share the seed, role secrets, salt, storage password, or private-state database.

The public repository was created as https://github.com/AyushPaul26/cat-bluff-midnight (default branch main). Content publication is in progress. The dedicated Preprod wallet was generated without seed logging; the faucet UI reported a 5000 tNight request with transaction identifier recorded in docs/evidence/faucet.json. Contract deployment remains unconfirmed while wallet synchronization is investigated.

Windows Node 22.22.0 now runs the SDK directly to avoid WSL/DrvFS import delays. The same 17 tests pass on Windows. The corrected setup extractor was tested with copied official archives: Node 22.22.0, npm 10.9.4, and Compact compiler 0.31.1 all execute.

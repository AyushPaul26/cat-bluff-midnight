# Current status — 2026-09-27

Cat Bluff is confirmed deployed on Midnight Preprod at `63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16`, block 2,734,912. The indexed initial ledger and all three verifier keys match this repository's generated artifacts. The explorer separately shows the successful transaction and deployed contract.

The contract compiles into `commit`, `challenge`, and `resolve` circuits with real proving/verification keys. Typechecking and all 22 tests pass, including 16 generated-contract behavioral tests. Ubuntu/WSL2, pinned Node 22.22.0, Compact CLI 0.5.1, compiler 0.31.1, Docker, and proof server 8.1.0 were exercised. Real proof-server requests were used for deployment.

The public repository is [AyushPaul26/cat-bluff-midnight](https://github.com/AyushPaul26/cat-bluff-midnight), default branch `main`. It has at least nine meaningful commits. Linux CI passed for the exact revision recorded in `docs/evidence/ci.json`; final deployment integration changes are being audited and published.

Rise In remains awaiting submission while the final audit is completed. Submitted, accepted, and level-unlocked are separate states; none is claimed yet.

Private recovery material remains only in ignored `.private/`. See [deployment notes](DEPLOYMENT.md) for the genuine failed attempt, safe reservation recovery, and confirmed result.

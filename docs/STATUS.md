# Current status — 2026-09-27

**Submitted for review:** Rise In September Challenge, Level 1 — New Moon. After the user selected a five-star rating, the final Complete action succeeded. Reloading the page preserved **Pending Review**, the saved `cat-bluff-midnight` repository link, and the disabled **Under review** button. No validation error was displayed. Acceptance/pass and Level 1 completion/unlock have not been verified.

The page also retains an inconsistent generic **Awaiting submission** badge. Its explicit review banner and message say the submission is under review; this discrepancy is preserved in the genuine screenshot rather than hidden.

Cat Bluff is confirmed deployed on Midnight Preprod at `63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16`, block 2,734,912. The indexed initial ledger and all three verifier keys match this repository's generated artifacts. The explorer independently shows the successful transaction and deployed contract.

The contract compiles into `commit`, `challenge`, and `resolve` circuits with real proving/verification keys. Typechecking and all 22 tests pass, including 16 generated-contract behavioral tests. Ubuntu/WSL2, pinned Node 22.22.0, Compact CLI 0.5.1, compiler 0.31.1, Docker, and proof server 8.1.0 were exercised. Real proof-server requests were used for deployment.

The public repository is [AyushPaul26/cat-bluff-midnight](https://github.com/AyushPaul26/cat-bluff-midnight), default branch `main`. It had ten meaningful commits before submission; final evidence adds further documentation history. Linux CI run [36334443863](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36334443863) passed every step for implementation `1640a0f2ccbe4f8f2f71b5afaa6654de2b0c088b`. Later commits only record evidence and status.

[Submission screenshot](evidence/rise-submission.png) · [Review banner](evidence/rise-review-banner.png) · [Final audit](FINAL-AUDIT.md)

No user action remains for submission. Review is pending with Rise In. Private recovery material remains only in ignored `.private/`. See [deployment notes](DEPLOYMENT.md) for the genuine failed attempt, reservation recovery, and confirmed result.

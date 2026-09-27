# Rise In Level 1 verification checklist

Inspected while authenticated on 2026-09-27. This document records requirements, not a claim that they are satisfied.

## Sources and submission period

- [Level 1 task](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/MS2S3hmDXqerSvdcW)
- [Program](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/)
- [Linked Level 1 guide, midnight_prompts](https://docs.google.com/document/d/17DWYHc7q_e_qFfe0JeszqIMpSAf2S0cMwbPVOpPs4BU/edit)

The task labels **September Challenge Active**, selected. Initial page rendering displayed **Aug 31 - Sep 30**; the fully loaded authenticated UI displayed **Sep 1 - Oct 1**. These date-only displays do not establish an exact cutoff instant. July and August are catch-up options. The public program gives **September 30, 2026** as its end and registration closing date. No cutoff time or timezone was shown; an exact deadline instant is not verified.

Before submission, the fully loaded authenticated task showed **Awaiting submission**, GitHub **Connected**, repository **cat-bluff-midnight**, and the matching public URL. Initial rendering briefly showed Not connected with disabled controls before account data loaded. No task-specific expandable requirement sections appeared in the accessibility tree. The full task text and the linked guide's Level 1 section were read.

## Official task: requirements to pass

- [x] Toolchain installed; custom contract compiles through `compact compile`.
- [x] Passing test suite.
- [x] Generated `managed/` directory containing circuits and keys.
- [x] Contract deployed to Preview or Preprod with a visible address: `docs/evidence/deployment.json` and the linked Preprod explorer.
- [x] Initial product idea: short paragraph in README.
- [x] At least five meaningful commits.

## Official task: submission checklist

- [x] Public GitHub repository with README.
- [x] Local setup instructions.
- [x] Genuine screenshot of successful compilation with circuits listed.
- [x] Genuine screenshot of deployment with address visible: `docs/evidence/explorer-contract.png` and `deployment.png`.
- [x] README explanation of public state versus private witness.
- [x] Initial product idea in README.
- [x] At least five meaningful commits.

The learning objectives explicitly cover Node 22, Docker, a Compact compiler, proof server, public ledger state, a private witness, and deliberate `disclose()`.

## Linked guide: additional detail

- [x] Public ledger field, private witness, deliberate disclosure, and privacy comment at top of contract.
- [x] At least three tests covering logic, transitions, and private-input exposure.
- [x] Deploy the custom contract, not merely the tutorial hello-world: indexed initial state and all three verifier keys compared successfully.
- [x] README includes actual address, behavior, privacy model, tech stack, prerequisites, setup, tests, initial idea, and screenshots.

The guide is an AI tutorial prompt, not a requirement to use a counter as the product. It suggests Claude/Cursor MCP configuration, a hello-world scaffold, unpinned installation commands, a counter filename, and manual commits/screenshots/idea entry. Those are workflow suggestions; the live pass checklist does not require those particular tools, filenames, or manual authorship. The user explicitly authorizes automation and requires a Cat Bluff contract, pinned official compatible versions, genuine screenshots, and no address placeholders. Follow those instructions. Read official tooling docs rather than executing tutorial install commands unquestioningly.

## Additional user acceptance criteria

- [x] Dedicated repository and directory; no unrelated project changes.
- [x] Real generated contract used in behavioral tests, including wrong openings, unauthorized actions, replay, and phase errors.
- [x] High-entropy salt, domain separation, context binding, independent claimed and actual ranks.
- [x] Local proof server verified; confirmed custom deployment independently checked through the indexer and explorer.
- [x] Secrets excluded and staged content audited: 80 staged files, 125 historical blobs, and five actual local secrets checked without printing secrets.
- [x] Final default branch and public evidence links verified: public main at 1640a0f, 10 meaningful commits, generated artifacts present, both README evidence images loaded successfully.
- [x] Correct September period submitted only after every prerequisite was satisfied.
- [x] Pending Review and Under review read back after reload with the correct repository and no validation error. A generic Awaiting submission badge remains inconsistent; acceptance/pass and unlock are not claimed.

## Evidence status

Compilation: docs/evidence/compile.log and compile-tests.png. Tests: 22 passed, docs/evidence/tests.log. Typecheck: successful. Real generated artifacts: managed/cat-bluff/. At least ten meaningful commits exist. Official tool extraction, dedicated wallet derivation, proof-server operation, free faucet funding, and dust registration were verified. CI metadata records its exact tested revision. Custom deployment is confirmed at block 2,734,912, address `63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16`. See docs/DEPLOYMENT.md and docs/evidence/deployment.json. Final publication audit and Linux CI passed for implementation 1640a0f. The five-star selection and final Complete action succeeded. Rise In September submission is Pending Review, verified after reload; see docs/evidence/rise-submission.png and docs/STATUS.md.

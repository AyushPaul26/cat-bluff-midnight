# Rise In Level 1 verification checklist

Inspected while authenticated on 2026-09-27. This document records requirements, not a claim that they are satisfied.

## Sources and submission period

- [Level 1 task](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/MS2S3hmDXqerSvdcW)
- [Program](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/)
- [Linked Level 1 guide, midnight_prompts](https://docs.google.com/document/d/17DWYHc7q_e_qFfe0JeszqIMpSAf2S0cMwbPVOpPs4BU/edit)

The task labels **September Challenge Active**, selected, with **Aug 31 - Sep 30** displayed. July and August are catch-up options. The public program gives **September 30, 2026** as its end and registration closing date. No cutoff time or timezone was shown; an exact deadline instant is not verified.

The authenticated task shows **Awaiting submission**. It offers a repository selector and a **Paste a GitHub repository URL** field. GitHub was marked **Not connected**, with Connect GitHub and Check status disabled at inspection. The URL fallback is visible but has not been used or verified by saving. No task-specific expandable requirement sections appeared in the accessibility tree. The full task text and the linked guide's Level 1 section were read.

## Official task: requirements to pass

- [x] Toolchain installed; custom contract compiles through `compact compile`.
- [x] Passing test suite.
- [x] Generated `managed/` directory containing circuits and keys.
- [ ] Contract deployed to Preview or Preprod with a visible address.
- [x] Initial product idea: short paragraph in README.
- [x] At least five meaningful commits.

## Official task: submission checklist

- [ ] Public GitHub repository with README.
- [ ] Local setup instructions.
- [x] Genuine screenshot of successful compilation with circuits listed.
- [ ] Genuine screenshot of deployment with address visible.
- [x] README explanation of public state versus private witness.
- [x] Initial product idea in README.
- [x] At least five meaningful commits.

The learning objectives explicitly cover Node 22, Docker, a Compact compiler, proof server, public ledger state, a private witness, and deliberate `disclose()`.

## Linked guide: additional detail

- [x] Public ledger field, private witness, deliberate disclosure, and privacy comment at top of contract.
- [x] At least three tests covering logic, transitions, and private-input exposure.
- [ ] Deploy the custom contract, not merely the tutorial hello-world.
- [ ] README includes actual address, behavior, privacy model, tech stack, prerequisites, setup, tests, initial idea, and screenshots.

The guide is an AI tutorial prompt, not a requirement to use a counter as the product. It suggests Claude/Cursor MCP configuration, a hello-world scaffold, unpinned installation commands, a counter filename, and manual commits/screenshots/idea entry. Those are workflow suggestions; the live pass checklist does not require those particular tools, filenames, or manual authorship. The user explicitly authorizes automation and requires a Cat Bluff contract, pinned official compatible versions, genuine screenshots, and no address placeholders. Follow those instructions. Read official tooling docs rather than executing tutorial install commands unquestioningly.

## Additional user acceptance criteria

- [x] Dedicated repository and directory; no unrelated project changes.
- [x] Real generated contract used in behavioral tests, including wrong openings, unauthorized actions, replay, and phase errors.
- [x] High-entropy salt, domain separation, context binding, independent claimed and actual ranks.
- [ ] Local proof server verified; confirmed custom deployment independently checked.
- [ ] Secrets excluded and staged content audited.
- [ ] Final default branch and public evidence links verified.
- [ ] Correct period submitted only after every prerequisite is satisfied.
- [ ] Submitted/pending-review state read back without validation errors; acceptance and level unlock reported separately.

## Evidence status

Compilation: docs/evidence/compile.log and compile-tests.png. Tests: 18 passed, docs/evidence/tests.log. Typecheck: successful, docs/evidence/typecheck.log. Real generated artifacts: managed/cat-bluff/. Five meaningful local commits are present. Deployment, public repository, and submission remain unverified. Setup extraction and wallet runtime checks are in progress.

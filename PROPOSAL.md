# Product Proposal

## Chosen Level 3 problem

**Private Allowlist Access**, from the [Rise In Level 3 idea list](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/submission/msnM8wbPBJwwuX9wG). This proposal is awaiting organizer approval. It does not claim that the current Cat Bluff contract already implements a general allowlist.

## What is the product, and who uses it?

**Cat Bluff Private Tables** would let a club organizer admit approved players to a private game room without publishing their real names or the credential they received. Players would prove that they hold a table-specific access capability before making a game action. The first users would be small online clubs that want an invite-only table and a public record that each accepted action was authorized.

The current one-round Cat Bluff dApp is a narrow technical foundation: its Compact contract checks knowledge of a fixed player or challenger secret and records a public state transition. It does **not** yet issue invitations, prove membership in a changing list, support multiple players or rounds, or hide that a particular wallet submitted a transaction. Those are proposed product changes, not existing features.

## Why Midnight specifically?

A transparent chain can check a public wallet allowlist, but doing so publishes the eligible wallet identities and links their actions. Midnight can check a private witness against a public table policy while recording only the authorized action and the minimum public state required by the game. The intended privacy claim is **membership without revealing the access credential or which allowlist entry matched**. Network and wallet metadata may still reveal participation and must be explained to players.

The existing prototype demonstrates the smaller primitive: knowledge of a role capability can authorize a `commit` transition without disclosing the capability or hidden card rank. The card commitment and public claim remain visible. A full allowlist proof would need a new contract and fresh Preprod deployment; no such proof is claimed here.

## Data Model

| Data point | Type | Disclosed to |
| --- | --- | --- |
| Table identifier, current allowlist root and policy version | Public ledger | Everyone |
| Accepted action, table phase and anti-replay nullifier | Public ledger | Everyone |
| Invite/access secret and allowlist membership path | Private witness | Player and their local proving environment |
| Hidden card rank and random commitment salt | Private witness | Player and their local proving environment |
| Public claim and salted card commitment | Public ledger | Everyone |
| Invitation issuance record and recovery information | Off-chain private data | Organizer and intended player |

The organizer would publish a root of eligible capabilities, issue each invite off-chain, and define how revocation and root updates work. A table-scoped nullifier would prevent one credential from being reused beyond the room policy without exposing the credential. The precise issuance, revocation and recovery protocol requires design and adversarial tests before implementation.

## Mainnet Feasibility

A limited Preprod MVP is feasible as a single-table allowlist gate with a small pilot group, once the wallet/prover path is reliable. Mainnet by Level 6 is **conditional**, not guaranteed. The immediate blockers are a real Lace-mediated Cat Bluff circuit call, repeatable local proving from the hosted origin, invitation lifecycle design, verifier tests for membership and replay, and organizer review of this idea. No funds, stakes or payouts are in scope.

Before a Mainnet launch, test credential theft and sharing, nullifier linkability, root-update races, revocation, wallet loss, indexer lag, denial of service and privacy leakage from transaction metadata. Publish clear user guidance about what the proof hides and what it does not.

## Level 3 evidence and next decision

The [existing Preprod contract](README.md#contract-address), [live one-round dApp](https://cat-bluff-midnight.vercel.app), generated-contract tests and GitHub CI are the current engineering evidence. A successful frontend transaction and one-minute end-to-end video remain pending because Lace later returned `connect.status/Rejected`; see [Level 2 checkpoints](docs/LEVEL_2_SUBMISSION.md). This proposal selects an allowed Level 3 problem but cannot mark the separate idea-approval requirement complete. Approval belongs to Rise In reviewers.

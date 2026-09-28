# Cat Bluff privacy model

Status on 2026-09-28: contract behavior verified; browser implementation pending.
This describes the existing deployed primitive and the proposed Level 2 boundary.

## Exact statement

Successful `commit(claim)` proves knowledge of a player capability which opens the
constructor's player-role commitment for this game context. It constrains a
hidden rank to 1–13 and a separate public claim to 1–13, computes a randomized
card commitment, and changes Empty to Committed. **It does not prove the claim
equals the hidden rank.** A bluff is valid.

`deriveRole` commits the vector containing `cat-bluff:role:v1`, game context and
role number, using the capability as opening. Role 1 is player; role 2 challenger.
`deriveCard` commits `cat-bluff:card:v1`, context, round, player commitment and
rank, using a fresh 32-byte salt. The constructor fixes context, both distinct
roles and round 1. The frontend cannot bypass these constraints by editing its UI:
the matching on-chain verifier checks the proof produced for the actual circuit.

This relies on the supported commitment/proof primitives and unpredictable
capabilities/salts. Salt entropy and independence of participant secrets are
setup obligations; the circuit cannot prove a user's randomness source was fair.

## State and disclosure

| Value / transition | Public or private | Meaning |
| --- | --- | --- |
| `gameContext`, `round`, `player`, `challenger` | Public | Fixed context, round 1 and role commitments |
| `phase` | Public | Empty → Committed → Challenged → Resolved |
| `commitment`, `claimedRank` | Public after commit | Salted card commitment and independently chosen claim |
| `revealedRank`, `truthful` | Public after resolution | Verified rank and whether it equals the claim |
| `secret`, actual `rank`, `salt` | Private witnesses | Read by generated contract and trusted proving path |
| Circuit identity, contract, timing, public transaction reference | Public metadata | Not hidden by witness privacy |

Initial `revealedRank = 0` and `truthful = false` are sentinels, not a result.
`challenge()` requires the challenger capability and Committed phase.
`resolve()` requires the player capability, Challenged phase, and the identical
rank/salt opening. It intentionally reveals the rank and truth result, never the
salt or capability. Resolved is terminal; invalid-phase and repeated actions fail.

`disclose()` permits a value to cross a public boundary; it is neither encryption
nor publication by itself. In this contract its disclosed context/role values,
commitment/claim and resolution values become visible through public ledger writes.
Exported transactions return `[]`; the demo has no cross-contract calls.

## Browser flow and trust

The Level 2 action will call **commit only** and will never automatically resolve.
An on-chain observer sees the public claim, salted commitment, authorized state
transition and metadata, not the rank, salt or capability at commitment time.
The proposed success sentence must follow a confirmed transaction and name the
actual statement: authorized commitment of a rank in 1–13, without revealing it.

- The operator's original ignored local record remains the recovery source.
  The browser imports an encrypted, scoped demo package containing only the
  player's capability and exact opening. Wallet recovery material is excluded.
  Save the encrypted export under ignored `.private/` without plaintext temporary
  files or overwriting the original record. Never commit or host this package.
  Empty-phase import checks role/scope and input bounds; later phases also require
  its recomputed card commitment to match the public ledger. Verify the saved
  package decrypts correctly before enabling the one-use action.
- The browser decrypts into memory; witnesses never enter UI values, hidden nodes,
  accessibility labels, logs, URLs, analytics, cat art, or sound selection.
- Browser/session, wallet extension and selected **user-local prover** are trusted.
  A prover processes private witness data. Wallet-mediated proving does not by
  itself prove the prover is local: verify configuration and behavior before use.
- Hosting/CDN delivers code and public circuit artifacts. A compromised frontend
  can steal imported secrets; HTTPS alone cannot make malicious code safe.
  No shared proving backend, serverless proxy or analytics service is planned.
- Indexer/explorer receive public queries/results only. Their network operators
  may observe IP/timing/access patterns. This prototype does not claim anonymity.
- Local disconnect releases API references, session data and in-memory witnesses;
  it does not revoke the extension's stored site permission. Recovery remains in
  the original local record/encrypted package. Unknown transaction outcomes must
  be reconciled before retry. Guard every asynchronous side-effect boundary with
  current session/account/network identity; invalidated work must not continue to
  prove, sign or submit. Retain possibly submitted public transaction metadata
  across disconnect. JavaScript memory erasure cannot be guaranteed.

The PDF's literal browser-execution requirement remains **unresolved**. The
current supported native local server is not described as browser-WASM proving.

## Negative tests and limitations

Existing real-binding tests reject rank/claim 0 and 14, wrong role capability,
wrong rank/salt opening, role confusion, invalid phases and replays. Pure helper
tests check context/role/round/player/rank/salt binding. Valid bluff and truthful
claims both pass. These are generated-contract execution tests, not fresh proofs
or real-wallet frontend E2E evidence.

Planned browser tests cover secret-free DOM/logs/public requests with throwaway
data, encrypted-package tampering, incorrect scope, missing recovery, stale async
sessions, wrong network, duplicate clicks, proof/rejection/network failures and
delayed confirmation. Those tests have not been implemented or run yet.

The prototype does not prove fair dealing, card ownership, a 52-card deck, unique
players, independent roles, wallet-to-role ownership, shuffled randomness, or
honesty of the original setup. The operator holds both capabilities. There is one
round, no reset, timeout, forfeit, scoring, hands or multiplayer. A role holder can
withhold resolution. Future players seeing their own hands is a separate game
feature; this demo's hidden-witness rule does not remove that future requirement.

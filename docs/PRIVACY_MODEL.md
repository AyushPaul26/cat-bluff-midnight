# Cat Bluff privacy model

Status on 2026-09-28: contract behavior verified; browser implementation and local
tests complete, real Lace/prover transaction pending. This describes the existing
deployed primitive and the implemented Level 2 boundary, with external checks
explicitly outstanding.

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

The Level 2 action calls **commit only** and never automatically resolves.
An on-chain observer sees the public claim, salted commitment, authorized state
transition and metadata, not the rank, salt or capability at commitment time.
The success sentence follows a confirmed transaction and names the
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
  There is no shared proving backend, serverless proxy or analytics service.
  The fixed Google Fonts stylesheet request carries ordinary network metadata,
  never private input. The SVG and optional sound are independent of witnesses.
- Indexer/explorer receive public queries/results only. Their network operators
  may observe IP/timing/access patterns. This prototype does not claim anonymity.
- Local disconnect releases API references, session data and in-memory witnesses;
  it does not revoke the extension's stored site permission. Recovery remains in
  the original local record/encrypted package. Unknown transaction outcomes must
  be reconciled before retry. Guard every asynchronous side-effect boundary with
  current session/account/network identity; invalidated work must not continue to
  prove, sign or submit. Retain possibly submitted public transaction metadata
  across disconnect. JavaScript memory erasure cannot be guaranteed.

The connector 4.0.1 wallet-mediated prover path is adapted through the actual
Midnight.js 4.1.1 proof provider. A matching loopback `proverServerUri` is required;
an absent URI blocks the action. This is an explicit compatibility constraint:
even a wallet with a genuine local implementation cannot proceed if it does not
expose a verifiable URI. The reported URI is not proof of actual traffic routing.
The operator must verify the real wallet/prover behavior at the hosted origin.

Wallet public-service validation accepts only the complete official Midnight
Preprod tuple or the complete Blockfrost Preprod tuple shipped in Lace 2.4.0.
It rejects mixed tuples, other networks and URL lookalikes. The dApp continues
to read from its configured public Midnight indexer and checks the deployed
verifier keys; accepting Lace's public-service tuple does not change the private
prover boundary. Lace 2.4's source uses an HTTP local prover, not browser-WASM
proving. Installed-wallet traffic still needs a real hosted-origin test.

Web Locks serialize commit/reconciliation per network and contract across tabs.
The public pending store validates/allowlists transaction identifiers, expected
commitment, claim, timestamps and submission status. Malformed or inaccessible
storage fails closed. Known cancellation before invoking submission removes only
its own record; an error after invoking the wallet keeps the ambiguous record.
There is no automatic retry or clearing of an unknown transaction.

The SDK's `watchForTxData` promise offers no abort API. One public-only watcher is
cached per endpoint/transaction; a 60-second UI timeout does not create another
watcher or mean failure. Disconnect invalidates private work and UI generations,
but that public-only watcher may remain until completion or page unload.

The PDF's literal browser-execution requirement remains **unresolved**. The
current supported native local server is not described as browser-WASM proving.

## Negative tests and limitations

Existing real-binding tests reject rank/claim 0 and 14, wrong role capability,
wrong rank/salt opening, role confusion, invalid phases and replays. Pure helper
tests check context/role/round/player/rank/salt binding. Valid bluff and truthful
claims both pass. These are generated-contract execution tests, not fresh proofs
or real-wallet frontend E2E evidence.

Implemented tests cover encrypted-package authentication/tampering/size/parameters,
incorrect scope and role/opening binding, malformed private JSON error sanitizing,
stale async sessions, wrong network, duplicate and cross-tab requests, proof errors,
definitely-unsent cancellation and delayed confirmation. UI/hook tests ensure
private package contents are absent from rendered content and hook state. The
actual browser has verified public data and artifacts only. Wallet/proof adapters
are mocked in automated UI tests; absence of private data in the real wallet's
outbound payloads and logs remains a manual E2E check. No captured private request
bodies may be published. CLI exclusive creation is implemented (`wx`) but the
interactive export with the original private file has not been run by the agent.

The prototype does not prove fair dealing, card ownership, a 52-card deck, unique
players, independent roles, wallet-to-role ownership, shuffled randomness, or
honesty of the original setup. The operator holds both capabilities. There is one
round, no reset, timeout, forfeit, scoring, hands or multiplayer. A role holder can
withhold resolution. Future players seeing their own hands is a separate game
feature; this demo's hidden-witness rule does not remove that future requirement.

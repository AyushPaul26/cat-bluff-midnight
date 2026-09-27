# Cat Bluff Level 1 protocol design

Status: pre-implementation design. These are intended properties to verify against the real Compact implementation.

## Scope and choice

Implement one fixed round per deployed contract with two pre-authorized capability holders: player and challenger. This is smaller than a multi-round game and avoids reset and cross-round replay complexity. A public claim need not match the committed rank. Neither a counter nor a full card game meets this scope.

An unrestricted challenge function would be simpler but would allow any observer to force disclosure. Wallet identity coupling would add integration complexity. Instead, constructor parameters fix role commitments to independent random 32-byte private capability secrets. Circuit witnesses demonstrate knowledge of the appropriate secret. This is capability authorization, not proof of a named human or wallet owner.

## States and transitions

| Phase | Action | Authorized role | Effect |
| --- | --- | --- | --- |
| Empty | commit(claimedRank) | Player | Commit a privately witnessed actual rank and salt; store independent claimed rank; enter Committed |
| Committed | challenge() | Challenger | Record challenge by entering Challenged |
| Challenged | resolve() | Player | Verify the opening, disclose actual rank, record whether claim matches, enter Resolved |
| Resolved | none | none | Terminal; all repeated or out-of-phase actions reject |

Both actual and claimed ranks must be integers 1 through 13. Hidden rank validity is constrained inside the circuit. Each deployed contract has an immutable, randomly generated 32-byte game context and fixed round identifier 1. Role commitments must differ. Salt and capability secrets are independent random values generated using the operating system cryptographic RNG.

## Commitment and authorization

Use the official Compact persistent commitment/hash primitives after checking their exact type and serialization semantics. Card commitment binds a versioned Cat Bluff domain, game context, round identifier, player role commitment, actual rank, and independent 32-byte salt. Role commitments use a different domain and bind game context, role, and its secret. Avoid string concatenation and ambiguous encodings; use fixed-size typed data.

Every mutating circuit recomputes its role commitment from a private witness and checks the appropriate constructor-fixed public value. Resolution recomputes the card commitment from the private opening and compares it with the immutable committed digest before advancing phase. Tests must check changed salt, rank, context, and role secrets. All values entering public state must have an intentional disclosure path.

The application must generate a unique context for each deployment. The contract does not prove global context uniqueness. Sharing a capability secret delegates that role; compromise permits its actions. ZK proofs reveal no capability secret, but transaction submission can still expose wallet/network metadata.

## Public versus private

Public ledger: game context, round identifier, phase, role commitments, card commitment, claimed rank, and (after resolution) actual rank and truthful/bluff result. Initial fields use explicit sentinel values; the phase determines whether they are meaningful.

Private witnesses/state: player and challenger capability secrets, hidden rank, and commitment salt. Role secrets remain private throughout. The salt remains private even at resolution: the circuit proves knowledge of a valid opening and discloses only the actual rank. Rank disclosure on challenge resolution is intentional game behavior, not accidental privacy leakage.

`disclose()` is intended for constructor-public configuration, stored commitments, the public claim, and the verified revealed rank/result. Never disclose the raw salt or role secrets. The contract begins with this privacy model in a comment. The README must explain that hashes and public outcomes can still reveal deductions, including the actual rank after resolution.

## Client and evidence

Use Midnight.js with a dedicated test-network wallet and local proof server. Store recovery material and private-state databases under ignored project-local directories, never in logs. Behavioral tests instantiate the real compiler output; successful simulation is not evidence of deployment. Record confirmed public transaction identifiers, address, and network only after confirmation and indexer verification.

## Limitations

No fair dealing, deck uniqueness, unique human players, shuffled deck, stakes, scoring, wallet identity binding, timeouts, or complete multiplayer rules. The player can refuse resolution and leave the round stuck; liveness penalties are out of scope. A deployer can choose capabilities it knows; trusted setup of roles is explicit. The client must protect secrets and use fresh randomness. A hash does not hide a rank without adequate salt entropy.

## Level 2

Add a frontend with wallet integration, role-specific private storage, clear public claims, challenge/resolution controls, and transaction status. Design multi-round lifecycle and nonresponse handling separately before expanding the contract.

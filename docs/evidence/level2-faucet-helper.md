# Preprod faucet address fallback

2026-09-28. The operator's real Lace Receive screenshot showed a shielded
address and no address-type selector. We do not infer the installed wallet's
internal cause. A small dApp control now reads the correct public unshielded
address from the connected wallet on explicit request.

`WalletSession.getFaucetAddress()` uses connector API 4.0.1's
`getUnshieldedAddress()`. Address-format 3.1.2 validates Preprod, the unshielded
type, checksum and 32-byte payload. Session identity guards run before and
after the asynchronous read. Errors are sanitized. Nothing is persisted,
signed, balanced, submitted or automatically sent to the faucet. The connected
component unmounts on disconnect and changes key on wallet identity change.

Verification performed with project-local Node 22.22.0:

- Focused wallet tests: genuine RED (8 failures because the method was absent)
  then GREEN, 23/23. Full `npm test`: **89/89 passed**; both TypeScript targets
  passed. [Complete log](level2-faucet-core-tests.log), including the initial
  sandbox subprocess error and unchanged permission-enabled rerun.
- UI regression: genuine RED 3 failures, then GREEN 8/8 component tests.
  [Regression log](level2-faucet-ui-regression.log).
- `npm run test:ui`: **18/18 passed** across three files; these use mocks,
  not real Lace. [Full UI log](level2-faucet-ui-tests.log).
- `npm run lint` and `npm run build`: exit 0, including both typechecks and
  public artifact copying. Vite reports its existing large-chunk warning.
  [Build log](level2-faucet-build.log).
- Independent read-only review found no blocking issues.

Cases cover malformed/checksum/type/network/length failures, duplicate clicks,
read failure/retry, disconnected and changed sessions, delayed disconnect and
reconnect, no caching or wallet mutation, and the explicit copy/faucet link.
The real wallet read and free token receipt remain pending operator verification.
No new circuit call, proof, token receipt, or Level 2 completion is asserted.

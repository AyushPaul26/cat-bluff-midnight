# Confirmed Cat Bluff deployment

- Network: Midnight Preprod.
- Contract: `63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16`.
- Transaction identifier: `009987c5cac7b5ebd9176f885dcf012358e1ab705d79548519cd4faff4ad8870e8`.
- Transaction hash: `236f9df716f807191b23d4f4c8474a80f8383fcf0b00815f56de9cb73fd879ae`.
- Block: 2,734,912.
- SDK confirmation: `SucceedEntirely`, verified 2026-09-27 16:39:19 UTC.
- Explorer: [contract](https://preprod.midnightexplorer.com/contracts/0x63ede5f26fb5dd4d89aa6a8007d664a3448a20660dd5a4aad81f60679f4c5c16), [successful transaction](https://preprod.midnightexplorer.com/transactions/0x236f9df716f807191b23d4f4c8474a80f8383fcf0b00815f56de9cb73fd879ae).

`src/deploy.ts` queried the public indexer after confirmation. It compared game context, both role commitments, round 1, Empty phase, and the `commit`, `challenge`, and `resolve` verifier keys against local generated artifacts. Exact source-file and verifier-key hashes are recorded in [deployment.json](evidence/deployment.json). The source hash covers the actual local source bytes used for this run; line-ending conversions can change that file hash without changing its circuits.

The screenshots are genuine browser captures. `deployment.png` displays the actual saved verification metadata; `explorer-contract.png` shows the independent explorer. `compile-tests.png` displays genuine saved compiler output and the test summary. None are generated images or simulated terminal output.

## Network preparation and recovered failure

The dedicated wallet received only free faucet tNight. The faucet transaction and dust registration each have a separately recorded successful indexer result. Initial dust synchronization replayed approximately 1.57 million events. Supported SDK batching and private checkpoints reduced repeated work; no events or cryptographic checks were skipped.

The first custom deployment transaction was rejected by the node with `1010: Invalid Transaction: Custom error: 170`. The [official node mapping](https://github.com/midnightntwrk/midnight-node/blob/main/ledger/src/ledger_8/types.rs) identifies this as `InvalidDustSpendProof`. This attempt never produced a deployment-success record.

The application now waits for full synchronization after dust registration and immediately before balancing. A local reservation from the explicitly rejected spend remained in the SDK snapshot. A diagnostic copy using the pinned ledger's `DustLocalState.processTtls` restored one reserved coin; both generation and commitment Merkle roots remained identical, and its balance was evaluated at the actual current time. The original snapshot was backed up privately. This follows the reservation-expiry mechanism used by the pinned SDK's rejected-transaction path; it did not fabricate ledger events, balances, or keys. A fresh deployment transaction then succeeded and was independently verified.

An additional faucet request returned service unavailable and was not used to claim funding. The successful deployment used the original funded wallet.

For future recovery, preserve `.private/wallet-before-balance.json` and inspect the public identifiers saved in `.private/last-submission.json`. Never restore an old snapshot until any possibly submitted transaction is resolved. Recovery material, private-state databases, role capabilities, salts, and wallet checkpoints are intentionally excluded from Git.

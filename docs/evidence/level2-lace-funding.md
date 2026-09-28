# Operator Lace funding and DUST registration

Checked 2026-09-28 using only the operator-supplied public unshielded address
and public Preprod indexer data. No wallet secret, private witness or recovery
material was read, and no new transaction was sent by the agent.

The real faucet receipt is confirmed in transaction
`22244b88d981ff307ad3d3b3533fd23fefaaf49ba0b7e64fdd22c5eb4a21ef19`,
block 2748700. The output value is 5000000000 base units (the wallet displayed
5,000 tNIGHT). This differs from the token guide's illustrative 1,000 amount;
the actual wallet and indexer result are the evidence here.

The operator personally approved DUST designation. The corresponding
[registration transaction](https://preprod.midnightexplorer.com/transactions/0xa659700b71846bfe228550ed2901fe6eb8b3ee37f48b83d1b7707c5727f11d57)
is SUCCESS at block 2748825, 2026-09-28 15:50:24 UTC. Identifier:
`00dc2f2730a153d263e6e0cd87caf014802f67bcb1e067497e3e6e410b594f81c7`.
The replacement 5000000000-unit output has `registeredForDustGeneration: true`.
[Address history and transaction result](level2-lace-dust-registration.json).

Independent decoding with the pinned ledger 8.1.0 reproduces the transaction
hash. The registration and public DUST event 1571715 target the same address
shown in the operator's Generate tDUST screenshot. The event creates an initial
DUST output. [Decoded public evidence](level2-lace-dust-recipient.json).

Lace nevertheless displayed 0/0 tDUST and the generation form. Its source maps
a designation's rotated NIGHT output to Send to Self, so that activity label
does not mean the wrong operation was selected. Spendable wallet balance,
synchronization and the real frontend circuit call remain unverified. Do not
repeat the registration based only on that empty display.

A separate direct HTTP probe of Lace 2.4's older documented Blockfrost Preprod
proxy returned 410 Gone, stating Midnight endpoints were removed and clients
should use direct network endpoints. This does not establish which endpoint
the installed wallet currently uses; its actual configuration and synchronization
status must be checked before attributing the empty balance to that proxy.

The local proof server returned healthy at 15:56:11 UTC. A read-only Cat Bluff
check at 15:57:42 UTC still found round 1 Empty, with all three verifier keys
matching. No Cat Bluff circuit action or hosted-origin proof is claimed.

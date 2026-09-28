# Lace 2.4.1 endpoint and synchronization audit

Checked September 28, 2026. **Endpoint correction passes local validation and
independent review and is published at `014eec4`, with successful CI verified
for that exact revision. Real-wallet proving remains pending.**

The installed wallet's actual settings identify Lace **2.4.1**, Preprod and a
local prover at `http://localhost:6300`. The observed public endpoint locations
match the [current Blockfrost Midnight documentation](https://docs.blockfrost.io/midnight/):

| Service | Public endpoint location |
| --- | --- |
| Indexer HTTP | `https://midnight-preprod.blockfrost.io/api/v0` |
| Indexer WebSocket | `wss://midnight-preprod.blockfrost.io/api/v0/ws` |
| Node RPC | `https://rpc.midnight-preprod.blockfrost.io` |

Blockfrost documents authentication through a `project_id` header or query
parameter. The installed wallet uses query authentication. Credential values
are deliberately omitted; full credential-bearing settings URLs must not enter
logs, screenshots, public configuration or this repository. The application
continues to use Midnight's public indexer for its own public contract reads.

The earlier allowlist was derived from older Lace 2.4.0 source and names a
retired `lw.iog.io` proxy. A probe of that old proxy returned 410, but the actual
wallet uses the current hosts above. The retired proxy is therefore not evidence
of the cause of this wallet's synchronization delay. The application gate needs
to recognize the observed, authenticated Preprod tuple without accepting
arbitrary hosts or networks. The local correction now accepts that tuple while
retaining the network, host and loopback-prover restrictions.

The [focused regression log](level2-blockfrost-endpoint-tests.log) preserves an
initial sandbox `spawn EPERM`, the real failing tests on the unchanged code,
and the final **7/7** pass after the correction. The
[full Node suite](level2-blockfrost-full-tests.log) passed **92/92**. The
[UI/lint/build log](level2-blockfrost-ui-build.log) records **18/18 mocked UI
tests**, ESLint, both TypeScript targets and the production build passing.
These are genuine, unedited copies of the executed logs, checked for exposed
credential values before publication. An independent code review found no
blockers; it did not perform real-wallet E2E verification.

Separately, [public ledger evidence](level2-lace-funding.md) confirms the
operator's 5,000 tNIGHT faucet receipt and personally approved DUST registration,
including the intended DUST recipient and initial output. Lace nevertheless
displayed **Syncing 99%** for over 30 minutes and 0/0 tDUST. A process sample
showed 13.5 CPU seconds consumed over 38 seconds, with memory use decreasing.
This indicates ongoing computation during that sample; it does not establish
that synchronization will finish or funds are available to spend.
After a Chrome restart and wallet unlock, a new operator screenshot still
showed Midnight Syncing 99% and a generic website connection failure. The first
service-worker Console screenshot showed an RPC runtime-version subscription
disconnect with WebSocket code 1000 (Normal Closure), timestamp 23:23:49 local.
The entry is older than the latest restart report; the actual restart time is
not established. It does not establish a current failure or the cause of the
DUST/indexer synchronization delay. Endpoint query
credentials and the raw screenshot were not copied into the repository.
A fresh connection attempt with cleared displayed Console logs was requested;
its outcome is pending. No reset or additional transaction was requested.

The earlier CI/publication checkpoint belongs to revision `154d1da`:
[89 Node tests, 18 mocked UI tests and three compiled circuits in CI](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36444479417),
[Ready publication](level2-faucet-publication.json), and
[hosted asset checks](level2-faucet-hosted-assets.log). Those results predate the
endpoint correction and remain historical evidence.

The [GitHub CI run for `014eec4`](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36462011909)
completed successfully at **18:00:44 UTC**. Inspection of its actual job logs
verified real compilation of `challenge`, `commit` and `resolve`, including
both prover and verifier keys; **92/92 Node tests**, **18/18 mocked UI tests**,
both TypeScript targets, ESLint and Vite build (5.59 seconds) passed.
The run's artifact ID is `10987903104`, with reported SHA-256
`aadfb81484b9624ef9a103077372047fc91c8a5255588fb652cb3e6dad15afa9`.
CI and review do not exercise the operator's real wallet.

Publication of the correction itself is verified: production deployment
`dpl_CDhW2nsT3cWqkKHxvNucBYf7rZAd` is **Ready**, with Vercel metadata identifying
`main` commit `014eec45826d6e26b35fe3b913f9ffd9377faa16` and the stable Cat Bluff
alias. [Publication evidence](level2-blockfrost-publication.json).
An [inspection of the actual hosted bundle](level2-blockfrost-hosted-code.json)
found the current Blockfrost host strings, authentication parameter handling,
and endpoint/local-prover guards. It did not contain the synthetic test credential.
[Public asset verification](level2-blockfrost-hosted-assets.log) passed at
18:00:44 UTC for nine circuit artifacts and three WASM files.

Real local-prover traffic, a Cat Bluff transaction,
disconnect/reconnect and the submission video remain pending.

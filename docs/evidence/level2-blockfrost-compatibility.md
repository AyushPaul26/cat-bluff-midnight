# Lace 2.4.1 endpoint and synchronization audit

Checked September 28, 2026. **Endpoint correction passes local validation and
independent review; commit, CI, publication and real-wallet proving are pending.**

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

Current completed remote validation belongs to production revision `154d1da`:
[89 Node tests, 18 mocked UI tests and three compiled circuits in CI](https://github.com/AyushPaul26/cat-bluff-midnight/actions/runs/36444479417),
[Ready publication](level2-faucet-publication.json), and
[hosted asset checks](level2-faucet-hosted-assets.log). Those results predate the
endpoint correction. Real local-prover traffic, a Cat Bluff transaction,
disconnect/reconnect and the submission video remain pending.

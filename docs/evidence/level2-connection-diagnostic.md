# Bounded wallet connection diagnostic

Checked September 28, 2026. **Implemented and locally verified; commit,
publication and a real wallet retry remain pending.**

The operator's latest screenshot showed Midnight Syncing 99% and a generic
website connection failure after restarting Chrome and unlocking Lace. The
actual cause remains unknown. This change helps identify which connector
operation failed; it does not repair wallet synchronization or establish
spendable DUST, successful proving or a Cat Bluff transaction.

`WalletSession` now attaches an optional support code to a current error.
It combines a fixed operation (`connect.authorize`, `connect.api`,
`connect.status`, `connect.configuration`, `connect.address`, or the status,
configuration and address equivalents under `revalidate`) with one of the
five error codes declared by connector API 4.0.1: `InternalError`, `Rejected`,
`InvalidRequest`, `PermissionRejected`, or `Disconnected`. A code is retained
only from an error with the expected `DAppConnectorAPIError` type marker and
an exact allowlist match. Other errors and hostile getters produce `Unknown`.

The wallet panel displays the support code only while that error is current.
It clears on retry, success or disconnect, and stale asynchronous failures
cannot restore it. No raw message, details, stack, endpoint, address, witness
or credential from a wallet error is added to the UI, logs or storage. The
diagnostic adds no analytics, persistence, network request or wallet approval.

The implementation was tested first against failing assertions, then corrected:

| Check | Genuine log / result |
| --- | --- |
| Failing wallet regression before implementation | [Node RED](level2-connection-diagnostic-node-red.log): 5 expected failures among 30 tests |
| Failing UI regression before implementation | [UI RED](level2-connection-diagnostic-ui-red.log): 1 expected failure among 10 tests |
| Focused wallet suite | [Node GREEN](level2-connection-diagnostic-node-green.log): 30/30 passed |
| Focused component suite with mocked callbacks | [UI GREEN](level2-connection-diagnostic-ui-green.log): 10/10 passed |
| Full Node suite, including real generated-contract tests | [99/99 passed](level2-connection-diagnostic-full-node.log) |
| Full mocked UI/hook suite | [20/20 passed](level2-connection-diagnostic-full-ui.log) |
| Both TypeScript targets, public artifacts and Vite build | [Build log](level2-connection-diagnostic-build.log): passed |
| ESLint | [Lint log](level2-connection-diagnostic-lint.log): passed |

The logs are byte-preserving copies of the actual runs, inspected for credential
values before inclusion. Independent review approved the change without
blockers and independently reran the 30 wallet tests successfully. These tests
use typed wallet mocks; they do not reproduce or resolve the operator's actual
wallet failure. The existing production/CI checkpoint remains `014eec4` until
this diagnostic is separately committed, published and verified.

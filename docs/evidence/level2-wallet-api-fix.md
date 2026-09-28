# Lace post-authorization compatibility fix

2026-09-28. A real user screenshot showed Lace authorization for the correct
production origin, followed by Cat Bluff's `Unsupported wallet API` error.
No successful connection or transaction is inferred from that authorization.

The Lace 2.4.0 source explains this exact failure:

- [`WalletApiMethodNames`](https://github.com/input-output-hk/lace/blob/lace-extension@2.4.0/packages/module/dapp-connector-midnight/src/const.ts) does not register `hintUsage`.
- [`consumeMessengerRemoteApi`](https://github.com/input-output-hk/lace/blob/lace-extension@2.4.0/packages/lib/extension-messaging/src/remoteApi.ts) returns undefined for unregistered properties.
- [`connect`](https://github.com/input-output-hk/lace/blob/lace-extension@2.4.0/packages/module/dapp-connector-midnight/src/midnight-wallet-api.ts) includes `hintUsage: this.#api.hintUsage` in the returned object.

Cat Bluff required that unused method to be a function, rejecting the whole
connection. The fix validates the SDK's official `WalletConnectedAPI` type
instead of its intersection with `HintUsage`. All 16 wallet-operation checks,
API-version checks, Preprod status/configuration checks, shielded identity
validation and stale-session guards remain. No compatibility cast, version
relaxation, witness disclosure or contract change was introduced.

## Verification

- [Regression log](level2-wallet-api-regression.log): the post-authorization
  fixture first failed with the same error (14 pass / 1 fail), then passed
  after the fix (15 pass / 0 fail). It exercises real session logic with a
  mocked external wallet, including revalidation and disconnect.
- A wallet missing `getProvingProvider` remains rejected.
- [Full Node suite](level2-wallet-api-tests.log): 81 passed, none failed/skipped.
- [Mocked UI suite](level2-wallet-api-ui-tests.log): 15 passed.
- [ESLint, both TypeScript targets and production build](level2-wallet-api-build.log): passed.

Real Lace reconnection on the newly published frontend is still pending.
These tests are not evidence of real wallet proving or an on-chain action.

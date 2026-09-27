// Dust registration flow adapted from example-bboard; Copyright (C) Midnight
// Foundation. SPDX-License-Identifier: Apache-2.0. See THIRD-PARTY-NOTICES.md.
import { firstValueFrom, filter, timeout } from 'rxjs';
import type { buildWallet } from './wallet.ts';

export async function prepareFunds(client: Awaited<ReturnType<typeof buildWallet>>) {
  const { wallet, shieldedSecretKeys, dustSecretKey, keystore } = client;
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  console.log('Synchronizing dedicated Preprod wallet.');
  const state = await firstValueFrom(wallet.state().pipe(
    filter(s => s.shielded.state.progress.isStrictlyComplete()
      && s.unshielded.progress.isStrictlyComplete() && s.dust.state.progress.isStrictlyComplete()),
    timeout(300_000),
  ));
  if (state.dust.balance(new Date()) > 0n) return;
  if (!state.unshielded.availableCoins.length) {
    throw new Error(`Free faucet funding required for ${client.address}. Complete the faucet UI before deploying.`);
  }
  const coins = state.unshielded.availableCoins.filter(coin => !coin.meta.registeredForDustGeneration);
  if (coins.length) {
    const dust = await wallet.dust.waitForSyncedState();
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      coins, keystore.getPublicKey(), payload => keystore.signData(payload), dust.address,
    );
    const txId = await wallet.submitTransaction(await wallet.finalizeRecipe(recipe));
    console.log(`Preprod dust registration submitted: ${txId}`);
  }
  console.log('Waiting for usable test-network dust.');
  await firstValueFrom(wallet.state().pipe(filter(s => s.dust.balance(new Date()) > 0n), timeout(600_000)));
}

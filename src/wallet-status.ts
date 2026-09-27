import { firstValueFrom, filter, tap, timeout } from 'rxjs';
import { buildWallet, loadSecrets } from './wallet.ts';

const client = await buildWallet(await loadSecrets());
let exitCode = 0;
let lastProgress = 0;
try {
  await client.wallet.start(client.shieldedSecretKeys, client.dustSecretKey);
  const state = await firstValueFrom(client.wallet.state().pipe(
    tap(s => { if (Date.now() - lastProgress < 10_000) return; lastProgress = Date.now(); console.log(JSON.stringify({
      shieldedSynced: s.shielded.state.progress.isStrictlyComplete(),
      unshieldedSynced: s.unshielded.progress.isStrictlyComplete(),
      dustSynced: s.dust.state.progress.isStrictlyComplete(),
      shieldedIndex: s.shielded.state.progress.appliedIndex.toString(),
      shieldedHead: s.shielded.state.progress.highestIndex.toString(),
      dustIndex: s.dust.state.progress.appliedIndex.toString(),
      dustHead: s.dust.state.progress.highestIndex.toString(),
    })); }),
    filter(s => s.shielded.state.progress.isStrictlyComplete()
      && s.unshielded.progress.isStrictlyComplete() && s.dust.state.progress.isStrictlyComplete()),
    timeout(90_000),
  ));
  console.log(JSON.stringify({ network: 'preprod', address: client.address,
    unshieldedBalances: state.unshielded.balances, dust: state.dust.balance(new Date()).toString(),
  }, (_, value) => typeof value === 'bigint' ? value.toString() : value));
} catch (error) {
  exitCode = 1;
  if (error instanceof Error) {
    console.error(`Wallet synchronization error class: ${error.name}`);
    console.error(error.stack?.split('\n').slice(1).filter(line => line.trim().startsWith('at ')).join('\n'));
  }
} finally {
  await Promise.race([client.wallet.stop(), new Promise(resolve => setTimeout(resolve, 15_000))]);
  process.exit(exitCode);
}

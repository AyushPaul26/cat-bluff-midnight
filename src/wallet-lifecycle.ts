export async function closeWallet(client: { saveState(): Promise<void>; wallet: { stop(): Promise<unknown> } }): Promise<boolean> {
  let clean = true;
  try {
    await client.saveState();
  } catch {
    // SDK serialization errors may contain private state. Preserve the original
    // operation outcome and report only the failed cleanup stage.
    console.error('Wallet checkpoint could not be saved.');
    clean = false;
  } finally {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        client.wallet.stop(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Shutdown timeout')), 15_000); }),
      ]);
    } catch {
      console.error('Wallet shutdown did not finish cleanly.');
      clean = false;
    } finally {
      clearTimeout(timer);
    }
  }
  return clean;
}

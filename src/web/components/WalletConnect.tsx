import type { WalletChoice, WalletSnapshot } from '../wallet.ts';
import { useState } from 'react';
import { FaucetAddress } from './FaucetAddress.tsx';
export type WalletConnectProps = {wallet:WalletSnapshot; choices:WalletChoice[]; onConnect:(choice:WalletChoice)=>void; onDisconnect:()=>void; onGetFaucetAddress:()=>Promise<string>; busy?:boolean};
export function WalletConnect({wallet,choices,onConnect,onDisconnect,onGetFaucetAddress,busy=false}:WalletConnectProps) {
  const [selected,setSelected] = useState('');
  const [copyStatus,setCopyStatus] = useState('');
  const compatible = choices.filter(choice=>choice.compatible);
  const choice = compatible.find(item=>item.id===selected) ?? (compatible.length===1 ? compatible[0] : undefined);
  return <section className="wallet-panel" aria-labelledby="wallet-heading">
    <div className="step-label"><span>01</span><h3 id="wallet-heading">Bring your wallet</h3></div>
    {wallet.status==='connected' ? <>
      <p className="connection-status"><span className="status-dot" />{wallet.name} connected · Preprod</p>
      <label className="field-label">Shielded address</label><p className="address">{wallet.address}</p>
      <div className="button-row"><button className="button secondary" onClick={()=>{void navigator.clipboard.writeText(wallet.address).then(()=>setCopyStatus('Copied')).catch(()=>setCopyStatus('Select the address to copy it.'));}}>Copy address</button><button className="text-button" onClick={onDisconnect}>Disconnect</button></div>
      <span className="small-note" role="status">{copyStatus}</span>
      <FaucetAddress key={`${wallet.name}:${wallet.address}`} onRead={onGetFaucetAddress} disabled={busy}/>
    </> : <>
      <p className="muted">Connect Lace to approve a private action on the free Preprod network.</p>
      {compatible.length===0 ? <p className="setup-note">No compatible wallet detected. Install or unlock Lace in a supported browser, select Preprod, then return here. We check for it automatically.</p> : <>
        {compatible.length>1 && <label className="field-label">Choose your Lace instance<select value={selected} onChange={event=>setSelected(event.target.value)}><option value="">Select a wallet</option>{compatible.map(item=><option key={item.id} value={item.id}>{item.name} · API {item.apiVersion}</option>)}</select></label>}
        <button className="button" disabled={!choice||wallet.status==='connecting'} onClick={()=>{if(choice)onConnect(choice);}}>{wallet.status==='connecting'?'Waiting for wallet…':`Connect ${choice?.name ?? 'Lace'}`}</button>
      </>}
      {choices.some(item=>!item.compatible) && <p className="small-note">A wallet with an unsupported connector API was found. This demo needs API 4.0.1 or compatible 4.x.</p>}
      {wallet.status==='error' && <p className="error" role="alert">{wallet.reason}. {wallet.diagnostic==='connect.status/Rejected' ? "Lace returned Rejected while checking this site's connection. Check Lace's site permissions for this URL, then retry. If no approval prompt appears, share the support code with Lace Support." : 'Unlock Lace, select Preprod, and retry. You can decline requests safely.'}{wallet.diagnostic && <><br/>Support code: <code>{wallet.diagnostic}</code></>}</p>}
    </>}
    <p className="small-note">Disconnect clears this app’s session. Saved Lace site permissions are managed inside your wallet.</p>
  </section>;
}

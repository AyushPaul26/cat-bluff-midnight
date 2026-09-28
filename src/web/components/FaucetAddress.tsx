import { useEffect, useRef, useState } from 'react';

export function FaucetAddress({onRead,disabled=false}:{onRead:()=>Promise<string>;disabled?:boolean}) {
  const [address,setAddress]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);
  const [copied,setCopied]=useState('');
  const mounted=useRef(false),reading=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function read() {
    if(reading.current||disabled)return;
    reading.current=true;setLoading(true);setError(false);
    try { const value=await onRead(); if(mounted.current)setAddress(value); }
    catch { if(mounted.current)setError(true); }
    finally { reading.current=false;if(mounted.current)setLoading(false); }
  }
  async function copy() {
    if(!address)return;
    try { await navigator.clipboard.writeText(address);if(mounted.current)setCopied('Faucet address copied'); }
    catch { if(mounted.current)setCopied('Select the faucet address above to copy it.'); }
  }
  return <div className="faucet-setup" role="group" aria-label="Free Preprod test tokens">
    <p className="field-label">Free Preprod test tokens</p>
    <p className="small-note">The faucet needs your unshielded address. Read it directly from this connected wallet.</p>
    {address ? <>
      <p className="field-label">Preprod faucet address · unshielded</p>
      <p className="address">{address}</p>
      <div className="button-row"><button className="button secondary" onClick={()=>{void copy();}}>Copy faucet address</button><a className="text-link" href="https://midnight-tmnight-preprod.nethermind.dev/" target="_blank" rel="noreferrer">Open free Preprod faucet ↗</a></div>
      <span className="small-note" role="status">{copied}</span>
      <p className="small-note">After receiving tNIGHT, use Generate tDUST in Lace. Wallet approvals stay with you.</p>
    </> : <button className="button secondary" disabled={loading||disabled} onClick={()=>{void read();}}>{loading?'Reading wallet…':'Show faucet address'}</button>}
    {error && <p className="error" role="alert">Could not read the Preprod faucet address. Reconnect Lace on Preprod and retry.</p>}
  </div>;
}

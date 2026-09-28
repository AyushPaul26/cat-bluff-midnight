export interface PrivatePackageFormProps {enabled:boolean; ready:boolean; onImport:(text:string,password:string)=>Promise<void>}
export function PrivatePackageForm({enabled,ready,onImport}:PrivatePackageFormProps) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy||!enabled)return;
    const form=event.currentTarget;
    const file=(form.elements.namedItem('package') as HTMLInputElement).files?.[0];
    const password=(form.elements.namedItem('password') as HTMLInputElement).value;
    form.reset();setError('');
    if(!file||file.size>65_536||password.length<16){setError('Choose the encrypted package and enter its passphrase (at least 16 characters).');return;}
    setBusy(true);
    try{await onImport(await file.text(),password);}catch{setError('The package could not be unlocked for this contract and wallet session. Check the file and passphrase, then retry.');}finally{setBusy(false);}
  }
  return <section aria-labelledby="private-heading"><div className="step-label"><span>02</span><h3 id="private-heading">Keep it to yourself</h3></div>
    <p className="muted">The operator’s encrypted package unlocks this one-use demo. Your card, salt and role secret never appear on screen.</p>
    {ready ? <div className="private-ready"><span aria-hidden="true">✓</span> Private action unlocked<span className="small-note">Held in memory for this wallet session.</span></div> : <form onSubmit={event=>{void submit(event);}}>
      <label className="field-label" htmlFor="private-file">Encrypted package</label><input id="private-file" name="package" type="file" accept="application/json,.json" disabled={!enabled||busy} />
      <label className="field-label" htmlFor="private-pass">Package passphrase</label><input id="private-pass" name="password" type="password" autoComplete="off" spellCheck={false} minLength={16} disabled={!enabled||busy} placeholder="Enter privately" />
      <button className="button secondary full" type="submit" disabled={!enabled||busy}>{busy?'Unlocking…':'Unlock private action'}</button>
    </form>}
    {error && <p className="error" role="alert">{error}</p>}
    {!enabled && !ready && <p className="small-note">Connect your wallet first.</p>}
    <p className="small-note">Only the original player capability can act. A connected wallet alone does not grant a role.</p>
  </section>;
}
import { useState, type FormEvent } from 'react';

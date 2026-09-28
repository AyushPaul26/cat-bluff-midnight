export interface CircuitCallProps {canCommit:boolean; busy:boolean; claim:number; onClaim:(claim:number)=>void; onCommit:()=>void; reason?:string; stage?:string; txId?:string; confirmation?:{txHash:string; blockHeight:number; commitment:string}; onRecheck?:()=>void}
const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const stageText:Record<string,string>={preparing:'Checking contract and wallet…',proving:'Generating the proof with your wallet’s local prover…',approval:'Awaiting wallet approval…',submitted:'Submitted. Waiting for the indexer…',pending:'Submitted; confirmation not yet verified.',confirmed:'Confirmed on Preprod',failed:'The action did not complete. Review the status below.'};
export function CircuitCall({canCommit,busy,claim,onClaim,onCommit,reason,stage,txId,confirmation,onRecheck}:CircuitCallProps) {
  return <section className="circuit-panel" aria-labelledby="circuit-heading">
    <div className="step-label"><span>03</span><h3 id="circuit-heading">Make a public claim</h3></div>
    <p className="muted">The rank you claim is public. It can differ from your hidden card. That’s the bluff.</p>
    <label className="field-label" htmlFor="claimed-rank">I’m claiming a…</label>
    <div className="claim-controls"><select id="claimed-rank" value={claim} disabled={busy||Boolean(txId)} onChange={event=>onClaim(Number(event.target.value))}>{ranks.map((rank,index)=><option value={index+1} key={rank}>{rank}</option>)}</select><span className="public-tag">PUBLIC CLAIM</span></div>
    <button className="button primary full" disabled={!canCommit||busy} onClick={onCommit}>Commit private card <span aria-hidden="true">↗</span></button>
    {reason && <p className="small-note">{reason}</p>}
    {stage && <div className={`transaction-status ${stage==='confirmed'?'success':''}`} role="status" aria-live="polite"><span className={busy?'spinner':'status-dot'} aria-hidden="true"/>{stageText[stage] ?? 'Ready'}</div>}
    {txId && <div className="receipt"><span className="field-label">Transaction identifier</span><code>{txId}</code>{onRecheck && !confirmation && <button className="text-button" disabled={busy} onClick={onRecheck}>Check this transaction</button>}</div>}
    {confirmation && stage==='confirmed' && <div className="success-proof"><strong>Proved without revealing your input</strong><p>Authorized commitment of a hidden rank in 1–13. This does not prove the public claim is truthful or that cards were fairly dealt.</p><span className="field-label">Public card commitment</span><code>{confirmation.commitment}</code><p className="small-note">Confirmed in block {confirmation.blockHeight.toLocaleString()}. Your browser, wallet and local prover are trusted with private inputs.</p><a href={`https://preprod.midnightexplorer.com/transactions/0x${confirmation.txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a></div>}
  </section>;
}

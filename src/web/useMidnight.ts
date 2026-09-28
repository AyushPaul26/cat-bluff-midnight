import { useCallback, useEffect, useRef, useState } from 'react';
import { browserConfiguration, type BrowserConfig } from './config.ts';
import { discoverWallets, WalletSession, type WalletChoice, type WalletSnapshot } from './wallet.ts';
import { decryptPackage, validatePackageState, type OpenedPackage } from './private-package.ts';
import { readPublicState, reconcilePending, runCommit } from './contract.ts';
import { createPendingStore } from './pending-store.ts';
import type { CommitResult, PendingRecord, PendingStore, TransactionStage } from './transaction.ts';
import type { Ledger } from '../../managed/cat-bluff/contract/index.js';

function wipe(opened:OpenedPackage|null){if(opened){opened.state.secret.fill(0);opened.state.salt.fill(0);opened.state.rank=0n;}}
const SAFE_MESSAGES=new Set([
 'This browser must support Web Locks before committing or reconciling transactions.',
 'Another tab is already handling this contract transaction.',
 'Pending transaction changed. Refresh before continuing.',
 'Configure the wallet to use the specified local proof server before committing.',
 'Wallet endpoints must match this Preprod application.',
 'Reconcile the pending transaction before submitting again.',
 'Commit requires an empty round.',
 'Transaction was rejected on chain. The pending record is retained.',
 'Confirmed state does not match the expected commitment.',
 'The public pending record could not be read or saved. Resolve browser storage before retrying.',
]);
const message=(error:unknown,fallback:string)=>error instanceof Error&&SAFE_MESSAGES.has(error.message)?error.message:fallback;

export function useMidnight(){
 const [config,setConfig]=useState<BrowserConfig|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [wallet,setWallet]=useState<WalletSnapshot>({status:'disconnected'});
 const [choices,setChoices]=useState<WalletChoice[]>([]);
 const [publicState,setPublicState]=useState<Ledger|null>(null);
 const [publicLoading,setPublicLoading]=useState(false);
 const [privateReady,setPrivateReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const [stage,setStage]=useState<TransactionStage|null>(null);
 const [result,setResult]=useState<CommitResult|null>(null);
 const [pending,setPending]=useState<PendingRecord|null>(null);
 const opened=useRef<OpenedPackage|null>(null);
 const mounted=useRef(false),generation=useRef(0),operation=useRef(false),refreshing=useRef(false);
 const configuration=useRef<BrowserConfig|null>(null),store=useRef<PendingStore|null>(null);
 const clearPrivate=useCallback(()=>{wipe(opened.current);opened.current=null;if(mounted.current)setPrivateReady(false);},[]);
 const [session]=useState(()=>new WalletSession(snapshot=>{
  if(snapshot.status!=='connected'){++generation.current;clearPrivate();}
  if(mounted.current){setWallet(snapshot);if(snapshot.status!=='connected'){setStage(null);setBusy(false);}}
 }));
 const updatePending=useCallback(()=>{if(store.current&&mounted.current)setPending(store.current.get());},[]);
 const refresh=useCallback(async()=>{
  const cfg=configuration.current,storage=store.current;if(!cfg||!storage||refreshing.current)return;
  refreshing.current=true;if(mounted.current){setPublicLoading(true);setError(null);}
  try{
   const saved=storage.get();if(mounted.current)setPending(saved);
   const state=await readPublicState(cfg);if(mounted.current)setPublicState(state);
   if(saved){const checked=await reconcilePending(cfg,storage,s=>{if(mounted.current)setStage(s);});if(mounted.current){setResult(checked);setPending(storage.get());}}
  }catch(e){if(mounted.current)setError(message(e,'Public contract state could not be verified. Retry the public refresh.'));}
  finally{refreshing.current=false;if(mounted.current)setPublicLoading(false);}
 },[]);
 const recheck=useCallback(async()=>{await refresh();},[refresh]);
 useEffect(()=>{
  mounted.current=true;let cancelled=false;
  const discover=()=>{if(!cancelled)setChoices(discoverWallets(window.midnight));};
  const validate=()=>{void session.revalidate();};
  discover();const discoveryTimer=setInterval(discover,1000),validationTimer=setInterval(validate,15_000);
  window.addEventListener('focus',validate);
  void (async()=>{
   try{
    const response=await fetch('/deployment.json',{cache:'no-store'});if(!response.ok)throw Error();
    const receipt:unknown=await response.json();
    if(!receipt||typeof receipt!=='object'||!('network' in receipt)||receipt.network!=='preprod'||!('contractAddress' in receipt)||typeof receipt.contractAddress!=='string'||!('status' in receipt)||receipt.status!=='SucceedEntirely')throw Error();
    const env=import.meta.env;
    if(env.VITE_CONTRACT_ADDRESS&&env.VITE_CONTRACT_ADDRESS.toLowerCase()!==receipt.contractAddress.toLowerCase())throw Error();
    const cfg=browserConfiguration({network:env.VITE_NETWORK??receipt.network,contractAddress:receipt.contractAddress,indexer:env.VITE_INDEXER,indexerWS:env.VITE_INDEXER_WS,substrateNode:env.VITE_SUBSTRATE_NODE,proverServer:env.VITE_PROVER_SERVER});
    if(cancelled)return;
    configuration.current=cfg;store.current=createPendingStore(cfg,window.localStorage);setConfig(cfg);
    await refresh();
   }catch{if(!cancelled)setError('Deployment configuration could not be verified. Check the public deployment receipt and configuration.');}
  })();
  return()=>{cancelled=true;mounted.current=false;++generation.current;clearInterval(discoveryTimer);clearInterval(validationTimer);window.removeEventListener('focus',validate);session.disconnect();clearPrivate();};
 },[clearPrivate,refresh,session]);
 const connect=useCallback(async(choice:WalletChoice)=>{
  if(operation.current)return;operation.current=true;setError(null);setBusy(true);clearPrivate();
  try{await session.connect(choice);}finally{operation.current=false;if(mounted.current)setBusy(false);}
 },[clearPrivate,session]);
 const disconnect=useCallback(()=>{session.disconnect();clearPrivate();if(mounted.current){setResult(null);setStage(null);setError(null);}},[clearPrivate,session]);
 const importPackage=useCallback(async(text:string,password:string)=>{
  if(operation.current)return;operation.current=true;const token=generation.current;let temporary:OpenedPackage|null=null;
  if(mounted.current){setBusy(true);setError(null);}clearPrivate();
  try{
   const cfg=configuration.current;if(!cfg)throw Error();const capture=session.capture();await capture.guard();
   temporary=await decryptPackage(text,password);await capture.guard();
   if(!mounted.current||token!==generation.current||!capture.isCurrent())return;
   const state=await readPublicState(cfg);await capture.guard();
   if(!mounted.current||token!==generation.current||!capture.isCurrent())return;
   validatePackageState(temporary,cfg.contractAddress,state);
   opened.current=temporary;temporary=null;setPrivateReady(true);setPublicState(state);
  }catch{if(mounted.current&&token===generation.current)setError('The private package could not be opened or matched to this wallet session and contract.');}
  finally{wipe(temporary);operation.current=false;if(mounted.current&&token===generation.current)setBusy(false);}
 },[clearPrivate,session]);
 const commit=useCallback(async(claim:bigint)=>{
  if(operation.current)return;operation.current=true;const token=generation.current;
  if(mounted.current){setBusy(true);setError(null);setResult(null);}
  try{
   const cfg=configuration.current,storage=store.current;if(!cfg||!storage)throw Error();
   if(storage.get())throw new Error('Reconcile the pending transaction before submitting again.');
   const state=opened.current;if(!state)throw Error();const capture=session.capture();await capture.guard();
   const outcome=await runCommit({config:cfg,session:capture,opened:state,claim,store:storage,onStage:s=>{if(mounted.current&&token===generation.current){setStage(s);updatePending();}}});
   if(mounted.current&&token===generation.current){setResult(outcome);updatePending();clearPrivate();if(outcome.status==='confirmed'){const confirmedState=await readPublicState(cfg);if(mounted.current&&token===generation.current)setPublicState(confirmedState);}}
  }catch(e){if(mounted.current&&token===generation.current){setStage('failed');setError(message(e,'Transaction could not be completed. Check the wallet, local prover, and public pending record.'));}}
  finally{operation.current=false;if(mounted.current&&token===generation.current){setBusy(false);try{updatePending();}catch(e){setError(message(e,'Public pending storage is unavailable.'));}}}
 },[clearPrivate,session,updatePending]);
 return {config,error,wallet,choices,publicState,publicLoading,privateReady,busy,stage,result,pending,connect,disconnect,importPackage,commit,recheck,refresh};
}

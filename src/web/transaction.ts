import { browserTransactionLock, type TransactionLock } from './transaction-lock.ts';
import { Phase, pureCircuits, type Ledger } from '../../managed/cat-bluff/contract/index.js';
import { validatePackageState, type OpenedPackage } from './private-package.ts';
import type { BrowserConfig } from './config.ts';
export type TransactionStage = 'preparing'|'proving'|'approval'|'submitted'|'confirmed'|'pending'|'failed';
export type PendingRecord = { network: 'preprod'; contractAddress:string; txId:string; expectedCommitment:string; claim:string; timestamp:number; submission:'attempting'|'submitted'|'uncertain' };
export interface PendingStore { get():PendingRecord|null; set(record:PendingRecord|null):void }
export type PublicReceipt = {status:'confirmed';txId:string;txHash:string;blockHeight:number;claim:string;commitment:string;phase:Phase};
export type CommitResult = PublicReceipt | {status:'pending';record:PendingRecord};
export type CommitHooks = {beforeProof():Promise<void>;beforeApproval():Promise<void>;beforeSubmit(txId:string):Promise<void>;submissionAborted(txId:string):void};
export type CommitInput = {config:BrowserConfig;opened:OpenedPackage;claim:bigint;guard():Promise<void>;store:PendingStore;onStage?(stage:TransactionStage):void};
export interface CommitDependencies {
 read(config:BrowserConfig):Promise<Ledger>;
 readAt(config:BrowserConfig,blockHeight:number):Promise<Ledger>;
 watch(config:BrowserConfig,txId:string):Promise<{status:string;txHash:string;blockHeight:number}>;
 execute(hooks:CommitHooks,input:CommitInput):Promise<void>;
 timeoutMs?:number; withLock?:TransactionLock;
}
class PublicError extends Error {}
const hex=(x:Uint8Array)=>Array.from(x,b=>b.toString(16).padStart(2,'0')).join('');
function assertOwnRecord(store:PendingStore,expected:PendingRecord){
 const current=store.get();
 if(!current||current.txId!==expected.txId||current.network!==expected.network||current.contractAddress!==expected.contractAddress||current.expectedCommitment!==expected.expectedCommitment||current.claim!==expected.claim||current.timestamp!==expected.timestamp)throw new PublicError('Pending transaction changed. Refresh before continuing.');
}
export function createCommitController(deps:CommitDependencies) {
 let active=false;
 async function reconcileUnlocked(config:BrowserConfig,store:PendingStore,onStage?:(stage:TransactionStage)=>void):Promise<CommitResult|null> {
  const record=store.get(); if(!record)return null;
  if(record.network!==config.network||record.contractAddress!==config.contractAddress)throw new PublicError('Pending transaction belongs to another contract.');
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
   const observed=await Promise.race([(async()=>{const data=await deps.watch(config,record.txId);const state=data.status==='SucceedEntirely'?await deps.readAt(config,data.blockHeight):null;return {data,state};})(),new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),deps.timeoutMs??60_000);})]);
   if(!observed){onStage?.('pending');return {status:'pending',record};}
   const {data,state}=observed;
   if(data.status!=='SucceedEntirely')throw new PublicError('Transaction was rejected on chain. The pending record is retained.');

   if(!state||state.phase!==Phase.Committed||state.claimedRank.toString()!==record.claim||hex(state.commitment)!==record.expectedCommitment)throw new PublicError('Confirmed state does not match the expected commitment.');
   const receipt:PublicReceipt={status:'confirmed',txId:record.txId,txHash:data.txHash,blockHeight:data.blockHeight,claim:record.claim,commitment:record.expectedCommitment,phase:state.phase};
   assertOwnRecord(store,record);store.set(null);onStage?.('confirmed');return receipt;
  }catch(error){if(error instanceof PublicError){onStage?.('failed');throw error;}onStage?.('pending');return {status:'pending',record};}
  finally{if(timer!==undefined)clearTimeout(timer);}
 }
 async function runUnlocked(input:CommitInput):Promise<CommitResult> {

  if(input.store.get())throw new PublicError('Reconcile the pending transaction before submitting again.');
  const persistence:{record:PendingRecord|null}={record:null};
  try {
   input.onStage?.('preparing');await input.guard();
   if(input.claim<1n||input.claim>13n)throw new PublicError('Claim must be between 1 and 13.');
   const state=await deps.read(input.config);
   if(state.phase!==Phase.Empty)throw new PublicError('Commit requires an empty round.');
   validatePackageState(input.opened,input.config.contractAddress,state);
   const expectedCommitment=hex(pureCircuits.deriveCard(state.gameContext,state.round,state.player,input.opened.state.rank,input.opened.state.salt));
   const hooks:CommitHooks={
    beforeProof:async()=>{await input.guard();input.onStage?.('proving');},
    beforeApproval:async()=>{await input.guard();input.onStage?.('approval');},
    beforeSubmit:async txId=>{await input.guard();if(!/^[0-9a-f]{64}$/i.test(txId))throw new Error('Invalid transaction identifier');if(input.store.get())throw new PublicError('Reconcile the pending transaction before submitting again.');const record:PendingRecord={network:input.config.network,contractAddress:input.config.contractAddress,txId,expectedCommitment,claim:input.claim.toString(),timestamp:Date.now(),submission:'attempting'};input.store.set(record);persistence.record=record;},
    submissionAborted:txId=>{const record=persistence.record;if(!record||record.txId!==txId)throw new PublicError('Pending transaction changed. Refresh before continuing.');assertOwnRecord(input.store,record);input.store.set(null);persistence.record=null;},
   };
   try {await deps.execute(hooks,input);if(!persistence.record)throw new PublicError('Transaction could not be completed.');assertOwnRecord(input.store,persistence.record);input.store.set({...persistence.record,submission:'submitted'});input.onStage?.('submitted');}
   catch(error){if(!persistence.record)throw error;assertOwnRecord(input.store,persistence.record);input.store.set({...persistence.record,submission:'uncertain'});}
   const result=await reconcileUnlocked(input.config,input.store,input.onStage);
   if(!result)throw new PublicError('Transaction could not be completed.');
   return result;
  }catch(error){input.onStage?.('failed');throw error instanceof PublicError?error:new PublicError('Transaction could not be completed.');}

 }
 async function run(input:CommitInput):Promise<CommitResult>{
  if(active)throw new PublicError('A transaction is already running.');
  active=true;
  try{return await (deps.withLock??browserTransactionLock)(input.config,()=>runUnlocked(input));}
  finally{active=false;}
 }
 const reconcile=(config:BrowserConfig,store:PendingStore,onStage?:(stage:TransactionStage)=>void)=>(deps.withLock??browserTransactionLock)(config,()=>reconcileUnlocked(config,store,onStage));
 return {run,reconcile};
}

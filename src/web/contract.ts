import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Transaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { submitCallTxAsync, verifyContractState, type ContractProviders } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { createProofProvider, type PublicDataProvider } from '@midnight-ntwrk/midnight-js-types';
import { Contract, ledger, type Ledger } from '../../managed/cat-bluff/contract/index.js';
import { createMemoryPrivateStateProvider, playerWitnesses, type PrivateState } from './private-state.ts';
import { localProverUrl, type BrowserConfig } from './config.ts';
import type { WalletCapture } from './wallet.ts';
import type { OpenedPackage } from './private-package.ts';
import { createCommitController, type CommitInput, type PendingStore, type TransactionStage } from './transaction.ts';

const circuits = ['commit','challenge','resolve'] as const;
const compiledContract = CompiledContract.make<Contract<PrivateState>>('CatBluff',Contract<PrivateState>).pipe(CompiledContract.withWitnesses(playerWitnesses),CompiledContract.withCompiledFileAssets('/zk/'));
const publicProviders=new Map<string,PublicDataProvider>();
function publicProvider(config:BrowserConfig):PublicDataProvider {
 setNetworkId('preprod');
 const key=JSON.stringify([config.indexer,config.indexerWS]);
 let provider=publicProviders.get(key);
 if(!provider){provider=indexerPublicDataProvider(config.indexer,config.indexerWS);publicProviders.set(key,provider);}
 return provider;
}
function zkProvider(){setNetworkId('preprod');return new FetchZkConfigProvider<typeof circuits[number]>(new URL('/zk/',window.location.origin).href,globalThis.fetch.bind(globalThis));}
async function verifiedRead(config:BrowserConfig,blockHeight?:number):Promise<Ledger>{
 const provider=publicProvider(config),zk=zkProvider();
 const state=await provider.queryContractState(config.contractAddress,blockHeight===undefined?undefined:{type:'blockHeight',blockHeight});
 if(!state)throw new Error('Contract state is unavailable.');
 const keys=await Promise.all(circuits.map(async circuit=>[circuit,await zk.getVerifierKey(circuit)] as const));
 verifyContractState(keys.map(([circuit,key])=>[circuit,key]),state);
 return ledger(state.data);
}
export async function readPublicState(config:BrowserConfig):Promise<Ledger>{
 try{return await verifiedRead(config);}catch{throw new Error('Public contract state or verifier keys could not be verified.');}
}
// SDK 4.1.1 exposes no cancellation on watchForTxData. Keep one live watch per
// endpoint/transaction across retries; timeouts do not create subscriptions.
const watches=new Map<string,ReturnType<PublicDataProvider['watchForTxData']>>();
function watch(config:BrowserConfig,txId:string){
 const key=JSON.stringify([config.indexer,config.indexerWS,txId]);
 let pending=watches.get(key);
 if(!pending){pending=publicProvider(config).watchForTxData(txId);watches.set(key,pending);void pending.catch(()=>watches.delete(key));}
 return pending;
}
const sessions=new WeakMap<CommitInput,WalletCapture>();
const hex=(x:Uint8Array)=>Array.from(x,b=>b.toString(16).padStart(2,'0')).join('');
function fromHex(x:string){if(!/^(?:[0-9a-f]{2})+$/i.test(x))throw new Error('Invalid wallet transaction');return Uint8Array.from(x.match(/../g)!,b=>Number.parseInt(b,16));}
function loopbackIdentity(uri:string|undefined){const local=localProverUrl(uri);if(!local)return undefined;const url=new URL(local);url.hostname='127.0.0.1';return url.href;}
// Lace 2.4.0 uses these Preprod proxies; its settings display them read-only.
// Source: input-output-hk/lace, tag lace-extension@2.4.0,
// packages/contract/midnight-context/src/{const,utils}.ts.
const preprodWalletServices = [
 ['https://indexer.preprod.midnight.network/api/v4/graphql','wss://indexer.preprod.midnight.network/api/v4/graphql/ws','https://rpc.preprod.midnight.network/'],
 ['https://blockfrost.lw.iog.io/midnight-preprod/','wss://blockfrost.lw.iog.io/midnight-preprod/ws','https://blockfrost.lw.iog.io/midnight-preprod-rpc/'],
] as const;
function approvedWalletServices(wallet:WalletCapture['configuration']):boolean {
 try {
  const endpoints=[wallet.indexerUri,wallet.indexerWsUri,wallet.substrateNodeUri].map(uri=>new URL(uri).href);
  return preprodWalletServices.some(tuple=>tuple.every((uri,index)=>uri===endpoints[index]));
 }catch{return false;}
}
function validateWallet(config:BrowserConfig,session:WalletCapture){
 const wallet=session.configuration;
 if(wallet.networkId!=='preprod'||wallet.networkId!==config.network||!approvedWalletServices(wallet))throw new Error('Wallet endpoints must use a supported Preprod service configuration.');
 const prover=localProverUrl(wallet.proverServerUri);
 if(!prover||loopbackIdentity(prover)!==loopbackIdentity(config.proverServer))throw new Error('Configure the wallet to use the specified local proof server before committing.');
}
const controller=createCommitController({
 read:readPublicState,readAt:verifiedRead,watch,
 async execute(hooks,input){
  const session=sessions.get(input);if(!session)throw new Error('Missing wallet session');
  await session.guard();validateWallet(input.config,session);
  const zk=zkProvider();
  await hooks.beforeProof();
  const proving=await session.api.getProvingProvider(zk.asKeyMaterialProvider());
  const proof=createProofProvider(proving);
  const memory=createMemoryPrivateStateProvider(input.opened.state,input.config.contractAddress);
  try {
   const providers:ContractProviders<Contract<PrivateState>>={
    zkConfigProvider:zk,publicDataProvider:publicProvider(input.config),privateStateProvider:memory.provider,
    proofProvider:{proveTx:async(tx,options)=>{await hooks.beforeProof();return proof.proveTx(tx,options);}},
    walletProvider:{getCoinPublicKey:()=>session.coinPublicKey,getEncryptionPublicKey:()=>session.encryptionPublicKey,
     balanceTx:async tx=>{await hooks.beforeApproval();const balanced=await session.api.balanceUnsealedTransaction(hex(tx.serialize()));await session.guard();return Transaction.deserialize('signature','proof','binding',fromHex(balanced.tx));}},
    midnightProvider:{submitTx:async tx=>{const serialized=hex(tx.serialize());const txId=tx.identifiers()[0];await hooks.beforeSubmit(txId);if(!session.isCurrent()){hooks.submissionAborted(txId);throw new Error('Wallet session changed');}await session.api.submitTransaction(serialized);return txId;}},
   };
   await session.guard();
   await submitCallTxAsync(providers,{compiledContract,circuitId:'commit',contractAddress:input.config.contractAddress,privateStateId:'cat-bluff',args:[input.claim]});
  }finally{memory.dispose();}
 },
});
export async function runCommit(input:{config:BrowserConfig;session:WalletCapture;opened:OpenedPackage;claim:bigint;onStage?:(stage:TransactionStage)=>void;store:PendingStore}){
 // These are application-authored setup messages, never SDK error messages.
 validateWallet(input.config,input.session);
 const request:CommitInput={config:input.config,opened:input.opened,claim:input.claim,onStage:input.onStage,store:input.store,guard:input.session.guard};
 sessions.set(request,input.session);
 try{return await controller.run(request);}finally{sessions.delete(request);}
}
export const reconcilePending=(config:BrowserConfig,store:PendingStore,onStage?:(stage:TransactionStage)=>void)=>controller.reconcile(config,store,onStage);

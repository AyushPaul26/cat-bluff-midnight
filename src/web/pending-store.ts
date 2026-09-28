import type { PendingRecord, PendingStore } from './transaction.ts';
type Scope = Pick<PendingRecord,'network'|'contractAddress'>;
type Storage = Pick<globalThis.Storage,'getItem'|'setItem'|'removeItem'>;
const invalid=()=>new Error('The public pending record could not be read or saved. Resolve browser storage before retrying.');
function validate(value:unknown,scope:Scope):PendingRecord {
 const p=value as Partial<PendingRecord>|null;
 if(!p||p.network!==scope.network||p.contractAddress!==scope.contractAddress||typeof p.txId!=='string'||!/^[0-9a-f]{64}$/i.test(p.txId)||typeof p.expectedCommitment!=='string'||!/^[0-9a-f]{64}$/i.test(p.expectedCommitment)||typeof p.claim!=='string'||!/^(?:[1-9]|1[0-3])$/.test(p.claim)||typeof p.timestamp!=='number'||!Number.isSafeInteger(p.timestamp)||p.timestamp<0||!['attempting','submitted','uncertain'].includes(p.submission??''))throw invalid();
 return {network:p.network,contractAddress:p.contractAddress,txId:p.txId,expectedCommitment:p.expectedCommitment,claim:p.claim,timestamp:p.timestamp,submission:p.submission!};
}
export function createPendingStore(scope:Scope,storage:Storage):PendingStore {
 const key=`cat-bluff:pending:${scope.network}:${scope.contractAddress}`;
 return {
  get(){try{const raw=storage.getItem(key);if(raw===null)return null;if(raw.length>4096)throw invalid();return validate(JSON.parse(raw),scope);}catch{throw invalid();}},
  set(record){try{if(record===null){storage.removeItem(key);return;}storage.setItem(key,JSON.stringify(validate(record,scope)));}catch{throw invalid();}},
 };
}

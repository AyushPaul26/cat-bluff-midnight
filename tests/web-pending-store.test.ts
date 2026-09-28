import test from 'node:test';
import assert from 'node:assert/strict';
import { createPendingStore } from '../src/web/pending-store.ts';
import type { PendingRecord } from '../src/web/transaction.ts';
const scope={network:'preprod' as const,contractAddress:'c'.repeat(64)};
const record:PendingRecord={...scope,txId:'a'.repeat(64),expectedCommitment:'b'.repeat(64),claim:'7',timestamp:123,submission:'uncertain'};
function fixture(){const data=new Map<string,string>();return {data,storage:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}}};}
test('public pending record survives a new store and is isolated by contract',()=>{const f=fixture();createPendingStore(scope,f.storage).set(record);assert.deepEqual(createPendingStore(scope,f.storage).get(),record);assert.equal(createPendingStore({...scope,contractAddress:'d'.repeat(64)},f.storage).get(),null);});
test('store persists only allowlisted public fields',()=>{const f=fixture();createPendingStore(scope,f.storage).set({...record,secret:'must not store'} as PendingRecord);assert.equal([...f.data.values()][0].includes('secret'),false);});
test('corrupt storage remains present and blocks reads',()=>{const f=fixture();const store=createPendingStore(scope,f.storage);store.set(record);const key=[...f.data.keys()][0];f.data.set(key,'secret malformed');assert.throws(()=>store.get(),/pending record/i);assert.equal(f.data.get(key),'secret malformed');});
test('invalid claim and cross-contract records cannot be written',()=>{const f=fixture();const store=createPendingStore(scope,f.storage);assert.throws(()=>store.set({...record,claim:'14'}));assert.throws(()=>store.set({...record,contractAddress:'d'.repeat(64)}));assert.equal(f.data.size,0);});
test('storage write failure blocks submission instead of accepting an in-memory record',()=>{const store=createPendingStore(scope,{getItem:()=>null,setItem:()=>{throw Error('secret quota');},removeItem:()=>{throw Error('secret quota');}});assert.throws(()=>store.set(record),/public pending record/i);assert.throws(()=>store.set(null),/public pending record/i);});
test('storage access failure never masquerades as no pending transaction',()=>{const store=createPendingStore(scope,{getItem:()=>{throw Error('private browser');},setItem:()=>{},removeItem:()=>{}});assert.throws(()=>store.get(),/public pending record/i);});

import type { BrowserConfig } from './config.ts';
export type TransactionLock = <T>(config:BrowserConfig,action:()=>Promise<T>)=>Promise<T>;
export interface LockService {request<T>(name:string,options:LockOptions,callback:LockGrantedCallback<T>):Promise<T>}
export function transactionLock(service:LockService|undefined):TransactionLock {
 return async(config,action)=>{
  if(!service)throw new Error('This browser must support Web Locks before committing or reconciling transactions.');
  return service.request(`cat-bluff:transaction:${config.network}:${config.contractAddress}`,{mode:'exclusive',ifAvailable:true},async lock=>{
   if(!lock)throw new Error('Another tab is already handling this contract transaction.');
   return action();
  });
 };
}
export const browserTransactionLock:TransactionLock=(config,action)=>transactionLock(typeof navigator==='undefined'?undefined:navigator.locks)(config,action);

// Read-only verification of a built site. Never uploads local/private files.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
const origin=new URL(process.argv[2]??'http://127.0.0.1:4173');
if(origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/'||!['http:','https:'].includes(origin.protocol))throw Error('Use the public site origin only.');
const fetchPublic=async(path)=>{const response=await fetch(new URL(path,origin));if(!response.ok)throw Error(`Asset failed: ${path}`);return response;};
const manifest=await (await fetchPublic('/artifact-manifest.json')).json();
const deployment=await (await fetchPublic('/deployment.json')).json();
const receipt=JSON.parse(await readFile('docs/evidence/deployment.json','utf8'));
if(deployment.network!=='preprod'||deployment.status!=='SucceedEntirely'||deployment.contractAddress!==receipt.contractAddress)throw Error('Deployment metadata mismatch.');
const entries=Object.entries(manifest.files);
if(entries.length!==9)throw Error('Expected nine circuit artifacts.');
for(const [path,hash] of entries){
 if(!/^zk\/(keys\/(commit|challenge|resolve)\.(prover|verifier)|zkir\/(commit|challenge|resolve)\.bzkir)$/.test(path))throw Error('Unexpected asset path.');
 const response=await fetchPublic('/'+path);
 if(response.headers.get('content-type')?.includes('text/html'))throw Error('Circuit URL returned HTML.');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Circuit integrity mismatch.');
 if(!bytes.equals(await readFile('managed/cat-bluff/'+path.slice(3))))throw Error('Circuit differs from generated source.');
}
const wasmFiles=(await readdir('dist/assets')).filter(name=>name.endsWith('.wasm'));
if(wasmFiles.length===0)throw Error('Missing WASM build outputs.');
for(const name of wasmFiles){
 const response=await fetchPublic('/assets/'+name);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!response.headers.get('content-type')?.includes('application/wasm')||!bytes.equals(await readFile('dist/assets/'+name)))throw Error('WASM delivery mismatch.');
}
const svg=await (await fetchPublic('/cat-club.svg')).text();
if(!svg.includes('<svg')||/<script|<image|https?:/.test(svg.replace('http://www.w3.org/2000/svg','')))throw Error('Unexpected illustration content.');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),origin:origin.origin,network:deployment.network,contractAddress:deployment.contractAddress,circuitArtifacts:entries.length,wasmFiles:wasmFiles.length,artwork:'verified',result:'PASS',scope:'Public assets only; not wallet or proof verification'},null,2));

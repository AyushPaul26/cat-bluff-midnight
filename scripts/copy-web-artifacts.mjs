import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function copyWebArtifacts(root, output) {
  const receipt = JSON.parse(await readFile(join(root,'docs/evidence/deployment.json'),'utf8'));
  if (receipt.network !== 'preprod' || receipt.status !== 'SucceedEntirely' || !/^[0-9a-f]{64}$/.test(receipt.contractAddress)) throw new Error('A verified Preprod deployment receipt is required.');
  const files = {};
  for (const circuit of ['commit','challenge','resolve']) {
    for (const relative of [`keys/${circuit}.prover`,`keys/${circuit}.verifier`,`zkir/${circuit}.bzkir`]) {
      const bytes = await readFile(join(root,'managed/cat-bluff',relative));
      if (!bytes.length) throw new Error('A required generated artifact is empty.');
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (relative.endsWith('.verifier') && hash !== receipt.verifierSha256[circuit]) throw new Error('Generated verifier differs from confirmed deployment.');
      const target = join(output,'zk',relative);
      await mkdir(dirname(target),{recursive:true});
      await writeFile(target,bytes);
      files[`zk/${relative}`] = hash;
    }
  }
  await writeFile(join(output,'artifact-manifest.json'),JSON.stringify({version:1,files},null,2)+'\n');
  await writeFile(join(output,'deployment.json'),JSON.stringify({network:receipt.network,contractAddress:receipt.contractAddress,status:receipt.status,verifierSha256:receipt.verifierSha256},null,2)+'\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
  await copyWebArtifacts(root,join(root,'public'));
  console.log('Prepared 9 genuine public circuit artifacts and deployment metadata.');
}

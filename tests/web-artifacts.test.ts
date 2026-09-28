import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { copyWebArtifacts } from '../scripts/copy-web-artifacts.mjs';

test('hosting assets contain the actual binary circuits and keys with a verifiable manifest', async () => {
  const out = await mkdtemp(join(tmpdir(),'cat-bluff-assets-'));
  try {
    await copyWebArtifacts(process.cwd(),out);
    const manifest = JSON.parse(await readFile(join(out,'artifact-manifest.json'),'utf8'));
    assert.equal(Object.keys(manifest.files).length,9);
    for (const [path,hash] of Object.entries(manifest.files)) {
      assert.match(path,/^zk\/(keys\/(commit|challenge|resolve)\.(prover|verifier)|zkir\/(commit|challenge|resolve)\.bzkir)$/);
      assert.equal(createHash('sha256').update(await readFile(join(out,path))).digest('hex'),hash);
    }
    const deployment = JSON.parse(await readFile(join(out,'deployment.json'),'utf8'));
    assert.equal(deployment.network,'preprod');
    assert.equal(deployment.contractAddress,JSON.parse(await readFile('docs/evidence/deployment.json','utf8')).contractAddress);
    assert.equal(deployment.status,'SucceedEntirely');
    assert.deepEqual(Object.keys(deployment).sort(),['contractAddress','network','status','verifierSha256']);
  } finally { await rm(out,{recursive:true,force:true}); }
});

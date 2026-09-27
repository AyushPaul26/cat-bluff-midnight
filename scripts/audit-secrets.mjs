import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
let secrets = [];
try {
  const saved = JSON.parse(readFileSync('.private/local.json', 'utf8'));
  secrets = ['seed', 'storagePassword', 'playerSecret', 'challengerSecret', 'salt']
    .map(key => saved[key]).filter(value => typeof value === 'string' && value.length >= 32);
} catch (error) {
  if (error.code !== 'ENOENT') throw new Error('Unable to inspect local secret configuration safely');
}
const files = git('ls-files', '-z').toString().split('\0').filter(Boolean);
if (files.some(name => /(^|\/)(\.private|\.tools|\.cache|node_modules)(\/|$)|\.env($|\.)|\.(seed|mnemonic)$/.test(name))) {
  throw new Error('A private/tool directory or secret file is tracked');
}
const objects = git('rev-list', '--objects', '--all').toString().trim().split('\n');
const blobIds = new Set(objects.map(line => line.split(' ')[0]).filter(Boolean));
let checked = 0;
function inspect(data, label) {
  for (const secret of secrets) {
    if (data.includes(Buffer.from(secret))) throw new Error(`Known local secret found in ${label}`);
    if (/^[a-f0-9]{64}$/.test(secret) && data.includes(Buffer.from(secret, 'hex'))) {
      throw new Error(`Known binary secret found in ${label}`);
    }
  }
  if (/github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(data.toString())) {
    throw new Error(`Credential pattern found in ${label}`);
  }
}
for (const name of files) inspect(git('show', `:${name}`), 'staged file ' + name);
for (const oid of blobIds) {
  if (git('cat-file', '-t', oid).toString().trim() !== 'blob') continue;
  inspect(git('cat-file', '-p', oid), 'history blob ' + oid);
  checked++;
}
console.log(`Secret audit passed: ${files.length} staged files and ${checked} historical blobs checked; ${secrets.length} local secrets checked without printing them.`);

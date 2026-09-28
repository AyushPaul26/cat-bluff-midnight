#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/env.sh
# Avoid chmod/symlink failures on this Windows-hosted WSL project. Pinning is
# enforced by npm ci; native package checks are run explicitly without .bin.
# npm 10's optional-peer resolver failed for the browser test stack. Keep the
# compatible npm 11 resolver project-local; do not change a global installation.
if [ ! -f .tools/npm-bootstrap/node_modules/npm/bin/npm-cli.js ]; then
  npm install --prefix .tools/npm-bootstrap npm@11.11.1 --no-save --ignore-scripts
fi
node .tools/npm-bootstrap/node_modules/npm/bin/npm-cli.js ci --ignore-scripts
for package in classic-level bufferutil utf-8-validate; do
  if [ -d "node_modules/$package" ]; then
    (cd "node_modules/$package" && node ../node-gyp-build/build-test.js)
  fi
done

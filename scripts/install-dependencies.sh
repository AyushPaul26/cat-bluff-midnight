#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
source scripts/env.sh
# Avoid chmod/symlink failures on this Windows-hosted WSL project. Pinning is
# enforced by npm ci; native package checks are run explicitly without .bin.
npm ci --ignore-scripts
for package in classic-level bufferutil utf-8-validate; do
  if [ -d "node_modules/$package" ]; then
    (cd "node_modules/$package" && node ../node-gyp-build/build-test.js)
  fi
done

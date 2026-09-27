#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
mkdir -p .tools/bin .tools/downloads
curl --proto '=https' --tlsv1.2 -fsSL https://github.com/midnightntwrk/compact/releases/download/compact-v0.5.1/compact-installer.sh -o .tools/downloads/compact-installer.sh
COMPACT_UNMANAGED_INSTALL="$PWD/.tools/bin" sh .tools/downloads/compact-installer.sh
node_version=22.22.0
node_archive="node-v${node_version}-linux-x64.tar.xz"
curl --proto '=https' --tlsv1.2 -fsSL "https://nodejs.org/dist/v${node_version}/${node_archive}" -o ".tools/downloads/${node_archive}"
curl --proto '=https' --tlsv1.2 -fsSL "https://nodejs.org/dist/v${node_version}/SHASUMS256.txt" -o .tools/downloads/SHASUMS256.txt
(cd .tools/downloads && grep " ${node_archive}$" SHASUMS256.txt | sha256sum --check -)
python3 scripts/extract-tools.py node ".tools/downloads/${node_archive}"
compiler_archive=compactc_v0.31.1_x86_64-unknown-linux-musl.zip
curl --proto '=https' --tlsv1.2 -fsSL "https://github.com/midnightntwrk/compact/releases/download/compactc-v0.31.1/${compiler_archive}" -o ".tools/downloads/${compiler_archive}"
python3 scripts/extract-tools.py compiler ".tools/downloads/${compiler_archive}"
source scripts/env.sh
.tools/bin/compact --version
compact compile +0.31.1 --version
.tools/node-v22.22.0-linux-x64/bin/node --version

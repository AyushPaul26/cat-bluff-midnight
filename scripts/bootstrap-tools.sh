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
tar -xmJf ".tools/downloads/${node_archive}" -C .tools --no-same-owner --no-same-permissions --no-overwrite-dir \
  "node-v${node_version}-linux-x64/bin" "node-v${node_version}-linux-x64/lib" \
  "node-v${node_version}-linux-x64/LICENSE" "node-v${node_version}-linux-x64/README.md"
.tools/bin/compact --version
.tools/bin/compact --help
.tools/node-v22.22.0-linux-x64/bin/node --version

#!/usr/bin/env bash
# Source from the project root before using the project-local toolchain.
export PATH="$PWD/.tools/node-v22.22.0-linux-x64/bin:$PWD/.tools/bin:$PWD/.tools/ubuntu/usr/bin:$PATH"
export COMPACT_DIRECTORY="$PWD/.tools/compact"
export npm_config_cache="$PWD/.cache/npm"

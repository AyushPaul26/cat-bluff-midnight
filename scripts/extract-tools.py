"""Extract official tools without changing existing Windows mount file metadata."""
import os
from pathlib import Path
import shutil
import sys
import tarfile
import zipfile

kind, archive = sys.argv[1:]
root = Path('.tools').resolve()
if kind == 'compiler':
    root /= 'compact/versions/0.31.1/x86_64-unknown-linux-musl'
root.mkdir(parents=True, exist_ok=True)

def destination(name):
    target = root / name
    if not target.resolve().is_relative_to(root):
        raise ValueError('Unsafe archive path')
    target.parent.mkdir(parents=True, exist_ok=True)
    return target

def copy(source, name, mode):
    target = destination(name)
    with source, target.open('wb') as output:
        shutil.copyfileobj(source, output)
    # DrvFS files are already executable and reject chmod in this environment.
    if mode & 0o111 and not os.access(target, os.X_OK):
        target.chmod(0o755)

if kind == 'node':
    with tarfile.open(archive) as bundle:
        for member in bundle:
            if member.isfile():
                copy(bundle.extractfile(member), member.name, member.mode)
    # npm/npx archive symlinks are unnecessary; wrappers work on DrvFS too.
    for command in ('npm', 'npx'):
        target = destination(f'node-v22.22.0-linux-x64/bin/{command}')
        if target.is_symlink():
            target.unlink()
        target.write_text('#!/usr/bin/env bash\nexec node "$(dirname -- "$0")/../lib/node_modules/npm/bin/' + command + '-cli.js" "$@"\n')
        if not os.access(target, os.X_OK):
            target.chmod(0o755)
elif kind == 'compiler':
    with zipfile.ZipFile(archive) as bundle:
        for member in bundle.infolist():
            if not member.is_dir():
                copy(bundle.open(member), member.filename, member.external_attr >> 16)
    launcher = root / 'compactc'
    content = launcher.read_text()
    content = content.replace('$(cd $(dirname $0) ; pwd -P)', '$(cd -- "$(dirname -- "$0")" && pwd -P)')
    launcher.write_text(content)
else:
    raise ValueError('Unknown tool archive')

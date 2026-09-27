"""Run the real compiler in a fresh directory, then copy its unmodified output.

Compact 0.31.1 chmods old output directories while replacing them. WSL's Windows
mount can reject that operation. Fresh output avoids changing mount permissions.
"""
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
(root / '.tools').mkdir(exist_ok=True)
output = Path(tempfile.mkdtemp(prefix='build-', dir=root / '.tools')) / 'cat-bluff'
subprocess.run(['compact', 'compile', '+0.31.1', '--sourceRoot', '../../../contracts',
                str(root / 'contracts/cat-bluff.compact'), str(output)], check=True)
destination = root / 'managed/cat-bluff'
for source in output.rglob('*'):
    if source.is_file():
        target = destination / source.relative_to(output)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
for circuit in sorted((destination / 'zkir').glob('*.zkir')):
    for suffix in ['prover', 'verifier']:
        key = destination / 'keys' / f'{circuit.stem}.{suffix}'
        if not key.is_file() or key.stat().st_size == 0:
            raise RuntimeError(f'Missing generated key: {key}')
    print(f'Generated circuit: {circuit.stem} (prover and verifier keys present)', flush=True)
print('Compact compilation and generated-artifact checks succeeded.', flush=True)

"""Package the committed source with a checksum and exact commit identity."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT.parent / 'casework-release')
    args = parser.parse_args()
    changed = subprocess.check_output(['git','status','--porcelain'], cwd=ROOT, text=True).strip()
    if changed:
        parser.error('Commit or stash changes before packaging; the artifact must match the commit.')
    version = (ROOT / 'VERSION').read_text().strip()
    revision = subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT, text=True).strip()
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error('Write release artifacts outside the source repository.')
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f'casework-{version}.zip'
    subprocess.run(['git','archive','--format=zip','--prefix=casework/',f'--output={archive}','HEAD'], cwd=ROOT, check=True)
    manifest = output / 'SOURCE.json'
    manifest.write_text(json.dumps({'version':version, 'commit':revision, 'stage':'synthetic-data developer preview'}, indent=2)+'\n')
    sums = output / 'SHA256SUMS'
    sums.write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n' for path in (archive, manifest)))
    print(f'{archive}\n{manifest}\n{sums}\nSource commit: {revision}')


if __name__ == '__main__':
    main()

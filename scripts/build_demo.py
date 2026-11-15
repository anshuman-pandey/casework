"""Build the public browser sandbox from the same interface and Python sample fixtures."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from casework.demo import SCENARIOS,sample_alert
from casework.__main__ import seed
from casework.store import Store


def build(output):
    output.mkdir(parents=True,exist_ok=True)
    for path in (ROOT/'casework/web').rglob('*'):
        if path.is_file():
            dest=output/path.relative_to(ROOT/'casework/web');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,dest)
    templates={}
    for item in SCENARIOS:
        payload=sample_alert(item['id']);payload.pop('source_id')
        for record in payload['evidence']:
            record.pop('observed_at');record['offset_ms']=(-48*3600000 if item['id']=='stale-evidence' else 3600000 if item['id']=='future-evidence' else 0) if record['kind']=='screening' else 0
        templates[item['id']]=payload
    with tempfile.TemporaryDirectory() as tmp:
        store=Store(Path(tmp)/'seed.db');seed(store)
        seeds=[]
        for row in store.list():
            c=store.get(row['id']);payload={k:c[k] for k in ('subject','title','category','risk')}
            payload['evidence']=[{k:v for k,v in e.items() if k not in ('id','sha256','observed_at')} for e in c['evidence']];seeds.append(payload)
    version=(ROOT/'VERSION').read_text().strip()
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    (output/'demo-data.js').write_text('globalThis.CASEWORK_DEMO_FIXTURES = '+json.dumps({'scenarios':SCENARIOS,'templates':templates,'seeds':seeds,'version':version})+';\n')
    (output/'build-info.json').write_text(json.dumps({'version':version,'source_commit':commit,'mode':'browser-sandbox'},indent=2)+'\n')
    html=(output/'index.html').read_text().replace('<script src="/version.js" defer></script>','<script src="/demo-data.js" defer></script><script src="/demo-store.js" defer></script><script src="/demo-browser.js" defer></script><script src="/version.js" defer></script>')
    html=html.replace('</title>', '</title><meta name="description" content="Try a fraud and AML investigation in a private browser sandbox. Inspect evidence, record a decision, export the history, then self-host Casework.">')
    (output/'index.html').write_text(html)
    (output/'_headers').write_text("/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Content-Type-Options: nosniff\n")
    print(f'Built browser sandbox {version}: {output}')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,default=ROOT/'dist');build(parser.parse_args().output.resolve())

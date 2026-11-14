"""Execute the shipped n8n workflow against an isolated synthetic Casework server."""
import json
from pathlib import Path
import subprocess
import time
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
N8N = 'n8nio/n8n:2.47.7'


def main():
    suffix = uuid4().hex[:10]
    case = 'casework-n8n-' + suffix
    volume = case + '-state'
    runner = case + '-runner'
    image = case + ':test'
    def docker(*args, check=True):
        result = subprocess.run(['docker', *args], cwd=ROOT, capture_output=True, text=True)
        if check and result.returncode:
            raise RuntimeError(result.stdout[-5000:] + result.stderr[-5000:])
        return result.stdout
    def read(path):
        return json.loads(docker('exec', case, 'python3', '-c',
            'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8080' + path + '").read().decode())'))
    def n8n(*args):
        return docker('run', '--rm', '--name', runner, '--network', 'container:' + case,
            '-v', volume + ':/home/node/.n8n',
            '-v', str(ROOT / 'examples/n8n/synthetic-alert.json') + ':/workflow.json:ro',
            '-e', 'N8N_DIAGNOSTICS_ENABLED=false', '-e', 'N8N_VERSION_NOTIFICATIONS_ENABLED=false',
            '-e', 'N8N_TEMPLATES_ENABLED=false', N8N, *args)
    try:
        docker('build', '-t', image, '.')
        docker('run', '-d', '--name', case, image, 'python3', '-m', 'casework',
            '--host', '127.0.0.1', '--empty', '--db', '/data/casework.db')
        for attempt in range(30):
            try:
                read('/api/health')
                break
            except RuntimeError:
                if attempt == 29: raise
                time.sleep(0.2)
        docker('volume', 'create', volume)
        print('Importing workflow into n8n 2.47.7…', flush=True)
        n8n('import:workflow', '--input=/workflow.json')
        print('Executing workflow…', flush=True)
        output = n8n('execute', '--id=caseworkSyntheticImport', '--rawOutput')
        # CLI includes startup logs before the execution JSON.
        result = None
        for offset, char in enumerate(output):
            if char != '{': continue
            try:
                candidate, _ = json.JSONDecoder().raw_decode(output[offset:])
                if isinstance(candidate, dict) and 'data' in candidate:
                    result = candidate; break
            except ValueError:
                continue
        if result is None: raise AssertionError('No execution JSON: ' + output[-4000:])
        data = result['data']['resultData']
        assert not data.get('error'), data.get('error')
        runs = data['runData']
        def node(name): return runs[name][0]['data']['main'][0][0]['json']
        first, replay, exported = node('Create case'), node('Replay same alert'), node('Read case record')
        assert first['created'] is True and replay['created'] is False
        assert first['id'] == replay['id'] == exported['id']
        cases = read('/api/cases')['cases']
        assert len(cases) == 1
        record = read('/api/cases/' + first['id'] + '/export')
        assert record == exported and len(record['evidence']) == 3
        assert record['status'] == 'open' and [e['kind'] for e in record['events']] == ['ingested']
        print('PASS: real n8n execution, create + replay share one case ID, three evidence records, exact exported record, no automated decision.')
    finally:
        docker('rm', '-f', runner, check=False)
        docker('rm', '-f', case, check=False)
        docker('volume', 'rm', volume, check=False)
        docker('image', 'rm', image, check=False)


if __name__ == '__main__':
    main()

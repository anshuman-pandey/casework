"""Build, exercise and recreate an isolated Compose workspace; leave user volumes alone."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
from urllib.request import urlopen
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from casework.verify import verify


def main():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    project = 'casework-check-' + uuid4().hex[:8]
    env = {**os.environ, 'CASEWORK_PORT':str(port)}
    def compose(*args):
        subprocess.run(['docker','compose','-p',project,*args], cwd=ROOT, env=env, check=True)
    def get(path):
        with urlopen(f'http://127.0.0.1:{port}{path}', timeout=10) as response:
            return json.load(response)
    try:
        compose('up','-d','--build','--wait','--wait-timeout','60')
        verify(f'http://127.0.0.1:{port}')
        before = {case['id']:get('/api/cases/'+case['id']+'/export') for case in get('/api/cases')['cases']}
        compose('down')
        compose('up','-d','--wait','--wait-timeout','60')
        after = {case['id']:get('/api/cases/'+case['id']+'/export') for case in get('/api/cases')['cases']}
        if before != after:
            raise RuntimeError('Case records changed or disappeared across container recreation')
        compose('exec','-T','casework','python3','-c','import os; assert os.getuid() == 10001; print("PASS non-root application user")')
        print(f'PASS Docker health, 6 scenarios, full record persistence across recreation ({len(after)} cases).')
    finally:
        # Only the uniquely named project created by this check is removed.
        compose('down','--volumes')


if __name__ == '__main__':
    main()

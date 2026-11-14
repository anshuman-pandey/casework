import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from casework.demo import SCENARIOS, create_scenario, sample_alert
from casework.store import Store, evaluate


class DemoTests(unittest.TestCase):
    def test_scenarios_isolate_the_documented_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            store = Store(Path(directory) / 'scenarios.db')
            for item in SCENARIOS:
                with self.subTest(scenario=item['id']):
                    case = create_scenario(store, item['id'])
                    self.assertEqual([c['passed'] for c in evaluate(case)['checks']], item['checks'])
                    self.assertEqual(case['status'], 'closed' if item['id']=='history' else 'open')
                    if item['id']=='history':
                        self.assertEqual([e['kind'] for e in case['events']], ['ingested','policy_evaluated','close'])

    def test_repeated_practice_preserves_prior_work(self):
        with tempfile.TemporaryDirectory() as directory:
            store = Store(Path(directory) / 'repeat.db')
            first = create_scenario(store, 'ready')
            store.run_policy(first['id'])
            closed = store.decide(first['id'], {'action':'close','version':1,'reason':'Keep this prior work'})
            second = create_scenario(store, 'ready')
            self.assertNotEqual(first['id'], second['id'])
            self.assertEqual(store.get(first['id']), closed)
            self.assertEqual(len(store.list()), 2)

    def test_invalid_scenario_makes_no_case(self):
        with tempfile.TemporaryDirectory() as directory:
            store = Store(Path(directory) / 'empty.db')
            with self.assertRaises(ValueError):
                create_scenario(store, '../../unknown')
            self.assertEqual(store.list(), [])

    def test_generator_is_valid_json_with_fresh_evidence(self):
        import json
        output = subprocess.check_output([sys.executable,'-m','casework.demo','ready'], text=True)
        data = json.loads(output)
        self.assertEqual(len(data['evidence']), 3)
        self.assertNotEqual(data['source_id'], sample_alert()['source_id'])

    def test_disposable_mode_cleans_up_without_changing_existing_database(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            sentinel = root / 'casework.db'
            sentinel.write_bytes(b'pre-existing data must stay untouched')
            env = {**os.environ, 'PYTHONPATH':str(Path(__file__).resolve().parents[1]), 'TMPDIR':directory}
            process = subprocess.Popen([sys.executable,'-u','-m','casework','--demo','--port','0'], cwd=directory, env=env,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                from urllib.request import urlopen
                import json, re
                line = process.stdout.readline()
                base = re.search(r'http://127\.0\.0\.1:\d+', line).group()
                with urlopen(base+'/api/health', timeout=5) as response:
                    self.assertEqual(json.load(response)['storage'], 'temporary')
                with urlopen(base+'/api/cases', timeout=5) as response:
                    self.assertEqual(len(json.load(response)['cases']), 6)
            finally:
                process.terminate()
                process.communicate(timeout=10)
            self.assertEqual(process.returncode, 0)
            self.assertEqual(sentinel.read_bytes(), b'pre-existing data must stay untouched')
            self.assertEqual(list(root.glob('casework-demo-*')), [])

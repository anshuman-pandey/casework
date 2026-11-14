"""Exercise the implemented API against a running synthetic workspace."""
import argparse
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from .demo import SCENARIOS, sample_alert


def verify(base):
    checks = 0
    def request(path, data=None):
        req = Request(base + path, data=json.dumps(data).encode() if data is not None else None,
                      headers={"Content-Type": "application/json"})
        try:
            with urlopen(req, timeout=10) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)
    def expect(condition, message):
        nonlocal checks
        if not condition:
            raise RuntimeError(message)
        checks += 1

    expect(request('/api/health')[0] == 200, 'Server health failed')
    for item in SCENARIOS:
        status, case = request('/api/demo/scenarios/' + item['id'], {})
        expect(status == 201, f"Could not create {item['id']}: {case}")
        prefix = '/api/cases/' + case['id']
        if item['id'] == 'history':
            expect(case['status'] == 'closed' and len(case['events']) == 3, 'History fixture is incomplete')
            status, case = request(prefix + '/decisions', {'action':'reopen', 'version':case['version'], 'reason':'Synthetic API walkthrough: reopen the prior decision.'})
            expect(status == 200 and case['status'] == 'open', 'History case did not reopen')
            expect(request(prefix + '/decisions', {'action':'close', 'version':case['version'], 'reason':'Old evaluation must not authorize this.'})[0] == 409, 'Reopen reused an old evaluation')
        status, result = request(prefix + '/evaluate', {})
        expect(status == 200 and [c['passed'] for c in result['checks']] == item['checks'], f"Unexpected checks for {item['id']}")
        decision = {'action':'close', 'version':case['version'], 'reason':'Synthetic API walkthrough: reviewed the sample source records.'}
        status, result = request(prefix + '/decisions', decision)
        if all(item['checks']):
            expect(status == 200 and result['status'] == 'closed', 'Eligible case did not close')
            exported_status, exported = request(prefix + '/export')
            expect(exported_status == 200 and exported == result and exported['events'][-1]['payload']['reason'] == decision['reason'], 'Export lost the decision or evidence')
            expect(request(prefix + '/decisions', decision)[0] == 409, 'Stale decision version was accepted')
        else:
            expect(status == 409, 'Blocked scenario allowed closure')
            status, result = request(prefix + '/decisions', {**decision, 'action':'escalate'})
            expect(status == 200 and result['status'] == 'escalated', 'Blocked case could not escalate')
        print(f"PASS {item['id']}: {item['outcome']}")
    alert = sample_alert()
    status, created = request('/api/alerts', alert)
    expect(status == 201, 'Alert import failed')
    status, replayed = request('/api/alerts', alert)
    expect(status == 200 and replayed['id'] == created['id'] and not replayed['created'], 'Replay duplicated the alert')
    expect(request('/api/alerts', {**alert, 'risk':90})[0] == 409, 'Conflicting source replay was accepted')
    expect(request('/api/alerts', {**alert, 'risk':True})[0] == 400, 'Invalid payload was accepted')
    print(f"PASS {checks} checks. Added 7 synthetic cases; existing cases were left untouched.")
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:8080')
    args = parser.parse_args()
    parsed = urlparse(args.url)
    if parsed.scheme != 'http' or parsed.hostname not in ('127.0.0.1', 'localhost') or parsed.path not in ('', '/') or parsed.query or parsed.fragment or parsed.username:
        parser.error('Use the local HTTP URL or the localhost end of an SSH tunnel')
    try:
        verify(args.url.rstrip('/'))
    except (URLError, RuntimeError, ValueError, KeyError) as error:
        parser.exit(1, f"Verification failed: {error}\nStart Casework and check --url.\n")


if __name__ == '__main__':
    main()

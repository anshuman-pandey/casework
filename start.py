"""Start Casework from any folder: python3 /path/to/casework/start.py."""
import argparse
import subprocess
import sys
from pathlib import Path


def main():
    if sys.version_info < (3, 12):
        print('Casework needs Python 3.12 or newer. Install it from https://www.python.org/downloads/')
        return 1
    parser = argparse.ArgumentParser(description='Open a Casework practice workspace. No folder changes needed.')
    parser.add_argument('--keep', action='store_true', help='Keep records in casework.db beside this launcher')
    parser.add_argument('--no-browser', action='store_true', help='Print the URL without opening a browser')
    parser.add_argument('--port', type=int, default=0, help='Port to use; default chooses a free port')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    command = [sys.executable, '-m', 'casework', '--port', str(args.port)]
    command += ['--db', str(root / 'casework.db')] if args.keep else ['--demo']
    if not args.no_browser:
        command.append('--open')
    print('Starting Casework. Keep this window open. Press Ctrl+C here to stop.', flush=True)
    try:
        return subprocess.call(command, cwd=root)
    except KeyboardInterrupt:
        return 0


if __name__ == '__main__':
    sys.exit(main())

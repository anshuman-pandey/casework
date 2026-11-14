#!/bin/sh
CASEWORK_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Install Python 3.12 or newer from https://www.python.org/downloads/'
  echo 'Then launch Casework again.'
else
  python3 "$CASEWORK_DIR/start.py" "$@"
fi
printf '\nPress Enter to close this window. '
read -r answer

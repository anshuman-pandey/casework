@echo off
setlocal
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "%~dp0start.py" %*
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Install Python 3.12 or newer from https://www.python.org/downloads/
    echo Then double-click this file again.
  ) else (
    python "%~dp0start.py" %*
  )
)
pause

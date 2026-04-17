@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git not found in PATH.
  exit /b 1
)

where gh >nul 2>nul
if errorlevel 1 (
  echo [ERROR] GitHub CLI ^(gh^) not found in PATH.
  exit /b 1
)

gh auth status >nul 2>nul
if errorlevel 1 (
  echo [ERROR] gh is not authenticated. Run: gh auth login
  exit /b 1
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Remote "origin" is not configured.
  exit /b 1
)

git add -A

set "HAS_CHANGES="
for /f %%i in ('git diff --cached --name-only') do set HAS_CHANGES=1

if defined HAS_CHANGES (
  set "MSG=%*"
  if "%MSG%"=="" set "MSG=chore: deploy update"
  git commit -m "%MSG%"
) else (
  echo No staged changes. Pushing current branch...
)

git push -u origin main
if errorlevel 1 exit /b 1

echo Deploy command finished. GitHub Actions will publish Pages.
exit /b 0

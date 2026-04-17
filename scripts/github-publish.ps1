# Публикация на GitHub: нужен GitHub CLI (gh) и токен.
# Использование:
#   $env:GH_TOKEN = "ghp_xxxxxxxx"   # classic PAT с scope repo
#   .\scripts\github-publish.ps1
# Или один раз: gh auth login

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "Установите GitHub CLI: winget install GitHub.cli"
}

if (-not (gh auth status 2>$null)) {
  if ($env:GH_TOKEN) {
    $env:GH_TOKEN | gh auth login --with-token -h github.com
  } else {
    Write-Host "Выполните: gh auth login   или задайте `$env:GH_TOKEN и повторите."
    exit 1
  }
}

if (-not (git remote get-url origin 2>$null)) {
  gh repo create workflow-automator --public --source=. --remote=origin --push
} else {
  git push -u origin main
}

Write-Host "Готово. В репозитории: Settings → Pages → Source: GitHub Actions."

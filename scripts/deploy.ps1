# One-command deploy:
#   npm run deploy
# or with message:
#   powershell -ExecutionPolicy Bypass -File .\scripts\deploy.ps1 -Message "feat: update ui"

param(
  [string]$Message
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git не найден. Установите Git for Windows."
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI не найден. Установите: winget install GitHub.cli"
}

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  if ($env:GH_TOKEN) {
    $env:GH_TOKEN | gh auth login --with-token -h github.com
  } else {
    Write-Error "Не выполнен вход в gh. Выполните: gh auth login"
  }
}

$branch = "main"
$remote = "origin"

if (-not (git remote get-url $remote 2>$null)) {
  Write-Error "Remote '$remote' не настроен. Сначала свяжите репозиторий с GitHub."
}

git add -A

$hasChanges = (git diff --cached --name-only) -ne $null -and (git diff --cached --name-only).Length -gt 0
if ($hasChanges) {
  if ([string]::IsNullOrWhiteSpace($Message)) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "chore: deploy update ($stamp)"
  }

  git commit -m $Message | Out-Host
} else {
  Write-Host "Изменений для коммита нет — выполняю push текущей ветки."
}

git push -u $remote $branch | Out-Host

Write-Host "Деплой отправлен. GitHub Actions соберет Pages автоматически."

# WorkflowAutomator

Веб-приложение для автоматизации рабочих процессов: пространства, Kanban-доски, задачи с дедлайнами и отчётами. Данные хранятся в **LocalStorage** через **Redux** (демо без backend).

## Стек

- React 18, Vite, TypeScript  
- Redux Toolkit, React Router 7  
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (совместим с React 18; API как у `react-beautiful-dnd`)  
- Tailwind CSS, Lucide React, react-hot-toast, date-fns, react-dropzone  

## Запуск

Требуется Node.js 18+ и npm.

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
npm run preview
```

One-command деплой в `main` (коммит + push, без интерактива):

```powershell
npm run deploy
```

Короткий алиас из корня проекта:

```powershell
.\deploy
```

С сообщением коммита (одной командой):

```powershell
npm run deploy -- "feat: update board ui"
```

## Демо-аккаунты

После первого запуска доступны пользователи из сида:

| Email            | Пароль | Роль  |
|------------------|--------|-------|
| admin@demo.local | admin  | admin |
| user@demo.local  | user   | user  |

Также можно зарегистрировать нового пользователя с выбором роли.

## Репозиторий и деплой (GitHub + Pages)

Репозиторий по умолчанию: **`workflow-automator`**. Сборка для Pages использует `base=/workflow-automator/` (см. `npm run build:gh`).

### 1. Вход в GitHub CLI

Установите [GitHub CLI](https://cli.github.com/) (`winget install GitHub.cli`), затем в каталоге проекта:

```powershell
gh auth login
```

Либо без интерактива (нужен [Personal Access Token](https://github.com/settings/tokens) с правом **repo**):

```powershell
$env:GH_TOKEN = "ghp_ВАШ_ТОКЕН"
$env:GH_TOKEN | gh auth login --with-token -h github.com
```

### 2. Создать репозиторий и запушить код

```powershell
cd d:\Project
gh repo create workflow-automator --public --source=. --remote=origin --push
```

Если репозиторий уже создан вручную:

```powershell
git remote add origin https://github.com/<ваш-логин>/workflow-automator.git
git push -u origin main
```

Автоматический вариант: скрипт [scripts/github-publish.ps1](./scripts/github-publish.ps1) (после `gh auth` или `$env:GH_TOKEN`).

### 3. Включить GitHub Pages (один раз)

В репозитории на GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

После пуша в `main` сработает workflow [.github/workflows/deploy-pages.yml](./.github/workflows/deploy-pages.yml): сборка `npm run build:gh`, копия `index.html` в `404.html` для SPA, публикация артефакта.

Сайт будет доступен по адресу:

`https://<ваш-логин>.github.io/workflow-automator/`

Если имя репозитория другое — измените `--base=/ИМЯ_РЕПО/` в `package.json` (`build:gh`) и в workflow при необходимости.

## Структура

- `src/store` — слайсы (`auth`, `users`, `spaces`, `boards`, `tasks`) и персистентность в LocalStorage  
- `src/pages` — логин, пространства, детали пространства, доска  
- `src/components/board` — колонки Kanban, карточки, модалки задачи и отчёта  

## Лицензия

MIT

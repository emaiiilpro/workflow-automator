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

## Демо-аккаунты

После первого запуска доступны пользователи из сида:

| Email            | Пароль | Роль  |
|------------------|--------|-------|
| admin@demo.local | admin  | admin |
| user@demo.local  | user   | user  |

Также можно зарегистрировать нового пользователя с выбором роли.

## GitHub Pages

1. В [vite.config.ts](./vite.config.ts) при необходимости задайте `base` под имя репозитория (по умолчанию для скрипта ниже используется `/workflow-automator/`).

2. Соберите проект:

   ```bash
   npm run build:gh
   ```

3. Включите **GitHub Pages** из ветки `gh-pages` или из **GitHub Actions** (артефакт из `dist/`).

Пример деплоя веткой `gh-pages` с [gh-pages](https://www.npmjs.com/package/gh-pages):

```bash
npm install -D gh-pages
npx gh-pages -d dist
```

Для репозитория `https://github.com/<user>/workflow-automator` сайт будет по адресу:

`https://<user>.github.io/workflow-automator/`

Убедитесь, что `npm run build:gh` выставляет `--base=/workflow-automator/` (уже настроено в `package.json`).

## Структура

- `src/store` — слайсы (`auth`, `users`, `spaces`, `boards`, `tasks`) и персистентность в LocalStorage  
- `src/pages` — логин, пространства, детали пространства, доска  
- `src/components/board` — колонки Kanban, карточки, модалки задачи и отчёта  

## Лицензия

MIT

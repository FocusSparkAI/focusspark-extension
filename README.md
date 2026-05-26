# FocusSpark Extension

FocusSpark Extension is the Chrome extension frontend for the FocusSpark study workspace. It contains the extension app shell, dashboard, AI tutor workspace, focus tools, Pomodoro behavior, quizzes, flashcards, and the MV3 background service worker.

Website-only pages such as the public landing pages, Science page, profile, and long-form settings live in `FocusSpark-Frontend`.

## What Is In This Repo

- Chrome Extension Manifest V3 setup
- React app mounted inside the extension page
- Background service worker for extension actions and focus-session behavior
- Sign in and sign up screens
- Student dashboard and study workspace
- AI chat workspace and chat history
- Flashcards and quiz flows
- Focus tools, webcam test screens, and Pomodoro/focus context
- Extension bell dropdown that respects the web settings value `notifications_enabled`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Chrome Extension Manifest V3
- Chrome storage, tabs, and notifications APIs
- Axios
- Radix UI
- Lucide React
- Motion
- Recharts
- Sonner

## Project Structure

```text
FocusSpark-Extension/
  public/
    manifest.json       # Chrome extension manifest
    background.js       # MV3 service worker
    icons/              # Extension icons
  src/
    main.tsx
    extension/App.tsx   # App shell and page switching
    config/             # Backend and frontend route config
    context/            # Focus and Pomodoro providers
    components/         # Shared UI and layout components
    pages/              # Study, auth, dashboard, and tool pages
    features/           # Pomodoro and focus features
    utils/              # Backend and AI clients
  build/                # Production extension output
```

## Requirements

- Node.js
- npm
- Google Chrome or another Chromium-based browser
- FocusSpark backend available at `http://127.0.0.1:8000`
- FocusSpark web frontend available at `http://localhost:3000` for web-only routes

## Environment

Create a `.env` file in this project root when you need to override the defaults:

```env
VITE_BACKEND_BASE_URL=http://127.0.0.1:8000
VITE_FRONTEND_BASE_URL=http://localhost:3000
```

The extension falls back to those same local URLs when the variables are not set.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The compiled extension is written to `build/`.

## Load In Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select the `FocusSpark-Extension/build` folder.

After changing `public/manifest.json` or `public/background.js`, rebuild and reload the extension.

## Behavior

- Clicking the FocusSpark extension icon opens the extension app in Chrome.
- Auth tokens are stored in Chrome extension storage under `fs_access_token`.
- The background service worker manages focus-session tab behavior.
- The extension notification dropdown reads `/study/settings`; when `notifications_enabled` is false it shows "Notifications off" and still links to the full web notifications page.
- The extension can open web routes such as sign up, forgot password, achievements, profile, settings, and notifications through `src/config/frontend.ts`.

## Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Type-check and build extension
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Notes

- Keep extension-specific work in this repository.
- Keep website-only pages in the main web frontend.
- Rebuild before loading or reloading the extension in Chrome.
- Treat `build/` as generated output.

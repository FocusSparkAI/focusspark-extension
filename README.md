# FocusSpark Extension

FocusSpark is an AI-powered study and productivity app. This repository contains the Chrome extension frontend: the extension shell, the in-browser study workspace, and the MV3 background script that supports extension behavior such as launch handling and focus-session tab control.

The extension is meant for the day-to-day study experience inside Chrome. Pages that belong to the broader website, such as public marketing pages, account management, and long-form profile or settings flows, should live outside this folder.

## What’s In This Repo

This project includes:

- Chrome Extension Manifest V3 setup
- React app mounted inside the extension page
- Background service worker for extension actions and focus-session behavior
- Sign in and sign up screens
- Student dashboard and study workspace
- AI chat workspace and chat history
- Flashcards and quiz flows
- Focus tools, webcam test screens, and Pomodoro/focus context
- UI components and shared layout primitives

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
    main.tsx            # React entry point
    extension/App.tsx   # App shell and page switching
    context/            # Focus and Pomodoro providers
    components/         # Shared UI and layout components
    pages/              # Study, auth, dashboard, and extension tool pages
    utils/              # Backend and helper utilities
  build/                # Production extension output from npm run build
```

## Requirements

- Node.js
- npm
- Google Chrome or another Chromium-based browser
- FocusSpark backend available at `http://127.0.0.1:8000`

The manifest includes host permissions for the local backend and WebSocket access, along with broader HTTPS access used by the extension.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

## Build

Create the production extension bundle:

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

After changing `public/manifest.json` or `public/background.js`, rebuild the project and reload the extension.

## Behavior

Clicking the FocusSpark extension icon opens the app in Chrome.

The background service worker in `public/background.js` manages extension-level behavior for focus sessions, including tab tracking and distraction-tab handling when strict mode is enabled.

Auth tokens are stored in Chrome extension storage under `fs_access_token`.

## Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Type-check and build the extension
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

## Notes

- Keep extension-specific work in this repository.
- Keep website-only pages in the main web frontend.
- Rebuild before loading or reloading the extension in Chrome.
- Treat `build/` as generated output.

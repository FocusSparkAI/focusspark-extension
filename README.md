# FocusSpark Extension

Chrome extension frontend for the FocusSpark study workspace. It gives students quick access to their dashboard, AI tutor, Pomodoro timer, focus tools, flashcards, quizzes, and extension-specific study behavior.

Website-only pages such as the public landing pages, Science page, profile management, and long-form settings live in `FocusSpark-Frontend`.

## What Is Included

- Chrome Extension Manifest V3 setup
- React app mounted inside the extension page
- Background service worker for extension actions and focus-session behavior
- Signin screen and web signup handoff
- Student dashboard and study workspace
- AI chat workspace and chat history
- Flashcard and quiz flows
- Focus tools, webcam checks, Pomodoro context, and focus context
- Extension notification dropdown that respects the backend `notifications_enabled` setting
- Cloudinary-backed profile avatar display through the backend `avatar_url`

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Chrome Extension Manifest V3
- Chrome storage, tabs, and notifications APIs
- Axios
- Radix UI primitives
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

Create `.env` in `FocusSpark-Extension/` when you need to override the defaults.

```env
VITE_BACKEND_BASE_URL=http://127.0.0.1:8000
VITE_FRONTEND_BASE_URL=http://localhost:3000
```

The extension falls back to those same local URLs when the variables are not set.

`VITE_BACKEND_BASE_URL` points to the FastAPI API. `VITE_FRONTEND_BASE_URL` is used when the extension opens web-only pages in a normal browser tab.

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

## Extension Routes

Routes rendered inside the extension app:

- `/`
- `/signin`
- `/dashboard`
- `/chatbot`
- `/flashcards`
- `/chat-history`
- `/quiz`
- `/webcam-test`

Routes handed off to the web frontend:

- Signup
- Forgot password
- Achievements
- Profile
- Settings
- Notifications

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
- Dashboard/profile UI reads the authenticated user profile from the backend.
- Profile avatars are displayed from the backend `avatar_url`; new uploads are handled by the web profile page and stored in Cloudinary by the backend.
- The background service worker manages focus-session tab behavior.
- During an active or paused Pomodoro focus phase, navigation is locked to the AI chatbot workspace.
- Pomodoro phase changes are sent to the background service worker so break and focus behavior can stay synchronized with extension tab behavior.
- The extension notification dropdown reads `/study/settings`.
- When `notifications_enabled` is false, the dropdown shows "Notifications off" and still links to the full web notifications page.
- The extension can open web routes such as signup, forgot password, achievements, profile, settings, and notifications through `src/config/frontend.ts`.

## Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Type-check and build extension
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Demo Checklist

- Backend is running at `VITE_BACKEND_BASE_URL`
- Web frontend is running at `VITE_FRONTEND_BASE_URL` for external page links
- Extension builds successfully
- Chrome loads the `build/` folder without manifest errors
- User can sign in
- Dashboard loads profile data and Cloudinary avatar
- Pomodoro, focus tools, AI chat, quiz, and flashcard pages open correctly
- Active Pomodoro focus mode keeps the user in the chatbot workspace
- Notification dropdown reflects backend settings

## Notes

- Keep extension-specific work in this project.
- Keep website-only pages in the main web frontend.
- Rebuild before loading or reloading the extension in Chrome.
- Treat `build/` as generated output.
- Profile-picture uploads are intentionally handled through the backend/web profile flow, while the extension consumes the resulting avatar URL.

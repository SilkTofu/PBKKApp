# SnapCal – AI Calorie Tracker

SnapCal is a lightweight full-stack prototype that lets users upload food photos, then routes them through GPT-5.1-Codex (Preview) to estimate calories, macronutrients, and actionable recommendations. Entries are stored server-side so the history view keeps your latest analyses on hand.

## Features

- 📸 **Photo upload** with drag-and-drop or file picker
- 🤖 **GPT-5.1-Codex (Preview) nutrition analysis** with optional mock mode for local demos
- 📊 **Macro & micro nutrient breakdowns** plus friendly insights and recommendations
- 🗂 **Persistent history** stored in `server/data/entries.json`
- ⚡ **Single Express runtime** that serves both API + static UI (great for Replit)

## Project Structure

```
client/   # Static web UI assets served directly by Express
server/   # Node/Express API, AI integration, storage, scripts
```

## Prerequisites

- Node.js 14.17+ (already installed in this environment)
- An OpenAI API key with access to GPT-5.1-Codex (Preview) for real analyses (optional)

## Run locally

1. Install dependencies (only once):

```powershell
cd "d:\PBKK'\server"
npm install
```

2. Configure environment (optional but recommended):

```powershell
cd "d:\PBKK'\server"
copy .env.example .env
```

Edit `.env` and set:

```
OPENAI_API_KEY=sk-...
USE_MOCK_AI=false  # keep true to skip live API calls
```

3. Start the full stack (Express serves the UI and API together):

```powershell
cd "d:\PBKK'\server"
npm run dev
```

4. Optional regression smoke test:

```powershell
cd "d:\PBKK'\server"
npm test
```

Open http://localhost:5050 to use SnapCal.

## Deploy / run on Replit

- The repo includes `.replit` and `replit.nix`, so importing it into Replit just works.
- Replit automatically runs `cd server && npm install && npm run dev`, binding to the provided `$PORT`.
- The same Express process serves `/` (static UI) and `/api/*` (JSON endpoints), so no additional services are needed.

## Enabling GPT-5.1-Codex (Preview)

- The backend calls the `gpt-5.1-codex-preview` model via the OpenAI Responses API.
- The frontend highlights this model whenever an analysis runs (“Analyzing meal with GPT-5.1-Codex (Preview)...”).
- To ensure all clients benefit from live AI analysis, provide a valid `OPENAI_API_KEY` in `.env` and set `USE_MOCK_AI=false`. Without a key, SnapCal falls back to deterministic mock data so the UX remains testable.

## API Endpoints

| Method | Path                  | Description                       |
| ------ | --------------------- | --------------------------------- |
| GET    | `/api/entries`        | Fetch history entries             |
| POST   | `/api/entries/analyze`| Upload `photo` + metadata, analyze |
| GET    | `/health`             | Simple readiness probe            |

## Notes

- Uploaded photos are never written to disk—`multer` keeps them in memory for the AI call.
- History persists in JSON for simplicity; swap `storage.js` for a database when scaling.
- The `scripts/smoke-test.js` runner validates storage and mock analysis logic as a quick regression test.

Enjoy tracking your meals with a snap! 🍽️

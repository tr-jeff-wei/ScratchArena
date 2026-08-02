# ScratchArena (prototype)

A static HTML/CSS/JS prototype for ScratchArena — a gamified competitive learning platform for Scratch. No build step, no server, no framework: just plain files you can open directly or host on any static file host (GitHub Pages, S3, Netlify, etc).

## Structure

- `index.html` — dashboard: hero, stats, level grid
- `arena.html?level=<id>` — arena view: Scratch viewport placeholder, mission briefing HUD, live leaderboard
- `rankings.html` — per-level leaderboard tabs
- `css/style.css` — all styling, design tokens, and animations
- `js/data.js` — mock level and leaderboard data
- `js/extensionApi.js` — mock browser-extension → leaderboard data flow (integration hooks commented inline)
- `js/components.js` — shared UI renderers (navbar, footer, badges, leaderboard)
- `js/dashboard.js`, `js/arena.js`, `js/rankings.js` — per-page logic

## Running locally

Just open `index.html` in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

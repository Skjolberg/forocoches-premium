# AGENTS.md — Forocoches Premium

> [!IMPORTANT]
> Caveman mode **always**. Never revert. Never disable. Speak like caveman.

## Project

Userscript for Forocoches.com. TS + Vite 6 + vite-plugin-monkey → single `dist/forocoches-premium.user.js`. No runtime deps, no GM_* APIs (`grant: 'none'`). DOM + localStorage only.

## Commands

```bash
npm run build          # → dist/forocoches-premium.user.js
npm run dev            # vite build --watch (no dev server)
npx tsc --noEmit       # typecheck
```

No tests, linter, formatter.

## Architecture

| File | Role |
|------|------|
| `src/main.ts` | Entry: init, URL polling (500ms), deferred run (1s) |
| `src/runner.ts` | Page detection + Pole orchestration |
| `src/dom-adapter.ts` | Theme detection + per-theme DOM ops |
| `src/threads.ts` | Thread extraction from DOM |
| `src/hide-threads.ts` | Hide threads + highlight 0-msg |
| `src/hide-posts.ts` | Hide posts + inject Ignore buttons |
| `src/hide-ads.ts` | Ad blocking: CSS injection + DOM removal |
| `src/config.ts` | Config getters/setters |
| `src/storage.ts` | localStorage (users, words, config) |
| `src/types.ts` | TS interfaces |
| `src/ui/` | Panel UI (index + tabs) |

2 page types: `forumdisplay.php` (thread list), `showthread.php` (thread view).

## Themes (4)

1. `section.without-top-corners` → **desktop-v2**
2. `table#threadslist` → **desktop-v1**
3. `div.threads-list` or `div.postbit_wrapper` → **mobile-v2**
4. fallback → **mobile-v1**

## Config Options

localStorage `fc_config` JSON. Key bools:
- `hideThreadByAuthor` — hide threads by author
- `highlightZeroMessages` / `highlightZeroMessagesColor` — 0-msg highlight
- `showPlaceholder` — placeholder vs full hide
- `disablePostHiding` — skip post hiding
- `autoRedirectOP` / `autoReloadIgnore` — ignore UX
- `showScrollUp` / `showScrollDown` / `showPoleButton` — floating buttons
- `poleMessage` / `poleSearchPages` — Pole button config
- `blockAds` / `hideNotices` — ad blocking
- `theme` — `'auto' | 'legacy' | 'v2'`

## DOM Reference

Sanitized HTML snapshots in `dom/` (4 themes × 4 pages = 16 files). Real IDs → `999xxx` range.

| Theme | Pages |
|-------|-------|
| `dom/mobile/v1/` | forumdisplay, showthread, ignore_list, member |
| `dom/mobile/v2/` | same |
| `dom/desktop/v1/` | same |
| `dom/desktop/v2/` | same |

## Quirks

- `npm run dev` = `vite build --watch`, not dev server
- SPA nav: monkey-patched `pushState`/`replaceState` + `popstate`
- MutationObserver for dynamic content (debounced 150ms)
- Deferred runs: 500ms (URL change), 1s (init)
- v2 author: `"N @ username"` or `"@User - Actualizado..."` textContent
- v2 post author: `querySelectorAll` + filter non-empty textContent (1st member.php link empty)
- legacy author: `span[onclick*="member.php?u="]` or `div.asmvinfo`
- v2 ignore list: `div#ignorelist > div` (not `ul > li`)
- Pole: find 0-msg thread, fill textarea, click submit. Search up to 35 pages.
- History API patched before any user nav
- All data in `localStorage` only — no server sync

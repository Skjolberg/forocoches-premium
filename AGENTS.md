# FC Premium — AGENTS.md

## Project

Userscript Forocoches. TS + Vite 6 + vite-plugin-monkey → single-file userscript. No runtime deps, no GM_* APIs (`grant: 'none'`). DOM + localStorage only.

## Commands

```bash
npm run build          # → dist/forocoches-premium.user.js
npm run dev            # vite build --watch (no dev server)
npx tsc --noEmit       # typecheck (no script in package.json)
```

No tests, no linter, no formatter.

## Scope

`@match https://forocoches.com/foro/*`

## Structure

| Path | Role |
|------|------|
| `src/main.ts` | Entry: init, URL polling, deferred runs |
| `src/runner.ts` | Page detection + Pole handling |
| `src/dom-adapter.ts` | Adapter pattern: theme detection + per-theme DOM ops |
| `src/config.ts` | Config getters/setters (booleans + strings) |
| `src/storage.ts` | localStorage persistence (users, words, config) |
| `src/types.ts` | TypeScript interfaces (`ThreadInfo`, `HiddenItem`, `FCConfig`) |
| `src/threads.ts` | Thread extraction: containers, authors, messageCount (legacy + v2) |
| `src/hide-threads.ts` | Hide threads + highlight 0-msg threads + safeguard |
| `src/hide-posts.ts` | Hide posts + inject Ignore buttons in showthread |
| `src/ignore-fc.ts` | Sync/ignore via FC web scraping |
| `src/fc-api.ts` | FC API helpers (ignorelist fetch, profile, forms) |
| `src/observer.ts` | MutationObserver for dynamic DOM |
| `src/toast.ts` | Toast notifications + debug logs |
| `src/selectors.ts` | DOM selectors (`QUICK_REPLY_SELECTOR`) |
| `src/utils.ts` | `cleanUser()`, `normalizeStr()` |
| `src/ui/index.ts` | UI orchestrator: panel, buttons, tabs |
| `src/ui/tab-users.ts` | Users tab |
| `src/ui/tab-words.ts` | Words tab |
| `src/ui/tab-config.ts` | Config tab |
| `src/ui/tab-logs.ts` | Logs tab |
| `src/ui/presets.ts` | Word presets |
| `src/ui/styles.ts` | CSS injection |

## Feature Reference

### Dual Design Support (`src/dom-adapter.ts`)
Auto-detect legacy (section-based) vs v2 (div.threads-list / div.postbit_wrapper / div.page-margin) via DOM sniffing. Manual override in Config → Compatibilidad → Diseño del foro.

### v2 Adaptations
- **threads.ts**: `findContainerV2()` walks up to child of `div.threads-list`. `extractAuthorV2()` uses `N @ username` pattern from textContent.
- **hide-posts.ts**: `findPostAuthor()` iterates `querySelectorAll` for non-empty `textContent` (v2 has 3 member.php links, 1st empty).
- **fc-api.ts**: Ignorelist selector `#ignorelist > li > a` → `#ignorelist a[href*="member.php"]` (v2 uses divs, not ul/li). Addlist regex: no "ignorar" text required (v2: "Agregar a Lista de Ignorados").
- **dom-adapter.ts**: `getOPAuthor()`: v2 iterates first `div#editN` member.php links for non-empty textContent; legacy uses position-based `links[1]`.
- **ui/index.ts**: Quick reply textarea: added `textarea#vB_Editor_QR_textarea`.

### Highlight 0-Message Threads
Config: "Resaltar hilos sin respuestas" + 7 predefined colors. Extracts `messageCount` via `N @ username` (v2) or `N Mensajes` (legacy). Paints `container.style.background`.

### Pole Button (🏎️)
Floating button. Finds first thread with `messageCount === 0`, navigates there, fills textarea with configured message, clicks submit. Multi-page search (up to 35 pages) if no 0-msg thread on current page. Config: Botón Pole, Mensaje para Pole, Buscar en páginas siguientes.

### Username Search (🔍)
In Users tab, filters ignore list to show only searched username (with remove X). Clears on tab switch or panel reopen.

### Button Layout
Floating buttons stacked vertically (bottom-right): ▲ (scroll up), ▼ (scroll down), 🏎️ (Pole), FC icon (toggle panel). Each hides individually via config.

## Config Options

### Hilos
- `autoMinimizeWords`: Auto-minimizar al guardar palabras
- `hideThreadByAuthor`: Ocultar hilos por autor (v2 solo)
- `highlightZeroMessages`: Resaltar hilos sin respuestas
- `highlightZeroMessagesColor`: Color de resaltado (string, default `'#FFF3CD'`)

### Mensajes
- `showPlaceholder`: Mostrar placeholder al ocultar
- `disablePostHiding`: Desactivar ocultación de mensajes

### Usuarios
- `autoMinimize`: Auto-minimizar al añadir/eliminar usuarios
- `autoMinimizePanel`: Cerrar panel al modificar listas
- `autoRedirectOP`: Redirigir al subforo al ignorar OP
- `autoReloadIgnore`: Recargar pagina al ignorar

### Interfaz
- `showScrollUp`, `showScrollDown`: Botones flotantes
- `showPoleButton`: Botón Pole
- `poleMessage`: Texto a enviar
- `poleSearchPages`: Buscar en páginas siguientes (hasta 35)

### Compatibilidad
- `theme`: 'auto' | 'legacy' | 'v2'

## Quirks

- README says `run.ts`; actual file is **`runner.ts`**
- README says `ui.ts`; actual file is **`ui/index.ts`**
- No dev server — `npm run dev` rebuilds via `--watch`
- Deferred runs: 500ms on URL change, 1s on init (hardcoded `main.ts`)
- History API monkey-patched (`pushState`/`replaceState`) + `popstate` for SPA nav
- Only two page types: `forumdisplay.php` (thread list) and `showthread.php` (thread view)

- v2 SEPARATOR elements empty (author info in thread container textContent, not SEPARATOR)
- Ni legacy ni v2 tienen `section`, `main`, `article`, `nav` — todo es `div`
- CSS custom properties used extensively (`var(--background-color)`, `var(--coral)`, etc.)
- v2 member.php links in post: textContent="" on 1st match, actual username on 2nd
- Forumdisplay v2: thread creator after `@` in `"N @ username"` pattern in container textContent
- Legacy forumdisplay: thread info (messages, author) in `<li>` sibling of container `<li>`

## DOM Reference Files

Full HTML snapshots (sanitized with fake placeholder data) in `dom/v1/` (legacy) and `dom/v2/` (new mobile design).
Real user IDs replaced with `999xxx` range, usernames with `FakeUserNN`, post IDs with `999000xxx`, thread IDs with `880000xx`.
Use alongside the structure docs below for full context when implementing features.

| File | Page Type |
|------|-----------|
| `dom/v1/forumdisplay.html` | Legacy thread list |
| `dom/v1/showthread.html` | Legacy thread view |
| `dom/v1/ignore_list.html` | Legacy ignore list |
| `dom/v1/member.html` | Legacy user profile |
| `dom/v2/forumdisplay.html` | v2 mobile thread list |
| `dom/v2/showthread.html` | v2 mobile thread view |
| `dom/v2/ignore_list.html` | v2 mobile ignore list |
| `dom/v2/member.html` | v2 mobile user profile (other user) |

## DOM Structure (v2 mobile)

These are real DOM structures observed from Forocoches mobile web. Use this reference when implementing features so you don't need new dumps.

### forumdisplay.php (thread list)

```
div.page-margin > div.page > div.block
  └─ div.threads-list.optidigital-autoinread.posts_publi_bg
       ├─ div[style*="background-color: var(--background-color)"] ← container-to-hide
       │    └─ div[flex-direction: column; padding: 8px 10px 0]
       │         ├─ div[flex-direction: row]                      ← title row
       │         │    ├─ span[icon]                               ← message icon (22x22)
       │         │    └─ span[font-weight: bold]
       │         │         └─ a[href*="showthread.php?t=N"]       ← thread link, style="width:100%"
       │         │              └─ span[color: var(--text-color)] ← title text
       │         └─ div[flex-direction: column; font-size: 0.75rem] ← metadata row
       │              └─ div[flex-direction: row; justify-content: space-between]
       │                   ├─ div[flex-direction: row]
       │                   │    └─ a[href*="showthread.php?p=N#postN"]
       │                   │         └─ div[flex-direction: row]
       │                   │              ├─ span[icon]           ← replies icon
       │                   │              ├─ span[min-width: 36px] "37" ← MESSAGE COUNT
       │                   │              ├─ span "@"              ← @ symbol
       │                   │              └─ span "Sidewinder"     ← CREATOR USERNAME
       │                   └─ div[flex-direction: row]
       │                        └─ a[href*="showthread.php?p=N#postN"]
       │                             ├─ span "Hoy"               ← date
       │                             └─ span "07:33"             ← time
       └─ <separator></separator>                                  ← empty separator

Selectors:
  - Thread link: a[href*="showthread.php?t="]
  - Container: a.closest('div.threads-list > div') = direct child of threads-list
  - Creator: textContent.match(/(\d+)\s+@\s+(\w+)/) → group 2
  - Message count: textContent.match(/(\d+)\s+@\s+\w+/) → group 1
  - No member.php links exist in thread list area (v2)
```

### showthread.php (thread view)

```
div.page-margin > div.page > div.block
  └─ div > div#posts.posts_publi_bg
       ├─ div#edit{N}.postbit_wrapper                              ← post container (NEW wrapper)
       │    └─ a[name="post{N}"]
       │         └─ div[padding-bottom: 8px]
       │              └─ ul
       │                   └─ li.postbit.postbitim.postcontainer   ← legacy inside wrapper
       │                        └─ div.posthead
       │                             ├─ member.php links (3):
       │                             │    [0] href=...u=N text=""         ← empty
       │                             │    [1] href=...u=N text="Username" ← real username
       │                             │    [2] href=...u=N text=""         ← empty
       │                             └─ a "Citar" link
       │                                  href="newreply.php?do=newreply&p=N"
       │                                  → parent walk up to div#edit{N}.postbit_wrapper (depth 5)
       │
       └─ form#qrform[action*="newreply.php?do=postreply"]
            └─ textarea#vB_Editor_QR_textarea[name="message"]  ← quick reply

Selectors:
  - Post containers: li.postbit, div[id^="edit"] (both work)
  - Author link: a[href*="member.php?u="] (use *= not ^=, v2 uses absolute URLs)
  - Find author: querySelectorAll + filter for non-empty textContent
  - Citar: a with textContent === "citar" (case insensitive)
  - Quick reply: textarea#vB_Editor_QR_textarea, textarea[name="message"]
  - Submit form: form.closest('form').querySelector input[type="submit"] where value contains "enviar"
```

### profile.php?do=ignorelist (ignore list)

```
div.page-margin > div.page > div.block
  └─ div#ignorelist                                                ← DIV, not UL!
       ├─ div#user{N}                                              ← each user entry
       │    ├─ input[type="checkbox"][name="listbits[ignore][N]"]  ← checkbox
       │    ├─ a[href="member.php?u=N"] "username"                 ← user link
       │    ├─ input[type="hidden"]                                ← original value
       │    └─ <separator style="margin-top: 16px">                ← separator
       └─ ...

Selectors:
  - User list: #ignorelist a[href*="member.php"]  (NOT #ignorelist > li > a)
  - User ID: href.match(/member\.php\?u=(\d+)/)
  - Structure: div entries, not li entries
```

### member.php (other user's profile)

The "Ignorar" link exists on OTHER users' profiles (not your own). Structure:

```
member.php?u=N
  └─ <a role="link" class="flatten-text" style="color: var(--coral);"
       href="profile.php?do=addlist&amp;userlist=ignore&amp;u=N"
       rel="nofollow">
            Agregar a Lista de Ignorados
       </a>

Differences from legacy:
  - Link text: "Agregar a Lista de Ignorados" (not "Ignorar")
  - href uses &amp; instead of raw &
  - Has role="link", class="flatten-text"
  - Multi-line innerHTML with whitespace

Selectors:
  - Regex: /<a[^>]*href=["'][^"']*profile\.php\?do=addlist[^"']*u=(\d+)[^"']*["'][^>]*>[\s\S]*?<\/a>/i
  - No "ignorar" text required in regex
```

### Theme detection

```ts
function detectTheme(): 'legacy' | 'v2' {
  if (document.querySelector('div.threads-list, div.postbit_wrapper, separator'))
    return 'v2';
  return 'legacy';
}
```

Selectors: `div.threads-list` (v2 forumdisplay), `div.postbit_wrapper` (v2 showthread), `separator` (v2 ambas). Ninguno existe en legacy.

### Theme visual differences

| Feature | Legacy | v2 mobile |
|---------|--------|-----------|
| Layout tags | All `<div>` (no semánticos) | All `<div>` (no semánticos) |
| Body classes | Empty `class=""` | Empty `class=""` |
| HTML classes | Empty `class=""` | Empty `class=""` |
| CSS custom props | Hardcoded colors | `var(--coral)`, `var(--text-color)`, `var(--background-color)` |
| Thread list container | Bare `<ul>` | `div.threads-list` |
| Post container | `li.postbit` | `div#edit{N}.postbit_wrapper` wrapping `<li>` |
| SEPARATOR element | `<hr>` or border | `<separator></separator>` (custom empty element) |
| Author in forumdisplay | `<div class="asmvinfo"> textContent` | `"N @ username"` in textContent |
| member.php href format | Relative `member.php?u=N` | Absolute `https://.../member.php?u=N` |
| Ignore list structure | `<ul id="ignorelist"><li>...</li></ul>` | `<div id="ignorelist"><div>...</div></div>` |
| Link "Ignorar" text | "Ignorar" | "Agregar a Lista de Ignorados" |
| OP detection | Second non-empty member.php link | First post's member.php author |
| Quick reply textarea | `textarea[name="message"][id*="quick"]` | `textarea#vB_Editor_QR_textarea` |

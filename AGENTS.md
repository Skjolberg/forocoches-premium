# FC Premium — AGENTS.md

> **Regla:** Cada vez que implementes un cambio que afecte a la lógica del programa (nuevo adaptador, cambio de detección, nuevo selector, cambio en el flujo de datos), documéntalo aquí. Esto asegura que el contexto se mantenga entre sesiones.

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
| `src/hide-ads.ts` | Ad blocking: CSS injection + DOM removal per theme |
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

### Triple Design Support (`src/dom-adapter.ts`)
Auto-detect legacy (mobile v1) vs v2 (mobile v2) vs pc (desktop) via DOM sniffing. Detection order: `section.without-top-corners` (desktop-v2), `table#threadslist` (desktop-v1), `div.threads-list` / `div.postbit_wrapper` (mobile-v2), fallback mobile-v1.

### Mobile-v2 Adaptations
- **threads.ts**: `findContainerV2()` walks up to child of `div.threads-list`. `extractAuthorV2()` uses `N @ username` pattern from textContent.
- **hide-posts.ts**: `findPostAuthor()` iterates `querySelectorAll` for non-empty `textContent` (mobile-v2 has 3 member.php links, 1st empty).
- **fc-api.ts**: Ignorelist selector `#ignorelist > li > a` → `#ignorelist a[href*="member.php"]` (mobile-v2 uses divs, not ul/li). Addlist regex: no "ignorar" text required (mobile-v2: "Agregar a Lista de Ignorados").
- **dom-adapter.ts**: `getOPAuthor()`: mobile-v2 iterates first `div#editN` member.php links for non-empty textContent; mobile-v1/desktop-v1 uses scoped `li.postbit` query.
- **ui/index.ts**: Quick reply textarea: added `textarea#vB_Editor_QR_textarea`.

### Desktop-v1 Adaptations
- **dom-adapter.ts**: `createDesktopV1Adapter()`. Forumdisplay: `table#threadslist` wrapper, threads in `<tr>`, author via `span[onclick*="member.php?u="]` textContent, message count via `a[href*="whoposted"]` textContent. Showthread: `li.postbit` containers (same postbit structure as mobile-v1).
- **hide-threads.ts**: `hideThreadByAuthor` enabled for desktop-v1 (has member.php links via onclick span).
- **threads.ts**: Dedup por href base (sin fragmento `#`) + dedup por container evita duplicados por enlace "último mensaje" que contiene `showthread.php?t=N#postM`.

### Desktop-v2 Adaptations
- **dom-adapter.ts**: `createDesktopV2Adapter()`. Forumdisplay: `section.without-top-corners` wrapper, threads in `div[flex-direction:column]`, author via `@User - Actualizado...` pattern, message count via `a[href*="whoposted"]` textContent. Showthread: same logic as mobile-v2 (postbit_wrapper, member.php links, div#edit containers). Thread container detection walks up from `a#thread_title_N` until grandparent is `section.without-top-corners`.
- **hide-threads.ts**: `hideThreadByAuthor` enabled for desktop-v2 (same reason as mobile-v2: no member.php links in thread list area).
- **fc-api.ts**: Ignorelist selector `#ignorelist a[href*="member.php"]` already works (desktop-v2 uses `ul#ignorelist > li`, matches same selector).

### Highlight 0-Message Threads
Config: "Resaltar hilos sin respuestas" + 7 predefined colors. Extracts `messageCount` via `N @ username` (v2) or `N Mensajes` (legacy). Paints `container.style.background`.

### Pole Button (🏎️)
Floating button. Finds first thread with `messageCount === 0`, navigates there, fills textarea with configured message, clicks submit. Multi-page search (up to 35 pages) if no 0-msg thread on current page. Config: Botón Pole, Mensaje para Pole, Buscar en páginas siguientes.

### Username Search (🔍)
In Users tab, filters ignore list to show only searched username (with remove X). Clears on tab switch or panel reopen.

### Button Layout
Floating buttons stacked vertically (bottom-right): ▲ (scroll up), ▼ (scroll down), 🏎️ (Pole), FC icon (toggle panel). Each hides individually via config.

### Ad Blocking (`src/hide-ads.ts`)
Dual approach: CSS injection + DOM removal. Works across all 4 themes.

**CSS injection** (via `<style id="fcp-adblock">`):
- `[id^="optidigital-adslot-"]` / `.optidigital-wrapper-div` — optidigital ad containers
- `.float_banner`, `.ad-center` — floating bottom banners
- `#infocookie` — cookie notice bar
- `iframe[name="googlefcPresent"]`, `iframe[name="__tcfapiLocator"]` — consent iframes
- `#sd-cmp` — consent management UI
- `form#vbnotices` / `#notices-container`, `.notices-container` — notice banners

**DOM removal** (for elements that leave empty containers when only hidden):
- `iframe#h1[name="h1"]` — mobile showthread header promo
- `iframe#fcthread[name="fcthread"]` — mobile showthread in-post ads
- Ad `<li>` inside thread list `<ul>` (optidigital slots)
- `#optidigital-adslot-Skyscraper_1` — desktop v1 sidebar ad
- `#notices-container`, `.notices-container` — desktop v2 notice area

Config: `blockAds` (bool, default true), `hideNotices` (bool, default true).
Called from `runner.ts` → `run()` on every page load and mutation.

## Config Options

### Hilos
- `autoMinimizeWords`: Auto-minimizar al guardar palabras
- `hideThreadByAuthor`: Ocultar hilos por autor (mobile-v2, desktop-v1, desktop-v2)
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

### Publicidad
- `blockAds`: Bloquear publicidad (optidigital, banners, flotantes)
- `hideNotices`: Ocultar avisos (noticias, promociones, cookies)

### Compatibilidad
- `theme`: 'auto' | 'legacy' | 'v2'

## Quirks

- README says `run.ts`; actual file is **`runner.ts`**
- README says `ui.ts`; actual file is **`ui/index.ts`**
- No dev server — `npm run dev` rebuilds via `--watch`
- Deferred runs: 500ms on URL change, 1s on init (hardcoded `main.ts`)
- History API monkey-patched (`pushState`/`replaceState`) + `popstate` for SPA nav
- Only two page types: `forumdisplay.php` (thread list) and `showthread.php` (thread view)

- mobile-v2 SEPARATOR elements empty (author info in thread container textContent, not SEPARATOR)
- Ni mobile-v1 ni mobile-v2 tienen `section`, `main`, `article`, `nav` — todo es `div`
- desktop-v2 tiene `section`, `main`, `header`
- CSS custom properties used extensively (`var(--background-color)`, `var(--coral)`, etc.)
- mobile-v2 member.php links in post: textContent="" on 1st match, actual username on 2nd (v2 has 3 links, PC has 2, legacy has 2+)
- Forumdisplay v2: thread creator after `@` in `"N @ username"` pattern in container textContent
- Legacy forumdisplay: thread info (messages, author) in `<li>` sibling of container `<li>`
- PC forumdisplay: thread creator after `@` in `"@User - Actualizado..."` pattern in span textContent
- PC showthread: div#edit{N} wraps section > div.postbit_wrapper (not same element like v2)

## DOM Reference Files

Full HTML snapshots (sanitized with fake placeholder data) in `dom/mobile/v1/` (legacy mobile), `dom/mobile/v2/` (new mobile), `dom/desktop/v1/` (legacy PC), and `dom/desktop/v2/` (new PC design).
Real user IDs replaced with `999xxx` range, usernames with `FakeUserNN`, post IDs with `999000xxx`, thread IDs with `880000xx`.
Use alongside the structure docs below for full context when implementing features.

| File | Page Type |
|------|-----------|
| `dom/mobile/v1/forumdisplay.html` | Legacy mobile thread list |
| `dom/mobile/v1/showthread.html` | Legacy mobile thread view |
| `dom/mobile/v1/ignore_list.html` | Legacy mobile ignore list |
| `dom/mobile/v1/member.html` | Legacy mobile user profile |
| `dom/mobile/v2/forumdisplay.html` | v2 mobile thread list |
| `dom/mobile/v2/showthread.html` | v2 mobile thread view |
| `dom/mobile/v2/ignore_list.html` | v2 mobile ignore list |
| `dom/mobile/v2/member.html` | v2 mobile user profile |
| `dom/desktop/v1/forumdisplay.html` | Legacy PC thread list |
| `dom/desktop/v1/showthread.html` | Legacy PC thread view |
| `dom/desktop/v1/ignore_list.html` | Legacy PC ignore list |
| `dom/desktop/v1/member.html` | Legacy PC user profile |
| `dom/desktop/v2/forumdisplay.html` | PC desktop thread list |
| `dom/desktop/v2/showthread.html` | PC desktop thread view |
| `dom/desktop/v2/ignore_list.html` | PC desktop ignore list |
| `dom/desktop/v2/member.html` | PC desktop user profile |

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

## DOM Structure (PC desktop v2)

### forumdisplay.php (thread list)

```
section.without-top-corners.without-bottom-corners
  └─ div[style*="flex-direction: column"]                          ← THREAD LIST WRAPPER
       ├─ div[style*="flex-direction: column"]                     ← THREAD CONTAINER (to hide)
       │    └─ div[style*="flex-direction: row; padding-left: 24px"]
       │         ├─ span[icon]                                     ← message icon
       │         ├─ separator-vertical
       │         ├─ div[flex: 7; flex-direction: column]           ← title + metadata
       │         │    ├─ span[font-size: 1rem]
       │         │    │    └─ a#thread_title_N[href*="showthread.php?t="]
       │         │    │         └─ span > span[font-weight: bold]  ← TITLE TEXT
       │         │    └─ div[flex-direction: row]
       │         │         └─ a[href*="showthread.php?p="]
       │         │              └─ span "@Username - Actualizado..." ← CREATOR
       │         ├─ separator-vertical
       │         └─ div[flex-direction: row]
       │              ├─ span[icon]                                ← replies icon
       │              └─ a[href*="misc.php?do=whoposted"] "12"     ← MESSAGE COUNT
       └─ <separator style="height: 4px">                          ← between threads

Selectors:
  - Thread link: a[id^="thread_title_"] or a[href*="showthread.php?t="]
  - Container: walk up from a#thread_title_N until grandparent is section.without-top-corners
  - Creator: textContent.match(/@(\S+?)\s*-\s*(Actualizado|Ayer|Hoy|Anteayer)/i) → group 1
  - Message count: a[href*="whoposted"] textContent (parseInt)
  - No member.php links exist in thread list area (PC)
```

### showthread.php (thread view)

```
main > div#container
  └─ div#posts
       ├─ div#edit{N}                                              ← OUTER post wrapper
       │    └─ section.without-bottom-corners
       │         └─ div#post{N}.postbit_wrapper                    ← INNER post container
       │              ├─ div (header: avatar + username + date)
       │              │    ├─ a[href*="member.php?u="] > img       ← avatar (textContent "")
       │              │    ├─ a[href*="member.php?u="] "Username"  ← real username
       │              │    └─ span (date, post number)
       │              ├─ <separator>
       │              ├─ div#post_message_N (message content)
       │              └─ div (control bar)
       │                   ├─ a "Citar"                            ← "Citar" in <span> inside <a>
       │                   │    href="newreply.php?do=newreply&p=N"
       │                   │    → parent walk up to div#edit{N} (depth 5)
       │                   └─ ... (report, reply, multi-cite)
       ├─ <separator-large>
       ├─ div#edit{N+1} ... (next post)
       └─ form#qrform[action*="newreply.php?do=postreply"]
            └─ textarea#vB_Editor_QR_textarea[name="message"]      ← quick reply (with placeholder)

Selectors:
  - Post containers: div[id^="edit"] (outer), div.postbit_wrapper (inner)
  - Author link: a[href*="member.php?u="] (use *= not ^=)
  - Find author: querySelectorAll + filter for non-empty textContent (2 links per post: avatar empty, username real)
  - Citar: a containing span with text "Citar" (case insensitive, works via a.textContent)
  - Quick reply: textarea#vB_Editor_QR_textarea[name="message"]
  - Submit form: input#qr_submit[type="submit"] (value="Enviar Respuesta")
```

### profile.php?do=ignorelist (ignore list)

```
div.page-margin > div.page > div.block
  └─ div#ignorelist                                                ← DIV, not UL!
       ├─ div#user{N}                                              ← each user entry (mobile v2)
       │    ├─ input[type="checkbox"][name="listbits[ignore][N]"]  ← checkbox
       │    ├─ a[href="member.php?u=N"] "username"                 ← user link
       │    ├─ input[type="hidden"]                                ← original value
       │    └─ <separator style="margin-top: 16px">                ← separator
       └─ ...

PC/legacy uses ul#ignorelist with li children (same #ignorelist a[href*="member.php"] selector works for both).
```

Selectors:
  - User list: #ignorelist a[href*="member.php"]  (works on all: ul/li and div/div)
  - User ID: href.match(/member\.php\?u=(\d+)/)
  - Structure: div entries (mobile v2), li entries (legacy, PC)

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
function detectTheme(): 'mobile-v1' | 'mobile-v2' | 'desktop-v1' | 'desktop-v2' {
  if (document.querySelector('section.without-top-corners')) return 'desktop-v2';
  if (document.querySelector('table#threadslist')) return 'desktop-v1';
  if (document.querySelector('div.threads-list, div.postbit_wrapper')) return 'mobile-v2';
  return 'mobile-v1';
}
```

Selectors: `section.without-top-corners` (desktop-v2 forumdisplay), `table#threadslist` (desktop-v1 forumdisplay), `div.threads-list` (mobile-v2 forumdisplay), `div.postbit_wrapper` (mobile-v2 showthread).

### Theme visual differences

| Feature | Mobile-v1 | Mobile-v2 | Desktop-v1 | Desktop-v2 |
|---------|-----------|-----------|------------|------------|
| Layout tags | All `<div>` (no semánticos) | All `<div>` (no semánticos) | All `<div>` (no semánticos) | `<section>`, `<main>`, `<header>` |
| Body classes | Empty `class=""` | Empty `class=""` | Empty `class=""` | Empty `class=""` |
| CSS custom props | Hardcoded colors | `var(--coral)`, `var(--text-color)`, `var(--background-color)` | Hardcoded colors | `var(--coral)`, `var(--text-color)`, `var(--background-color)` |
| Thread list container | Bare `<ul>` | `div.threads-list` | `table#threadslist` | `section.without-top-corners` |
| Thread container | `<li>` | `div` child of threads-list | `<tr>` | `div[style*="flex-direction: column"]` child of wrapper |
| Post container | `li.postbit` | `div#edit{N}.postbit_wrapper` wrapping `<li>` | `li.postbit` (table layout) | `div#edit{N} > section > div#post{N}.postbit_wrapper` (no `<li>`) |
| SEPARATOR element | `<hr>` or border | `<separator></separator>` (custom empty element) | None (alt1/alt2 bg) | `<separator>` + `<separator-vertical>` |
| Author in forumdisplay | `<div class="asmvinfo"> textContent` | `"N @ username"` in textContent | `span[onclick*="member.php?u="]` | `"@User - Actualizado..."` in textContent |
| Message count in list | `"N Mensajes"` text | `N` from `"N @ username"` pattern | `a[href*="whoposted"]` textContent | `a[href*="whoposted"]` textContent |
| member.php href format | Relative `member.php?u=N` | Absolute `https://.../member.php?u=N` | Via onclick span | Relative `member.php?u=N` |
| Ignore list structure | `<ul id="ignorelist"><li>...</li></ul>` | `<div id="ignorelist"><div>...</div></div>` | `<ul id="ignorelist"><li>...</li></ul>` | `<ul id="ignorelist"><li>...</li></ul>` |
| Link "Ignorar" text | "Ignorar" | "Agregar a Lista de Ignorados" | "Agregar a Lista de Ignorados" | "Agregar a Lista de Ignorados" |
| OP detection | Scoped `li.postbit` member.php | First post member.php author | Scoped `li.postbit` member.php | First post member.php author |
| Quick reply textarea | `textarea[name="message"][id*="quick"]` | `textarea#vB_Editor_QR_textarea` | `textarea#vB_Editor_QR_textarea` | `textarea#vB_Editor_QR_textarea` (with placeholder) |

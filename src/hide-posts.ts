import { getUsers, saveUsers } from './storage';
import { toast, log } from './toast';
import { cleanUser } from './utils';
import { getAutoReloadIgnore, getShowPlaceholder, getDisablePostHiding, getHighlightOP, getHighlightOPColor } from './config';
import { addToFCIgnore } from './ignore-fc';
import { run } from './runner';
import { detectAdapter } from './dom-adapter';
import { STYLE } from './ui/styles';

let lastHiddenPosts = -1;
let lastCitarLinks = -1;
let lastIgnorarAdded = -1;

const PLACEHOLDER_TEXT = 'Mensaje de usuario ignorado';

function hidePostElement(post: HTMLElement, usePlaceholder: boolean): void {
  if (usePlaceholder) {
    post.innerHTML = '';
    post.style.display = '';
    const placeholder = document.createElement('div');
    placeholder.textContent = PLACEHOLDER_TEXT;
    placeholder.style.cssText = STYLE.POST_PLACEHOLDER;
    post.appendChild(placeholder);
  } else {
    post.style.display = 'none';
  }
}

export function findPostAuthor(post: HTMLElement): string | null {
  const links = post.querySelectorAll<HTMLAnchorElement>('a[href*="member.php?u="], a.bigusername[href*="member.php"]');
  for (let i = 0; i < links.length; i++) {
    const name = cleanUser(links[i].textContent);
    if (name) return name;
  }
  return null;
}

export function hidePosts(users: string[]): void {
  if (users.length === 0) { return; }
  if (getDisablePostHiding()) return;

  const ad = detectAdapter();
  const usePlaceholder = getShowPlaceholder();
  const posts = document.querySelectorAll<HTMLElement>('li.postbit, div[id^="edit"]');
  let count = 0;
  posts.forEach((post) => {
    if (post.style.display === 'none') return;
    const name = findPostAuthor(post);
    if (name && users.indexOf(name) !== -1) {
      hidePostElement(post, usePlaceholder);
      const linkRow = ad.getLinkRow(post);
      if (linkRow) linkRow.style.display = 'none';
      count++;
    }
  });
  if (count > 0 && count !== lastHiddenPosts) { lastHiddenPosts = count; log('HIDE-POSTS', `Ocultados ${count} de ${posts.length}`); toast(`Mensajes ocultados: ${count}`); }
  else if (count === 0 && lastHiddenPosts === -1) { lastHiddenPosts = 0; log('HIDE-POSTS', `Ocultados 0 de ${posts.length}`); }
}

export function addIgnorePostButtons(): void {
  if (window.location.pathname.indexOf('showthread.php') === -1) return;
  if (getDisablePostHiding()) return;

  const citarLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="newreply.php?do=newreply"]')).filter((anchor) => {
    if ((anchor.textContent || '').trim().toLowerCase() === 'citar') return true;
    const img = anchor.querySelector('img');
    if (img && (img.alt || '').toLowerCase().indexOf('cita') !== -1) return true;
    return false;
  });
  if (citarLinks.length === 0) return;
  if (citarLinks.length !== lastCitarLinks) { lastCitarLinks = citarLinks.length; log('IGNORE-BTN', `Links "Citar": ${citarLinks.length}`); }

  let added = 0;
  citarLinks.forEach((citarLink) => {
    if (citarLink.parentNode!.querySelector('.fc-ignore-btn')) return;

    // Find author link walking up the DOM
    let currentEl: HTMLElement | null = citarLink.parentNode as HTMLElement;
    let authorLink: HTMLAnchorElement | null = null;
    while (currentEl && currentEl !== document.body) {
      const authorAnchors = currentEl.querySelectorAll<HTMLAnchorElement>('a[href*="member.php?u="]');
      const foundAuthor = Array.from(authorAnchors).find((anchor) => anchor.textContent.trim());
      if (foundAuthor) { authorLink = foundAuthor; break; }
      currentEl = currentEl.parentNode as HTMLElement;
    }
    if (!authorLink) return;
    const username = cleanUser(authorLink.textContent);
    if (!username) return;

    const btn = document.createElement('a');
    btn.className = 'fc-ignore-btn';
    btn.textContent = 'Ignorar';
    btn.href = '#';
    btn.style.cssText = STYLE.IGNORE_BTN;
    const isDesktopV1 = !document.querySelector('div.page-margin') && !document.querySelector('section.without-bottom-corners');
    const isMobileV2 = !!document.querySelector('div.page-margin') && !!document.querySelector('div.postbit_wrapper');
    const isDesktopV2 = !!document.querySelector('section.without-bottom-corners');
    if (isDesktopV1) { btn.style.display = 'inline-block'; btn.style.marginTop = '-12px'; btn.style.setProperty('vertical-align', 'middle', 'important'); }
    if (isMobileV2 || isDesktopV2) btn.style.marginTop = '2px';

    btn.addEventListener('click', (event) => {
      event.preventDefault();
      const users = getUsers();
      if (users.indexOf(username) === -1) {
        log('IGNORE-BTN', `Ignorar click: @${username}`);
        users.push(username);
        saveUsers(users);
        toast(`Ignorado @${username}`);
        addToFCIgnore(username);

        // Hide post immediately
        const ad = detectAdapter();
        const usePlaceholder = getShowPlaceholder() && !getDisablePostHiding();
        const container = ad.getPostContainer(citarLink);
        if (container) {
          hidePostElement(container, usePlaceholder);
          const linkRow = ad.getLinkRow(container);
          if (linkRow) linkRow.style.display = 'none';
        }

        run();
        btn.textContent = '\u2713';
        btn.style.color = '#2ECC71';
        if (getAutoReloadIgnore()) { log('IGNORE-BTN', 'Recargando pagina en 1.5s...'); setTimeout(() => { location.reload(); }, 1500); }
      } else {
        toast(`@${username} ya esta ignorado`);
      }
    });

    const sepEl = isDesktopV1 ? document.createElement('span') : document.createTextNode('|');
    if (isDesktopV1) {
      (sepEl as HTMLSpanElement).textContent = ' | ';
      (sepEl as HTMLSpanElement).style.display = 'inline-block';
      (sepEl as HTMLSpanElement).style.marginTop = '-12px';
      (sepEl as HTMLSpanElement).style.setProperty('vertical-align', 'middle', 'important');
    }
    citarLink.parentNode!.appendChild(sepEl);
    citarLink.parentNode!.appendChild(btn);
    added++;
  });
  if (added > 0 && added !== lastIgnorarAdded) { lastIgnorarAdded = added; log('IGNORE-BTN', `Ignorar a\u00F1adidos: ${added}`); }
}

const OP_CACHE_KEY = 'fc_thread_op';

function getCachedOP(): string {
  try {
    const data = JSON.parse(localStorage.getItem(OP_CACHE_KEY) || '{}');
    const tidMatch = window.location.href.match(/showthread\.php\?t=(\d+)/i);
    const tid = tidMatch ? tidMatch[1] : '';
    if (data.tid === tid && data.op) return data.op;
  } catch (_) { /* ignore */ }
  return '';
}

function cacheOP(op: string): void {
  const tidMatch = window.location.href.match(/showthread\.php\?t=(\d+)/i);
  const tid = tidMatch ? tidMatch[1] : '';
  if (!tid || !op) return;
  try { localStorage.setItem(OP_CACHE_KEY, JSON.stringify({ tid, op })); } catch (_) { /* ignore */ }
}

export function highlightOPPosts(): void {
  if (!getHighlightOP()) return;
  if (window.location.pathname.indexOf('showthread.php') === -1) return;

  const pageMatch = window.location.href.match(/page=(\d+)/);
  const curPage = pageMatch ? parseInt(pageMatch[1], 10) : 1;
  const ad = detectAdapter();

  let op = getCachedOP();
  if (!op) {
    if (curPage > 1) return;
    op = ad.getOPAuthor(document);
    if (!op) return;
    cacheOP(op);
  }

  const bgColor = getHighlightOPColor();
  const allPosts = document.querySelectorAll<HTMLElement>('li.postbit, div[id^="edit"]');
  if (allPosts.length === 0) return;

  allPosts.forEach((post) => {
    if (post.style.display === 'none') return;
    if (post.querySelector('.fc-op-badge')) return;

    const author = findPostAuthor(post);
    if (!author || author !== op) return;

    const isMobileV1 = ad.theme === 'mobile-v1';

    if (isMobileV1) {
      const parentUl = post.closest('ul');
      if (parentUl) {
        const linkRows = Array.from(parentUl.querySelectorAll<HTMLElement>('li.link'));
        const postbits = Array.from(parentUl.querySelectorAll<HTMLElement>('li.postbit'));
        const idx = postbits.indexOf(post);
        const linkRow = linkRows[idx];

        post.style.setProperty('background-color', bgColor, 'important');
        post.style.setProperty('background-image', 'none', 'important');
        post.style.setProperty('border', '2px solid #FF6B35', 'important');
        post.style.setProperty('box-shadow', '0 2px 8px rgba(255,107,53,0.3)', 'important');

        if (linkRow) {
          linkRow.style.setProperty('background-color', bgColor, 'important');
          linkRow.style.setProperty('background-image', 'none', 'important');
          linkRow.style.setProperty('border-left', '2px solid #FF6B35', 'important');
          linkRow.style.setProperty('border-right', '2px solid #FF6B35', 'important');
          linkRow.style.setProperty('border-bottom', '2px solid #FF6B35', 'important');
        }
      }
    } else {
      post.style.background = bgColor;
      post.style.border = '2px solid #FF6B35';
      post.style.borderRadius = '8px';
      post.style.boxShadow = '0 2px 12px rgba(255,107,53,0.25)';
    }

    const badge = document.createElement('span');
    badge.className = 'fc-op-badge';
    badge.textContent = '\uD83D\uDCCC OP';
    badge.style.cssText = 'display:inline-block;background:#FF6B35;color:white;font-size:11px;font-weight:bold;padding:1px 6px;border-radius:3px;line-height:1.3;vertical-align:middle;';

    const allLinks = post.querySelectorAll<HTMLAnchorElement>('a[href*="member.php?u="], a.bigusername[href*="member.php"]');
    const authorLink = allLinks.length > 0 ? allLinks[allLinks.length - 1] : null;
    if (authorLink) {
      if (isMobileV1) {
        const parent = authorLink.parentNode;
        if (parent) {
          const wrap = document.createElement('span');
          wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';
          parent.insertBefore(wrap, authorLink);
          wrap.appendChild(badge);
          wrap.appendChild(authorLink);
        }
      } else {
        authorLink.parentNode?.insertBefore(badge, authorLink);
      }
    }
  });
}

import { getUsers, saveUsers } from './storage';
import { toast, log } from './toast';
import { cleanUser } from './utils';
import { getAutoReloadIgnore, getShowPlaceholder, getDisablePostHiding } from './config';
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

function findPostAuthor(post: HTMLElement): string | null {
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

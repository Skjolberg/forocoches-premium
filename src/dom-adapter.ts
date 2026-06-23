import { log } from './toast';
import { cleanUser } from './utils';

export type Theme = 'legacy' | 'v2';

export interface DomAdapter {
  readonly theme: Theme;
  getThreadContainer(anchor: HTMLAnchorElement): HTMLElement | null;
  getExtraContainer(container: HTMLElement): HTMLElement | null;
  getMessageCount(container: HTMLElement | null, extraContainer: HTMLElement | null): number;
  getThreadAuthor(container: HTMLElement | null, extraContainer: HTMLElement | null, title: string): string;
  getSummaryTarget(): HTMLElement | null;
  getPostContainer(element: HTMLElement): HTMLElement | null;
  getLinkRow(post: HTMLElement): HTMLElement | null;
  getSeparator(container: HTMLElement): HTMLElement | null;
  getOPAuthor(doc: Document): string;
}

// ── Detection ────────────────────────────────────────────

function detectTheme(): Theme {
  return document.querySelector('div.threads-list, div.postbit_wrapper, separator') ? 'v2' : 'legacy';
}

let cachedAdapter: DomAdapter | null = null;

export function detectAdapter(): DomAdapter {
  if (!cachedAdapter) {
    cachedAdapter = detectTheme() === 'v2' ? createV2Adapter() : createLegacyAdapter();
  }
  return cachedAdapter;
}

export function resetAdapter(): void {
  cachedAdapter = null;
}

// ── Legacy adapter ────────────────────────────────────────

function createLegacyAdapter(): DomAdapter {
  function getThreadContainer(anchor: HTMLAnchorElement): HTMLElement | null {
    const li = anchor.closest('li');
    if (li) return li;

    let parent: HTMLElement | null = anchor.parentNode as HTMLElement;
    for (let i = 0; i < 15; i++) {
      if (!parent) break;
      if (parent.tagName === 'DIV' && parent.parentNode && (parent.parentNode as HTMLElement).tagName === 'SECTION') return parent;
      if (parent.tagName === 'SECTION') {
        const children = parent.children;
        for (let childIdx = 0; childIdx < children.length; childIdx++) {
          if (children[childIdx].contains(anchor)) return children[childIdx] as HTMLElement;
        }
        break;
      }
      parent = parent.parentNode as HTMLElement;
    }

    const tr = anchor.closest('tr');
    if (tr) return tr;

    return anchor.parentNode as HTMLElement;
  }

  function getExtraContainer(container: HTMLElement): HTMLElement | null {
    if (container.tagName === 'LI') {
      const nextLI = container.nextElementSibling;
      if (nextLI && nextLI.tagName === 'LI') return nextLI as HTMLElement;
    }
    return null;
  }

  function getMessageCount(container: HTMLElement | null, extraContainer: HTMLElement | null): number {
    if (!container) return -1;
    const text = (container.textContent || '').replace(/\xA0/g, ' ');

    const msgMatch = text.match(/(\d+)\s*Mensajes?/i);
    if (msgMatch) return parseInt(msgMatch[1], 10);

    const countMatch = text.match(/(\d+)\s+@\s+[a-zA-Z0-9_\-.]+/i);
    if (countMatch) return parseInt(countMatch[1], 10);

    if (extraContainer) {
      const extraText = extraContainer.textContent.trim();
      const m = extraText.match(/^\d+\s*Mensajes?\s*,/i);
      if (m) {
        const cm = extraText.match(/^(\d+)/);
        if (cm) return parseInt(cm[1], 10);
      }
    }

    return -1;
  }

  function extractAuthorLegacy(container: HTMLElement | null, title: string): string {
    if (!container) return '';

    try {
      const fullText = container.textContent || '';
      const match = fullText.match(/@([a-zA-Z0-9_\-.\xA0]+?)\s*-\s*(Actualizado|Ayer|Hoy|Anteayer)/i);
      if (match && match[1]) return match[1].replace(/\xA0/g, '').toLowerCase();
    } catch (_) { /* ignore */ }

    if (title) {
      const msgMatch = title.match(/^\d+\s*Mensajes?\s*,/i);
      if (msgMatch) {
        const parts = title.trim().split(/\s+/);
        if (parts.length > 0) return parts[parts.length - 1].toLowerCase();
      }
    }

    try {
      const elements = container.querySelectorAll('*');
      for (let i = elements.length - 1; i >= 0; i--) {
        const text = elements[i].textContent.trim();
        if (text.indexOf('@') === 0) {
          if (text.indexOf(' - ') !== -1) return text.split(' - ')[0].substring(1).toLowerCase();
          const parts = text.replace('@', '').split(/[\s]+/);
          if (parts.length > 0 && parts[0]) return parts[0].toLowerCase();
        }
      }
    } catch (_) { /* ignore */ }

    try {
      const memberLink = container.querySelector('a[href*="member.php"]') as HTMLAnchorElement | null;
      if (memberLink) return cleanUser(memberLink.textContent);
    } catch (_) { /* ignore */ }

    try {
      const postLinks = container.querySelectorAll('a[href*="showthread.php?p="], a[href*="#post"]');
      for (let linkIdx = 0; linkIdx < postLinks.length; linkIdx++) {
        const linkText = postLinks[linkIdx].textContent.trim();
        const match = linkText.match(/@([a-zA-Z0-9_\-\.]+)/);
        if (match) return match[1].toLowerCase();
      }
    } catch (_) { /* ignore */ }

    return '';
  }

  function getThreadAuthor(container: HTMLElement | null, extraContainer: HTMLElement | null, title: string): string {
    if (!container) return '';

    if (extraContainer) {
      const nextText = extraContainer.textContent.trim();
      const m = nextText.match(/^\d+\s*Mensajes?\s*,/i);
      if (m) {
        const userMatch = nextText.match(/\)\s+(.+)$/);
        if (userMatch) return userMatch[1].trim().toLowerCase();
      }
    }

    return extractAuthorLegacy(container, title);
  }

  function getSummaryTarget(): HTMLElement | null {
    const sections = document.querySelectorAll('section');
    if (sections.length > 0) return sections[sections.length - 1];
    return document.querySelector('div.threads-list') || document.querySelector('main') || document.querySelector('#threadslist') || document.body;
  }

  function getPostContainer(element: HTMLElement): HTMLElement | null {
    let parentEl: HTMLElement | null = element.parentNode as HTMLElement;
    while (parentEl && parentEl !== document.body) {
      if (parentEl.tagName === 'LI' && parentEl.classList.contains('link')) {
        const ul = parentEl.closest('ul');
        if (ul) return ul.querySelector<HTMLElement>('li.postbit');
        return null;
      }
      if (parentEl.tagName === 'LI' && parentEl.classList.contains('postbit')) {
        return parentEl;
      }
      parentEl = parentEl.parentNode as HTMLElement;
    }
    return null;
  }

  function getLinkRow(post: HTMLElement): HTMLElement | null {
    if (post.tagName === 'LI' && post.classList.contains('postbit')) {
      const ul = post.closest('ul');
      if (ul) return ul.querySelector<HTMLElement>('li.link');
    }
    return null;
  }

  function getSeparator(): HTMLElement | null {
    return null;
  }

  function getOPAuthor(doc: Document): string {
    const links: string[] = [];
    doc.querySelectorAll<HTMLAnchorElement>('a[href*="member.php?u="]').forEach(function (ml) {
      const txt = ml.textContent.trim();
      if (txt) links.push(txt);
    });
    if (links.length >= 2) return cleanUser(links[1]);
    return '';
  }

  return {
    theme: 'legacy' as Theme,
    getThreadContainer,
    getExtraContainer,
    getMessageCount,
    getThreadAuthor,
    getSummaryTarget,
    getPostContainer,
    getLinkRow,
    getSeparator,
    getOPAuthor,
  };
}

// ── V2 adapter ────────────────────────────────────────────

function createV2Adapter(): DomAdapter {
  function getThreadContainer(anchor: HTMLAnchorElement): HTMLElement | null {
    let el: HTMLElement | null = anchor.parentElement;
    for (let i = 0; i < 10 && el; i++) {
      if (el.parentElement && el.parentElement.classList.contains('threads-list')) return el;
      el = el.parentElement as HTMLElement;
    }
    return null;
  }

  function getExtraContainer(): HTMLElement | null {
    return null;
  }

  function getMessageCount(container: HTMLElement | null): number {
    if (!container) return -1;
    const text = (container.textContent || '').replace(/\xA0/g, ' ');

    const msgMatch = text.match(/(\d+)\s*Mensajes?/i);
    if (msgMatch) return parseInt(msgMatch[1], 10);

    const countMatch = text.match(/(\d+)\s+@\s+[a-zA-Z0-9_\-.]+/i);
    if (countMatch) return parseInt(countMatch[1], 10);

    return -1;
  }

  function extractAuthorV2(container: HTMLElement | null): string {
    if (!container) return '';

    const sep = container.nextElementSibling;
    if (sep && sep.tagName === 'SEPARATOR') {
      const sepText = sep.textContent || '';
      const m = sepText.match(/@([a-zA-Z0-9_\-.\xA0]+)/i);
      if (m) return m[1].replace(/\xA0/g, '').toLowerCase();
    }

    const parentArea = container.parentElement;
    if (parentArea) {
      const memberLinks = parentArea.querySelectorAll<HTMLAnchorElement>('a[href*="member.php"]');
      for (let i = 0; i < memberLinks.length; i++) {
        const name = cleanUser(memberLinks[i].textContent);
        if (name) return name;
      }
    }

    const fullText1 = container.textContent || '';
    const arrMatches = fullText1.match(/@([a-zA-Z0-9_\-.\xA0]+)/gi);
    if (arrMatches && arrMatches.length > 0) {
      const first = arrMatches[0].replace('@', '').replace(/\xA0/g, '').toLowerCase();
      if (first) return first;
    }

    const fullText2 = container.textContent || '';
    const m4 = fullText2.match(/(\d+)\s+@\s+([a-zA-Z0-9_\-.]+)/i);
    if (m4 && m4[2]) {
      const user = m4[2].replace(/\xA0/g, '').toLowerCase();
      if (user.length >= 2 && user.length <= 25 && /[a-zA-Z]/.test(user)) return user;
    }

    return '';
  }

  function getThreadAuthor(container: HTMLElement | null): string {
    return extractAuthorV2(container);
  }

  function getSummaryTarget(): HTMLElement | null {
    return document.querySelector('div.threads-list') || document.querySelector('section') || document.querySelector('main') || document.querySelector('#threadslist') || document.body;
  }

  function getPostContainer(element: HTMLElement): HTMLElement | null {
    let parentEl: HTMLElement | null = element.parentNode as HTMLElement;
    while (parentEl && parentEl !== document.body) {
      if (/^edit\d+$/.test(parentEl.id)) return parentEl;
      parentEl = parentEl.parentNode as HTMLElement;
    }
    return null;
  }

  function getLinkRow(): HTMLElement | null {
    return null;
  }

  function getSeparator(container: HTMLElement): HTMLElement | null {
    const sep = container.nextElementSibling;
    if (sep && (sep.tagName === 'SEPARATOR' || sep.tagName === 'SEPARATOR-LARGE')) return sep as HTMLElement;
    return null;
  }

  function getOPAuthor(doc: Document): string {
    const firstPost = doc.querySelector<HTMLElement>('div[id^="edit"], li.postbit');
    if (firstPost) {
      const memberLinks = firstPost.querySelectorAll<HTMLAnchorElement>('a[href*="member.php?u="]');
      for (let i = 0; i < memberLinks.length; i++) {
        const txt = memberLinks[i].textContent.trim();
        if (txt) return cleanUser(txt);
      }
    }
    return '';
  }

  return {
    theme: 'v2' as Theme,
    getThreadContainer,
    getExtraContainer,
    getMessageCount,
    getThreadAuthor,
    getSummaryTarget,
    getPostContainer,
    getLinkRow,
    getSeparator,
    getOPAuthor,
  };
}

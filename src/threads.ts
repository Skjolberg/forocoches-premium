import { log } from './toast';
import type { ThreadInfo } from './types';
import { detectAdapter } from './dom-adapter';

function extractTitle(anchor: HTMLAnchorElement): string {
  const span = anchor.querySelector('span');
  if (span && span.textContent.trim()) return span.textContent.trim();
  if (anchor.textContent.trim()) return anchor.textContent.trim();
  if (anchor.title) return anchor.title;
  return '';
}

export function findThreads(): ThreadInfo[] {
  const ad = detectAdapter();
  const results: ThreadInfo[] = [];
  const seenHref = new Set<string>();
  const seenContainer = new Set<HTMLElement>();

  const allLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="showthread.php?t="], a[id^="thread_title_"]');
  log('THREADS', `Enlaces encontrados: ${allLinks.length}`);
  allLinks.forEach(function (anchor) {
    const hrefKey = anchor.href.replace(/#.*$/, '');
    if (seenHref.has(hrefKey)) return;
    seenHref.add(hrefKey);

    const title = extractTitle(anchor);
    if (!title) return;

    const container = ad.getThreadContainer(anchor);
    if (!container) return;
    if (seenContainer.has(container)) return;
    seenContainer.add(container);

    const extraContainer = ad.getExtraContainer(container);
    const messageCount = ad.getMessageCount(container, extraContainer);
    const author = ad.getThreadAuthor(container, extraContainer, title);

    results.push({
      container: container,
      extraContainer: extraContainer,
      a: anchor,
      title: title,
      author: author,
      messageCount: messageCount,
    });
  });

  log('THREADS', `Total hilos extraidos: ${results.length} (${results.filter(t => t.messageCount >= 0).length} con mensajes)`);
  return results;
}

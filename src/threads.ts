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
  const seen = new Set<string>();

  const allLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="showthread.php?t="], a[id^="thread_title_"]');
  log('THREADS', `Enlaces encontrados: ${allLinks.length}`);
  allLinks.forEach(function (anchor) {
    if (seen.has(anchor.href)) return;
    seen.add(anchor.href);

    const container = ad.getThreadContainer(anchor);
    if (!container) return;

    const title = extractTitle(anchor);
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

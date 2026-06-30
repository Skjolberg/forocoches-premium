import { toast, log } from './toast';
import { normalizeStr } from './utils';
import { findThreads } from './threads';
import type { HiddenItem } from './types';
import { getHideThreadByAuthor, getHighlightZeroMessages, getHighlightColor } from './config';
import { detectAdapter } from './dom-adapter';
import { STYLE } from './ui/styles';

// run() is defined in runner.ts

function showHiddenSummary(hidden: HiddenItem[]): void {
  const old = document.getElementById('fc-hidden-summary');
  if (old) old.remove();

  const target = detectAdapter().getSummaryTarget();

  const wrap = document.createElement('div');
  wrap.id = 'fc-hidden-summary';
  wrap.style.cssText = STYLE.HIDDEN_SUMMARY;

  const header = document.createElement('div');
  header.style.cssText = STYLE.HIDDEN_HEADER;
  header.textContent = 'Hilos ocultos: ' + hidden.length;
  wrap.appendChild(header);

  hidden.forEach((item) => {
    const row = document.createElement('div');
    row.style.cssText = STYLE.HIDDEN_ROW;

    const el = document.createElement('span');
    el.style.cssText = 'text-decoration:line-through;';
    if (item.link) {
      const anchor = document.createElement('a');
      anchor.href = item.link; anchor.textContent = item.title;
      anchor.style.cssText = 'color:inherit;text-decoration:line-through;'; anchor.target = '_blank';
      el.appendChild(anchor);
    } else { el.textContent = item.title; }

    const info = document.createElement('span');
    info.style.cssText = STYLE.HIDDEN_INFO;
    info.textContent = `(${item.reason})`;

    row.appendChild(el);
    row.appendChild(info);
    wrap.appendChild(row);
  });

  target!.parentNode!.insertBefore(wrap, target!.nextSibling);
}

function matchWordsInText(text: string, words: string[], prefix?: string): string {
  const normalized = normalizeStr(text);
  for (const word of words) {
    if (word && normalized.indexOf(normalizeStr(word)) !== -1) {
      return `${prefix || ''}"${word}"`;
    }
  }
  return '';
}

let lastHiddenCount = -1;

export function hideThreads(users: string[], words: string[]): void {
  const threads = findThreads();
  if (threads.length === 0) { toast('No se encontraron hilos'); return; }

  const hidden: HiddenItem[] = [];
  const total = threads.length;

  const ad = detectAdapter();
  const hideByAuthor = getHideThreadByAuthor();

  threads.forEach((thread) => {
    if (!thread.container) return;
    if (thread.container.style.display === 'none') return;

    let reason = '';

    // 1) By author (mobile-v2, desktop-v1, desktop-v2 when config enabled)
    if (users.length > 0 && thread.author && (ad.theme === 'mobile-v2' || ad.theme === 'desktop-v1' || ad.theme === 'desktop-v2') && hideByAuthor) {
      if (users.indexOf(thread.author) !== -1) reason = '@' + thread.author;
    }

    // 2) By keyword in title
    if (!reason && words.length > 0 && thread.title) {
      reason = matchWordsInText(thread.title, words);
    }

    // 3) RAW fallback (threads without title element)
    if (!reason && words.length > 0 && !thread.title && thread.container.textContent) {
      reason = matchWordsInText(thread.container.textContent, words, 'RAW:');
    }

    if (reason) {
      hidden.push({
        container: thread.container,
        extraContainer: thread.extraContainer,
        title: thread.title,
        author: thread.author,
        reason,
        link: thread.a ? thread.a.href : '',
      });
    }
  });

  hidden.forEach((item) => {
    if (item.container) item.container.style.display = 'none';
    if (item.extraContainer) item.extraContainer.style.display = 'none';
    const sep = detectAdapter().getSeparator(item.container!);
    if (sep) sep.style.display = 'none';
  });

  // Highlight threads with 0 messages
  const hzm = getHighlightZeroMessages();
  const hzColor = getHighlightColor();
  if (hzm) {
    threads.forEach((thread) => {
      if (!thread.container) return;
      if (thread.messageCount === 0) {
        thread.container.style.background = hzColor;
        thread.container.querySelectorAll<HTMLElement>('td').forEach(function (td) { td.style.background = hzColor; });
      }
    });
  }

  if (hidden.length > 0) {
    if (hidden.length !== lastHiddenCount) {
      lastHiddenCount = hidden.length;
      log('HIDE', `Ocultados ${hidden.length} de ${total}`);
    }
    showHiddenSummary(hidden);
    toast(`Hilos ocultados: ${hidden.length}`);
  }
}

import { log } from '../toast';
import { getUsers, saveUsers } from '../storage';
import { syncIgnored, removeFromFCIgnore } from '../ignore-fc';
import { toast } from '../toast';
import { getShowScrollUp, getShowScrollDown, getShowPoleButton, getPoleMessage, getPoleSearchPages } from '../config';
import { buildUsersTab, renderUserList } from './tab-users';
import { buildWordsTab } from './tab-words';
import { buildConfigTab } from './tab-config';
import { buildLogsTab } from './tab-logs';
import { run } from '../runner';
import { findThreads } from '../threads';
import { QUICK_REPLY_SELECTOR } from '../selectors';
import { STYLE, COLORS } from './styles';

// ============================================================
//  GLOBAL STATE
// ============================================================

let content: HTMLElement | null = null;
let panelListDiv: HTMLElement | null = null;

// ============================================================
//  UPDATE PANEL LIST
// ============================================================

export function updatePanelList(): void {
  const titleEl = document.getElementById('fcp-users-title');
  if (titleEl) titleEl.textContent = `Ignorados del foro (${getUsers().length})`;
  renderUserList(panelListDiv, getUsers(), (u) => {
    log('PANEL', `Eliminando usuario @${u} desde el panel`);
    saveUsers(getUsers().filter((x) => x !== u));
    updatePanelList();
    toast(`Eliminado @${u} de FC Premium`);
    removeFromFCIgnore(u);
    run();
  });
}

// ============================================================
//  TOGGLE PANEL
// ============================================================

export function togglePanel(): void {
  let panel = document.getElementById('fcp-panel');
  if (panel) { log('PANEL', 'Cerrando panel'); panel.remove(); return; }
  log('PANEL', 'Abriendo panel');

  panel = document.createElement('div');
  panel.id = 'fcp-panel';
  panel.style.cssText = STYLE.PANEL;

  const tabBar = document.createElement('div');
  tabBar.style.cssText = STYLE.TAB_BAR;

  const tabUsers = document.createElement('div'); tabUsers.textContent = 'Usuarios';
  tabUsers.style.cssText = STYLE.TAB_ACTIVE;
  const tabWords = document.createElement('div'); tabWords.textContent = 'Palabras';
  tabWords.style.cssText = STYLE.TAB_INACTIVE;
  const tabConfig = document.createElement('div'); tabConfig.textContent = 'Config';
  tabConfig.style.cssText = 'width:45px;text-align:center;padding:6px 2px;cursor:pointer;font-size:13px;color:#999;';
  const tabLogs = document.createElement('div'); tabLogs.textContent = 'Logs';
  tabLogs.title = 'Ver logs de depuracion';
  tabLogs.style.cssText = 'width:40px;text-align:center;padding:6px 2px;cursor:pointer;font-size:13px;color:#999;';

  tabBar.appendChild(tabUsers);
  tabBar.appendChild(tabWords);
  tabBar.appendChild(tabConfig);
  tabBar.appendChild(tabLogs);

  content = document.createElement('div');
  content.id = 'fcp-content';
  content.style.cssText = STYLE.PANEL_CONTENT;

  function resetTabs(): void {
    tabUsers.style.cssText = STYLE.TAB_INACTIVE;
    tabWords.style.cssText = STYLE.TAB_INACTIVE;
    tabConfig.style.cssText = 'width:45px;text-align:center;padding:6px 2px;cursor:pointer;font-size:13px;color:#999;';
    tabLogs.style.cssText = 'width:40px;text-align:center;padding:6px 2px;cursor:pointer;font-size:13px;color:#999;';
  }

  tabUsers.addEventListener('click', () => {
    log('PANEL', 'Tab: Usuarios'); resetTabs();
    tabUsers.style.cssText = STYLE.TAB_ACTIVE;
    if (content) panelListDiv = buildUsersTab(content);
  });
  tabWords.addEventListener('click', () => {
    log('PANEL', 'Tab: Palabras'); resetTabs();
    tabWords.style.cssText = STYLE.TAB_ACTIVE;
    if (content) buildWordsTab(content);
  });
  tabConfig.addEventListener('click', () => {
    log('PANEL', 'Tab: Config'); resetTabs();
    tabConfig.style.cssText = 'width:45px;text-align:center;padding:6px 2px;cursor:pointer;font-size:13px;font-weight:bold;color:#FD5D4D;';
    if (content) buildConfigTab(content);
  });
  tabLogs.addEventListener('click', () => {
    log('PANEL', 'Tab: Logs'); resetTabs();
    tabLogs.style.cssText = 'width:40px;text-align:center;padding:6px 2px;cursor:pointer;font-size:13px;font-weight:bold;color:#FD5D4D;';
    if (content) buildLogsTab(content);
  });

  panel.appendChild(tabBar);
  panel.appendChild(content);

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:12px 12px 4px;text-align:center;font-size:11px;color:#777;';
  footer.innerHTML = '<a href="https://github.com/Skjolberg/forocoches-premium" target="_blank" style="color:#FD5D4D;text-decoration:none;">GitHub</a>';
  panel.appendChild(footer);

  panelListDiv = buildUsersTab(content);
  document.body.appendChild(panel);
}

// ============================================================
//  BUILD UI (floating button)
// ============================================================

export function buildUI(): void {
  if (document.getElementById('fcp-ui')) { log('UI', 'buildUI ya existia, salteando'); return; }
  log('UI', 'Creando botones flotantes');

  const wrap = document.createElement('div');
  wrap.id = 'fcp-ui';
  wrap.style.cssText = STYLE.FLOAT_WRAP;

  // Scroll-to-top button
  const upBtn = document.createElement('button');
  upBtn.id = 'fcp-up-btn';
  upBtn.title = 'Subir arriba';
  upBtn.style.cssText = STYLE.FLOAT_BTN;
  upBtn.textContent = '\u25B2';
  upBtn.addEventListener('click', () => { log('UI', 'Scroll UP'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  upBtn.addEventListener('mouseenter', () => { upBtn.style.background = COLORS.PRIMARY; upBtn.style.borderColor = COLORS.PRIMARY; });
  upBtn.addEventListener('mouseleave', () => { upBtn.style.background = COLORS.DARK_BG; upBtn.style.borderColor = COLORS.DARK_BG; });
  if (!getShowScrollUp()) { upBtn.style.display = 'none'; }
  wrap.appendChild(upBtn);

  // Scroll-to-bottom button
  const downBtn = document.createElement('button');
  downBtn.id = 'fcp-down-btn';
  downBtn.title = 'Bajar abajo';
  downBtn.style.cssText = STYLE.FLOAT_BTN;
  downBtn.textContent = '\u25BC';
  downBtn.addEventListener('click', () => {
    log('UI', 'Scroll DOWN');
    const qr = document.querySelector<HTMLTextAreaElement>(QUICK_REPLY_SELECTOR);
    if (qr) {
      log('UI', 'Encontrada caja de texto, scrolleando...');
      const top = qr.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { qr.focus(); }, 400);
    } else {
      log('UI', 'Sin caja de texto, yendo al final');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  });
  downBtn.addEventListener('mouseenter', () => { downBtn.style.background = COLORS.PRIMARY; downBtn.style.borderColor = COLORS.PRIMARY; });
  downBtn.addEventListener('mouseleave', () => { downBtn.style.background = COLORS.DARK_BG; downBtn.style.borderColor = COLORS.DARK_BG; });
  if (!getShowScrollDown()) { downBtn.style.display = 'none'; }
  wrap.appendChild(downBtn);

  // Pole button
  const poleBtn = document.createElement('button');
  poleBtn.id = 'fcp-pole-btn';
  poleBtn.title = 'Pole: responder al primer hilo sin respuestas';
  poleBtn.style.cssText = 'width:44px;height:44px;border-radius:22px;border:2px solid #FD5D4D;background:#FD5D4D;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;padding:0;font-size:20px;color:white;line-height:1;';
  const poleIcon = document.createElement('span');
  poleIcon.textContent = '\uD83C\uDFCE\uFE0F';
  poleIcon.style.cssText = 'display:block;line-height:1;margin-top:-6px;';
  poleBtn.appendChild(poleIcon);
  poleBtn.addEventListener('click', () => {
    log('UI', 'POLE');
    if (window.location.pathname.indexOf('forumdisplay.php') === -1) {
      toast('Solo disponible en listado de hilos'); return;
    }
    const threads = findThreads();
    let target: string | null = null;
    for (let pi = 0; pi < threads.length; pi++) {
      if (threads[pi].messageCount === 0 && threads[pi].a?.href) {
        target = threads[pi].a!.href;
        break;
      }
    }
    if (!target && getPoleSearchPages()) {
      const pageMatch = window.location.href.match(/page=(\d+)/);
      const curPage = pageMatch ? parseInt(pageMatch[1], 10) : 1;
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      const baseUrl = url.href;
      const searchData = JSON.stringify({ baseUrl, page: curPage });
      try { localStorage.setItem('fc_pole_search', searchData); } catch { toast('Error al guardar datos de busqueda', 3000); }
      const params = new URLSearchParams(url.search);
      params.set('page', String(curPage + 1));
      const nextUrl = `${url.origin}${url.pathname}?${params.toString()}`;
      const msg = getPoleMessage();
      try { localStorage.setItem('fc_pole_msg', msg); } catch { toast('Error al guardar el mensaje', 3000); }
      log('POLE', `Sin hilos en p\u00E1gina ${curPage}, buscando en ${nextUrl}`);
      toast(`Buscando en p\u00E1gina ${curPage + 1}...`, 3000);
      window.location.href = nextUrl;
      return;
    }
    if (!target) { toast('No hay hilos sin respuestas'); return; }
    const msg = getPoleMessage();
    try { localStorage.setItem('fc_pole_msg', msg); } catch { toast('Error al guardar el mensaje', 3000); }
    log('POLE', `Navegando a: ${target}`, `Mensaje: ${msg}`);
    window.location.href = target;
  });
  poleBtn.addEventListener('mouseenter', () => { poleBtn.style.background = '#E04A3A'; poleBtn.style.borderColor = '#E04A3A'; });
  poleBtn.addEventListener('mouseleave', () => { poleBtn.style.background = '#FD5D4D'; poleBtn.style.borderColor = '#FD5D4D'; });
  if (!getShowPoleButton()) { poleBtn.style.display = 'none'; }
  wrap.appendChild(poleBtn);

  const btn = document.createElement('button');
  btn.id = 'fcp-btn';
  btn.title = 'FC Premium';
  btn.style.cssText = STYLE.FC_BTN;
  const ico = document.createElement('img');
  ico.src = 'https://forocoches.com/favicon.ico';
  ico.style.cssText = STYLE.FC_ICON;
  ico.alt = 'FC';
  btn.appendChild(ico);
  btn.addEventListener('click', () => { togglePanel(); });
  wrap.appendChild(btn);
  document.body.appendChild(wrap);
}

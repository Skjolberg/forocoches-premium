import { log } from './toast';

const KEY_USERS = 'fc_ignored_users';
const KEY_WORDS = 'fc_ignored_words';

export function getUsers(): string[] {
  try {
    const data = localStorage.getItem(KEY_USERS);
    if (data) { const parsed = JSON.parse(data); if (Array.isArray(parsed)) return parsed; }
  } catch (_) { /* ignore */ }
  return [];
}

export function saveUsers(list: string[]): void {
  try { localStorage.setItem(KEY_USERS, JSON.stringify(list)); } catch (_) { /* ignore */ }
  log('STORAGE', 'saveUsers: ' + list.length + ' usuarios');
}

export function getWords(): string[] {
  try {
    const data = localStorage.getItem(KEY_WORDS);
    if (data) { const parsed = JSON.parse(data); if (Array.isArray(parsed)) return parsed; }
  } catch (_) { /* ignore */ }
  return [];
}

export function saveWords(list: string[]): void {
  try { localStorage.setItem(KEY_WORDS, JSON.stringify(list)); } catch (_) { /* ignore */ }
  log('STORAGE', 'saveWords: ' + list.length + ' palabras');
}

const KEY_CONFIG = 'fc_config';

export interface FCConfig {
  autoMinimize?: boolean;
  autoMinimizeWords?: boolean;
  autoRedirectOP?: boolean;
  autoReloadIgnore?: boolean;
  showScrollUp?: boolean;
  showScrollDown?: boolean;
  showPlaceholder?: boolean;
  disablePostHiding?: boolean;
  hideThreadByAuthor?: boolean;
  highlightZeroMessages?: boolean;
  highlightZeroMessagesColor?: string;
  showPoleButton?: boolean;
  poleMessage?: string;
  poleSearchPages?: boolean;
}

export function getConfig(): FCConfig {
  try {
    const data = localStorage.getItem(KEY_CONFIG);
    if (data) { const parsed = JSON.parse(data); if (typeof parsed === 'object') return parsed; }
  } catch (_) { /* ignore */ }
  return {};
}

export function saveConfig(config: FCConfig): void {
  try { localStorage.setItem(KEY_CONFIG, JSON.stringify(config)); } catch (_) { /* ignore */ }
  log('STORAGE', 'saveConfig: ' + JSON.stringify(config));
}

export function exportData(): string {
  const data: Record<string, unknown> = {};
  data[KEY_CONFIG] = getConfig();
  data[KEY_WORDS] = getWords();
  data[KEY_USERS] = getUsers();
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (typeof data !== 'object' || data === null) return false;
    let imported = false;
    if (typeof data[KEY_CONFIG] === 'object' && data[KEY_CONFIG] !== null) {
      saveConfig(data[KEY_CONFIG] as FCConfig);
      imported = true;
    }
    if (Array.isArray(data[KEY_WORDS])) {
      saveWords(data[KEY_WORDS] as string[]);
      imported = true;
    }
    if (Array.isArray(data[KEY_USERS])) {
      saveUsers(data[KEY_USERS] as string[]);
      imported = true;
    }
    return imported;
  } catch (_) { return false; }
}

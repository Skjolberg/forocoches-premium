export function cleanUser(n: string): string {
  if (!n) return '';
  return n.replace('@', '').trim().toLowerCase();
}

export function normalizeStr(s: string): string {
  return s.toLowerCase()
    .replace(/ñ/g, '\0')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\0/g, 'ñ');
}

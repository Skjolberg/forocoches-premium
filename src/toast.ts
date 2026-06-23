import { STYLE } from './ui/styles';

export const debugLog: string[] = [];

function ts(): string {
  var d = new Date();
  return d.toLocaleString('es-ES', { hour12: false }) + '.' +
    String(d.getMilliseconds()).padStart(3, '0');
}

export function log(module: string, ...messages: string[]): void {
  const time = ts();
  const prefix = `${time} [${module}]`;
  debugLog.push(prefix + ' ' + messages.join(' | '));
}

let toastId: ReturnType<typeof setTimeout> | null = null;

export function toast(msg: string, dur?: number): void {
  dur = dur || 4000;
  let div = document.getElementById('fc-toast') as HTMLDivElement | null;
  if (!div) {
    div = document.createElement('div');
    div.id = 'fc-toast';
    div.style.cssText = STYLE.TOAST;
    document.body.appendChild(div);
  }
  div.textContent = msg;
  div.style.opacity = '1';
  if (toastId !== null) clearTimeout(toastId);
  toastId = setTimeout(function () {
    div!.style.opacity = '0';
    toastId = setTimeout(function () {
      if (div!.parentNode) div!.parentNode.removeChild(div!);
      toastId = null;
    }, 300);
  }, dur);
}

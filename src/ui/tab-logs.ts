import { toast, debugLog } from '../toast';
import { STYLE } from './styles';

// ============================================================
//  BUILD LOGS TAB
// ============================================================

export function buildLogsTab(content: HTMLElement): void {
  content.innerHTML = '';
  content.style.minHeight = '200px';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:4px;margin-bottom:8px;';

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Limpiar logs';
  clearBtn.style.cssText = 'border:none;background:#FD5D4D;color:white;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:bold;';
  clearBtn.addEventListener('click', () => { debugLog.length = 0; buildLogsTab(content); });
  btnRow.appendChild(clearBtn);

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copiar logs';
  copyBtn.style.cssText = 'border:none;background:#4A90D9;color:white;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;font-weight:bold;';
  copyBtn.addEventListener('click', () => {
    const text = debugLog.length > 0 ? debugLog.join('\n') : '(sin logs)';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { toast('Logs copiados al portapapeles'); });
    } else {
      const ta = document.createElement('textarea'); ta.value = text;
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      toast('Logs copiados al portapapeles');
    }
  });
  btnRow.appendChild(copyBtn);

  content.appendChild(btnRow);

  const pre = document.createElement('pre');
  pre.style.cssText = 'font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;line-height:1.4;';
  pre.textContent = debugLog.length > 0 ? debugLog.join('\n') : '(sin logs aun)';
  content.appendChild(pre);
}

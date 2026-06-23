import { log } from './toast';
import { run } from './runner';

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function startObserver(): void {
  if (observer) { observer.disconnect(); log('OBSERVER', 'Reconectando observer'); }
  else { log('OBSERVER', 'Observer iniciado'); }

  observer = new MutationObserver(() => {
    if (debounceTimer === null) log('OBSERVER', 'Mutaciones detectadas, programando run...');
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      run();
      debounceTimer = null;
    }, 150);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

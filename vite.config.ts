import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { version } from './package.json';

export default defineConfig({
  define: {
    __FC_VERSION__: JSON.stringify(version),
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Forocoches Premium',
        namespace: 'https://greasyfork.org/es/users/1607118-unknown-1',
        version,
        description:
          'Oculta hilos por usuarios ignorados Y palabras clave, ignora mensajes de usuarios, poles automáticas, entre otras funciones.',
        author: 'skjolberg',
        match: 'https://forocoches.com/foro/*',
        grant: 'none',
        license: 'MIT',
      },
    }),
  ],
  build: {
    minify: 'esbuild',
    reportCompressedSize: false,
  },
});

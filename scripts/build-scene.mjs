// Bundles src/scene/* (+ three.js) into site/assets/js/scene3d.js. Run: npm run build:scene
import { build } from 'esbuild';
import { statSync } from 'node:fs';

await build({
  entryPoints: ['src/scene/index.js'],
  bundle: true, format: 'esm', minify: true, target: 'es2020', legalComments: 'none',
  outfile: 'site/assets/js/scene3d.js',
});
console.log(`scene3d.js ${(statSync('site/assets/js/scene3d.js').size / 1024).toFixed(0)} KB`);

// scripts/prepare-dist.js
// Copies index.html and styles.css into dist/ after tsc compiles.
// Adjusts the script src from "dist/main.js" → "main.js" for the dist-relative path.
// Node 14+ (no external deps required).

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

// Ensure dist exists
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

// Copy styles.css unchanged
fs.copyFileSync(
  path.join(root, 'styles.css'),
  path.join(dist, 'styles.css')
);

// Copy index.html with the script src path adjusted
const html = fs
  .readFileSync(path.join(root, 'index.html'), 'utf8')
  // The root index.html loads dist/main.js; when served from dist/ it's just main.js
  .replace('src="dist/main.js"', 'src="main.js"');

fs.writeFileSync(path.join(dist, 'index.html'), html, 'utf8');

console.log('dist/ assets prepared (index.html, styles.css)');

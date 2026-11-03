const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const cssPath = path.join(rootDir, 'css', 'styles.css');
const jsFiles = [
  'audio.js',
  'state.js',
  'disk_engine.js',
  'services_engine.js',
  'room_view.js',
  'desktop_ui.js',
  'game.js'
];

let html = fs.readFileSync(indexPath, 'utf-8');
const css = fs.readFileSync(cssPath, 'utf-8');

// Replace CSS link with inline style
html = html.replace(
  '<link rel="stylesheet" href="css/styles.css">',
  `<style>\n${css}\n</style>`
);

// Replace script tags with inline scripts
const scriptTagsRegex = /<!-- Audio and Game Logic Scripts -->[\s\S]*?<\/body>/;

let combinedJs = '';
for (const f of jsFiles) {
  const content = fs.readFileSync(path.join(rootDir, 'js', f), 'utf-8');
  combinedJs += `\n/* === ${f} === */\n${content}\n`;
}

html = html.replace(
  scriptTagsRegex,
  `<!-- Inlined Scripts for Standalone Play -->\n<script>\n${combinedJs}\n</script>\n</body>`
);

const outPath = path.join(rootDir, 'game_standalone.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log('Successfully generated standalone HTML: game_standalone.html');

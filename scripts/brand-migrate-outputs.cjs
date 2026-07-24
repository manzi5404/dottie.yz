const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targetDirs = ['public', 'dist', 'admin/dist', 'frontend/public', 'DOTTIE-frontend/public', 'DOTTIE-backend/public'];

const binaryExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.zip', '.gz', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.mov', '.mp4', '.avi', '.exe']);

const replacements = [
  {re: /Faith Over Fear/gi, to: 'DOTTIE.YZ'},
  {re: /faith over fear/gi, to: 'DOTTIE.YZ'},
  {re: /FaithOverFear/gi, to: 'DOTTIE.YZ'},
  {re: /faith-over-fear/gi, to: 'dottie.yz'},
  {re: /faithoverfear/gi, to: 'dottie.yz'},
  {re: /faith_over_fear/gi, to: 'dottie_yz'},
  {re: /\bFOF\b/gi, to: 'DOTTIE'},
  {re: /F\.O\.F/gi, to: 'DOTTIE'},
  // fof lowercase tokens and classnames
  {re: /\bfof\b/gi, to: 'dottie'},
  {re: /fof-/gi, to: 'dottie-'},
  {re: /-fof-/gi, to: '-dottie-'},
  {re: /text-fof-/gi, to: 'text-dottie-'},
  {re: /bg-fof-/gi, to: 'bg-dottie-'},
  {re: /border-fof-/gi, to: 'border-dottie-'},
  {re: /-fof\b/gi, to: '-dottie'},
  {re: /\bFaith\b/gi, to: 'DOTTIE'},
  {re: /\bFear\b/gi, to: 'YZ'},
  {re: /Genesis Collection/gi, to: 'Signature Collection'},
  {re: /Genesis Drop/gi, to: 'Signature Drop'},
  {re: /\bGenesis\b/gi, to: 'Signature'},
];

function isBinaryFile(file) {
  return binaryExt.has(path.extname(file).toLowerCase());
}

function walkAndReplace(dir) {
  if (!fs.existsSync(dir)) return [];
  const changed = [];
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      changed.push(...walkAndReplace(full));
    } else if (ent.isFile()) {
      if (isBinaryFile(ent.name)) continue;
      try {
        let content = fs.readFileSync(full, 'utf8');
        const original = content;
        for (const {re, to} of replacements) content = content.replace(re, to);
        if (content !== original) {
          fs.writeFileSync(full, content, 'utf8');
          changed.push(full);
          console.log('Updated output file:', full);
        }
      } catch (e) {}
    }
  }
  return changed;
}

let allChanged = [];
for (const d of targetDirs) {
  const full = path.join(root, d);
  console.log('Processing', full);
  allChanged.push(...walkAndReplace(full));
}

console.log('\nDone. Output files changed:', allChanged.length);
for (const f of allChanged) console.log(' -', path.relative(root, f));

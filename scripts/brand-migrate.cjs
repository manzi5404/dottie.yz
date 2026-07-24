const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const excludeDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.kilo', '.gitlab', '.github', 'admin/node_modules']);
const binaryExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.zip', '.gz', '.pdf', '.woff', '.woff2', '.ttf', '.eot', '.mov', '.mp4', '.avi', '.exe']);

const replacements = [
  // Brand names
  {re: /DOTTIE.YZ/gi, to: 'DOTTIE.YZ'},
  {re: /DOTTIE.YZ/gi, to: 'DOTTIE.YZ'},
  {re: /dottie.yz/gi, to: 'dottie.yz'},
  {re: /DOTTIE.YZ/gi, to: 'dottie.yz'},
  {re: /dottie_yz/gi, to: 'dottie_yz'},
  {re: /\bFOF\b/gi, to: 'DOTTIE'},
  {re: /F\.O\.F/gi, to: 'DOTTIE'},
  // Collections
  {re: /Signature Collection/gi, to: 'Signature Collection'},
  {re: /Signature Drop/gi, to: 'Signature Drop'},
  {re: /\bGenesis\b/gi, to: 'Signature'},
  // contemporary streetwear-specific words -> neutral/fashion
  {re: /\bChristian\b/gi, to: 'contemporary streetwear'},
  {re: /\bBible\b/gi, to: 'brand story'},
  {re: /\bScripture\b/gi, to: 'brand text'},
  {re: /\bPsalm[s]?\b/gi, to: 'story'},
  {re: /\bverse[s]?\b/gi, to: 'excerpt'},
  {re: /\bcross(es)?\b/gi, to: ''},
  // URLs and emails
  {re: /https?:\/\/www\.dottie.yz(?:\.\w+)?/gi, to: 'https://www.dottie.yz'},
  {re: /https?:\/\/dottie.yz(?:\.\w+)?/gi, to: 'https://dottie.yz'},
  {re: /dottie.yz/gi, to: 'dottie.yz'},
  {re: /DOTTIE.YZ/gi, to: 'dottie.yz'},
  // generic tokens
  {re: /DOTTIE/gi, to: 'DOTTIE'},
  {re: /YZ/gi, to: 'YZ'},
];

const changedFiles = [];

function isBinaryFile(file) {
  return binaryExt.has(path.extname(file).toLowerCase());
}

function walk(dir) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (excludeDirs.has(ent.name)) continue;
      // rename directories containing brand tokens
      const newName = renameToken(ent.name);
      if (newName !== ent.name) {
        const newFull = path.join(dir, newName);
        try {
          fs.renameSync(full, newFull);
          console.log('Renamed dir:', full, '->', newFull);
        } catch (e) {
          console.error('Failed to rename dir', full, e.message);
        }
        walk(newFull);
        continue;
      }
      walk(full);
    } else if (ent.isFile()) {
      if (isBinaryFile(ent.name)) continue;
      processFile(full);
      // rename files
      const newName = renameToken(ent.name);
      if (newName !== ent.name) {
        const newFull = path.join(dir, newName);
        try {
          fs.renameSync(full, newFull);
          console.log('Renamed file:', full, '->', newFull);
        } catch (e) {
          console.error('Failed to rename file', full, e.message);
        }
      }
    }
  }
}

function renameToken(name) {
  let out = name;
  out = out.replace(/DOTTIE.YZ/gi, 'DOTTIE.YZ');
  out = out.replace(/dottie.yz/gi, 'dottie.yz');
  out = out.replace(/DOTTIE.YZ/gi, 'dottie.yz');
  out = out.replace(/dottie_yz/gi, 'dottie_yz');
  out = out.replace(/DOTTIE/gi, 'DOTTIE');
  out = out.replace(/F\.O\.F/gi, 'DOTTIE');
  return out;
}

function processFile(file) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    for (const {re, to} of replacements) {
      content = content.replace(re, to);
    }
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles.push(file);
      console.log('Updated:', file);
    }
  } catch (e) {
    // skip files that can't be read as text
  }
}

console.log('Starting brand migration from DOTTIE.YZ -> DOTTIE.YZ');
walk(root);
console.log('\nDone. Files changed:', changedFiles.length);
for (const f of changedFiles) console.log(' -', path.relative(root, f));

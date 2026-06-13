#!/usr/bin/env node
/*
 * Minimal smoke test for the DCB_PAD_LivingMeta dashboard.
 *
 * No framework dependency: run with `node tests/smoke.test.js` from the repo root.
 * Exits 0 if all checks pass, 1 otherwise.
 *
 * Checks (deployment-integrity, not statistics):
 *   1. The main HTML and redirect entry-point exist and contain no UTF-8 BOM.
 *   2. Balanced <script>/</script> tags in the main HTML.
 *   3. Every local asset referenced by the HTML (src=/href="assets/...") exists on disk.
 *   4. Every shipped *.js asset parses as valid JavaScript.
 *   5. No unfilled template placeholders ({{...}}, REPLACE_ME, __PLACEHOLDER__) ship.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAIN = path.join(ROOT, 'DCB_PAD_REVIEW.html');
const INDEX = path.join(ROOT, 'index.html');

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log('  ok   - ' + name);
  } else {
    console.log('  FAIL - ' + name + (detail ? '  :: ' + detail : ''));
    failures++;
  }
}

function read(p) { return fs.readFileSync(p, 'utf8'); }
function hasBom(buf) { return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf; }

// 1. Entry points exist, no BOM.
check('DCB_PAD_REVIEW.html exists', fs.existsSync(MAIN));
check('index.html exists', fs.existsSync(INDEX));
check('main HTML has no BOM', !hasBom(fs.readFileSync(MAIN)));
check('index.html has no BOM', !hasBom(fs.readFileSync(INDEX)));

const html = read(MAIN);

// 2. Balanced script tags.
const scriptOpen = (html.match(/<script[ >]/g) || []).length;
const scriptClose = (html.match(/<\/script>/g) || []).length;
check('script tags balanced', scriptOpen === scriptClose, 'open=' + scriptOpen + ' close=' + scriptClose);

// 3. Referenced local assets exist.
const refs = new Set();
const re = /(?:src|href)="(assets\/[^"]+)"/g;
let m;
while ((m = re.exec(html)) !== null) refs.add(m[1]);
let missing = [];
for (const r of refs) { if (!fs.existsSync(path.join(ROOT, r))) missing.push(r); }
check('all referenced local assets exist', missing.length === 0, missing.join(', '));

// 4. Every shipped *.js asset parses.
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
}
const jsFiles = [];
walk(path.join(ROOT, 'assets'), jsFiles);
let badSyntax = [];
for (const f of jsFiles) {
  try { new Function(read(f)); }
  catch (e) { badSyntax.push(path.relative(ROOT, f) + ': ' + e.message.slice(0, 60)); }
}
check('all asset JS files parse (' + jsFiles.length + ' files)', badSyntax.length === 0, badSyntax.join(' | '));

// 5. No unfilled placeholder tokens in the shipped HTML.
const placeholders = html.match(/\{\{[^}]+\}\}|REPLACE_ME|__PLACEHOLDER__/g) || [];
check('no unfilled template placeholders in HTML', placeholders.length === 0, placeholders.slice(0, 3).join(', '));

if (failures === 0) {
  console.log('\nsmoke: PASS (' + (5 + 1) + ' check groups)');
  process.exit(0);
} else {
  console.log('\nsmoke: FAIL (' + failures + ' failing check(s))');
  process.exit(1);
}

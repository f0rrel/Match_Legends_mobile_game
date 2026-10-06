// ACCEPTANCE TEST — ml-19 monster tile module skeleton, sword and shield.
// Expected to FAIL until the task is done (the module does not exist yet).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const MT = require('../../www/js/monster-tiles.js');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const pathData = (svg) => [...String(svg).matchAll(/\sd="([^"]*)"/g)].map((m) => norm(m[1])).filter(Boolean);

function assertSelfColouredSVG(type) {
  const svg = MT.monsterTileSVG(type);
  assert.equal(typeof svg, 'string', type + ' should draw an SVG string');
  assert.match(svg, /^<svg[\s>]/, type + ' should start with an <svg> element');
  assert.ok(/viewBox="0 0 100 100"/.test(svg), type + ' should carry viewBox 0 0 100 100');
  assert.ok(/currentColor/.test(svg), type + ' should paint with currentColor');
  assert.ok(!/#/.test(svg) && !/rgb\(/.test(svg) && !/hsl\(/.test(svg), type + ' should not hard-code a colour');
  assert.ok(pathData(svg).length > 0, type + ' needs at least one silhouette path');
}

test('the module loads and exposes monsterTileSVG', () => {
  assert.equal(typeof MT.monsterTileSVG, 'function');
});

test('an unknown type draws nothing', () => {
  assert.equal(MT.monsterTileSVG('dragon'), '');
  assert.equal(MT.monsterTileSVG(''), '');
});

for (const type of ['sword', 'shield']) {
  test(type + ' draws a self-coloured monster', () => assertSelfColouredSVG(type));
}

test('sword and shield are told apart by silhouette', () => {
  const a = pathData(MT.monsterTileSVG('sword')).join('|');
  const b = pathData(MT.monsterTileSVG('shield')).join('|');
  assert.ok(a.length > 0 && b.length > 0);
  assert.notEqual(a, b, 'sword and shield must not share a silhouette');
});

test('the page loads monster-tiles.js after match-logic.js', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'www', 'index.html'), 'utf8');
  const logic = html.indexOf('js/match-logic.js');
  const tiles = html.indexOf('js/monster-tiles.js');
  assert.ok(logic >= 0, 'match-logic.js must still be in the page');
  assert.ok(tiles >= 0, 'monster-tiles.js must be in the page');
  assert.ok(tiles > logic, 'monster-tiles.js must load after match-logic.js');
});

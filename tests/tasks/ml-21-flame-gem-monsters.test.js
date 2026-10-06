// ACCEPTANCE TEST — ml-21 ember and gem monsters, all six silhouettes distinct.
// Expected to FAIL until this task is done (flame and gem return '' before it).
const test = require('node:test');
const assert = require('node:assert');
const MT = require('../../www/js/monster-tiles.js');
const ML = require('../../www/js/match-logic.js');

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

for (const type of ['flame', 'gem']) {
  test(type + ' draws a self-coloured monster', () => assertSelfColouredSVG(type));
}

test('all six monsters are told apart by silhouette', () => {
  const shapes = ML.TYPES.map((t) => pathData(MT.monsterTileSVG(t)).join('|'));
  for (const s of shapes) assert.ok(s.length > 0, 'every monster needs at least one silhouette path');
  assert.equal(new Set(shapes).size, 6, 'no two monsters may share the same silhouette');
});

test('all six monsters are six different drawings', () => {
  const drawings = ML.TYPES.map((t) => norm(MT.monsterTileSVG(t)));
  for (const d of drawings) assert.ok(d.length > 0);
  assert.equal(new Set(drawings).size, 6);
});

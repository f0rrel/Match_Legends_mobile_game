// ACCEPTANCE TEST — ml-20 urn ghost and crown-king monsters.
// Expected to FAIL until this task is done (urn and crown return '' before it).
const test = require('node:test');
const assert = require('node:assert');
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

for (const type of ['urn', 'crown']) {
  test(type + ' draws a self-coloured monster', () => assertSelfColouredSVG(type));
}

test('urn and crown are told apart by silhouette', () => {
  const a = pathData(MT.monsterTileSVG('urn')).join('|');
  const b = pathData(MT.monsterTileSVG('crown')).join('|');
  assert.ok(a.length > 0 && b.length > 0);
  assert.notEqual(a, b, 'urn and crown must not share a silhouette');
});

test('urn and crown are two different drawings', () => {
  const a = norm(MT.monsterTileSVG('urn'));
  const b = norm(MT.monsterTileSVG('crown'));
  assert.ok(a.length > 0 && b.length > 0);
  assert.notEqual(a, b);
});

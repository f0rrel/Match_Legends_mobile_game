// PENDING TASK TEST — ml-15 monster tile artwork. Expected to FAIL until done.
//
// Definition of done: www/js/monster-tiles.js exports monsterTileSVG(type) returning an
// SVG drawing for each of the six MatchLogic.TYPES, each with its own silhouette path,
// all painting with currentColor so the tile's own colour is the only colour.
const test = require('node:test');
const assert = require('node:assert');
const MT = require('../../www/js/monster-tiles.js');
const ML = require('../../www/js/match-logic.js');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const pathData = (svg) => [...String(svg).matchAll(/\sd="([^"]*)"/g)].map((m) => norm(m[1])).filter(Boolean);

test('every one of the six monsters has its own drawing', () => {
  assert.equal(typeof MT.monsterTileSVG, 'function');
  const drawings = {};
  for (const type of ML.TYPES) {
    const svg = MT.monsterTileSVG(type);
    assert.equal(typeof svg, 'string', type + ' should draw an SVG string');
    assert.match(svg, /^<svg[\s>]/, type + ' should start with an <svg> element');
    assert.ok(/viewBox=/.test(svg), type + ' should carry a viewBox');
    drawings[type] = norm(svg);
  }
  assert.equal(new Set(Object.values(drawings)).size, 6, 'the six monsters must be six different drawings');
});

test('the monsters are told apart by silhouette, not only by colour', () => {
  const shapes = ML.TYPES.map((type) => pathData(MT.monsterTileSVG(type)).join('|'));
  for (const s of shapes) assert.ok(s.length > 0, 'every monster needs at least one silhouette path');
  assert.equal(new Set(shapes).size, 6, 'no two monsters may share the same silhouette');
});

test('the drawing takes its colour from the tile, never from itself', () => {
  for (const type of ML.TYPES) {
    const svg = MT.monsterTileSVG(type);
    assert.ok(/currentColor/.test(svg), type + ' should paint with currentColor');
    assert.ok(!/#/.test(svg) && !/rgb\(/.test(svg) && !/hsl\(/.test(svg), type + ' should not hard-code a colour');
  }
});

test('an unknown type draws nothing', () => {
  assert.equal(MT.monsterTileSVG('dragon'), '');
});

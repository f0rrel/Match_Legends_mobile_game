// Unit tests for www/js/jewel-tiles.js: six glossy jewel shapes, one per type.
const test = require('node:test');
const assert = require('node:assert/strict');
const JT = require('../../www/js/jewel-tiles.js');
const ML = require('../../www/js/match-logic.js');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// The signature that decides the silhouette: the element tag plus its geometry.
function shapeSignature(type) {
  const s = JT.SHAPES[type];
  return s.tag + ' ' + norm(s.attrs);
}

test('every matchable type has a jewel drawing', () => {
  assert.deepEqual([...JT.TYPES].sort(), [...ML.TYPES].sort());
  for (const type of ML.TYPES) {
    const svg = JT.jewelTileSVG(type);
    assert.equal(typeof svg, 'string', type + ' should draw an SVG string');
    assert.match(svg, /^<svg[\s>]/, type + ' should start with an <svg> element');
    assert.ok(/viewBox="0 0 100 100"/.test(svg), type + ' should carry a viewBox');
    assert.ok(/currentColor/.test(svg), type + ' should paint with currentColor');
  }
});

test('the six tiles render with six different shapes', () => {
  const signatures = ML.TYPES.map(shapeSignature);
  assert.equal(new Set(signatures).size, 6, 'no two jewels may share a silhouette');
  // The rendered SVG really carries its own shape, not just the table.
  for (const type of ML.TYPES) {
    assert.ok(JT.jewelTileSVG(type).includes(JT.SHAPES[type].attrs), type + ' must draw its own geometry');
  }
});

test('the shapes stay tellable apart as tag or path data', () => {
  // circle and rect differ by tag; the four paths differ by `d`.
  const tags = new Set(ML.TYPES.map(t => JT.SHAPES[t].tag));
  const paths = ML.TYPES.filter(t => JT.SHAPES[t].tag === 'path').map(t => JT.SHAPES[t].attrs);
  assert.equal(new Set(paths).size, paths.length, 'no two path jewels may share a path');
  assert.ok(tags.size >= 2, 'the circle and the square must use different tags');
});

test('every jewel is glossy: a shared gradient, a shine and a darker outline', () => {
  const defs = JT.jewelDefsSVG();
  assert.match(defs, /jewelGloss/, 'a shared gloss gradient must be defined');
  assert.match(defs, /jewelShine/, 'a shared shine gradient must be defined');
  for (const type of ML.TYPES) {
    assert.ok(defs.includes('jewel-' + type + '-clip'), type + ' needs a clip path');
    const svg = JT.jewelTileSVG(type);
    assert.match(svg, /fill="url\(#jewelGloss\)"/, type + ' must be glossed');
    assert.match(svg, /fill="url\(#jewelShine\)"/, type + ' must have a shine');
    assert.match(svg, /stroke="rgba\(0,0,0,0\.55\)"/, type + ' must wear a darker outline');
  }
});

test('an unknown type draws nothing', () => {
  assert.equal(JT.jewelTileSVG('dragon'), '');
  assert.equal(JT.jewelTileSVG(''), '');
});

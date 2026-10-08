/* =========================================================
   MATCH LEGENDS — JEWEL TILE ARTWORK
   One tiny SVG drawing per tile type, drawn in code: no images,
   no build step, no DOM access, no dependencies. Classic script —
   everything here runs both in the game (window.JewelTiles) and
   under Node's test runner (module.exports).

   The six types keep the ids the logic already uses (sword, shield,
   urn, crown, flame, gem) and each is a single bold silhouette, so
   they stay readable in greyscale:

     sword  red circle
     shield blue rounded square
     urn    purple triangle
     crown  yellow five-point star
     flame  orange diamond
     gem    green hexagon

   Every jewel is filled with the tile's own colour (currentColor),
   wrapped in a darker outline, and glossed with a shared white-to-
   black gradient plus a round shine in the top-left corner. The
   gloss and clip shapes live in one shared <defs> SVG (jewelDefsSVG)
   injected once, so removing a tile never removes the paint servers
   the other tiles of that type rely on.

   Unknown types draw ''.
======================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JewelTiles = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // The one silhouette per type: the element tag and its geometry. The tag is
  // what differs for the circle and the square; the rest are <path>s whose `d`
  // is the shape, so no two types can be confused even without colour.
  const SHAPES = {
    sword:  { tag: 'circle', attrs: 'cx="50" cy="50" r="37"' },
    shield: { tag: 'rect',   attrs: 'x="13" y="13" width="74" height="74" rx="18" ry="18"' },
    urn:    { tag: 'path',   attrs: 'd="M50 12 L88 82 Q91 89 84 89 L16 89 Q9 89 12 82 Z"' },
    crown:  { tag: 'path',   attrs: 'd="M50 11 L59.4 39.1 L88 39.6 L65.2 56.9 L73.5 84.4 L50 68 L26.5 84.4 L34.8 56.9 L12 39.6 L40.6 39.1 Z"' },
    flame:  { tag: 'path',   attrs: 'd="M50 9 L86 50 L50 91 L14 50 Z"' },
    gem:    { tag: 'path',   attrs: 'd="M50 8 L85 29 L85 71 L50 92 L15 71 L15 29 Z"' },
  };

  const TYPES = Object.keys(SHAPES);

  // Shared paint servers: a vertical white-to-black gloss and a soft round
  // shine. Both are colourless (white/black with opacity) so they darken and
  // brighten whatever currentColor the tile wears.
  function defsMarkup(){
    const clips = TYPES.map(type => {
      const s = SHAPES[type];
      return '<clipPath id="jewel-' + type + '-clip"><' + s.tag + ' ' + s.attrs + '/></clipPath>';
    }).join('');
    return '<linearGradient id="jewelGloss" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>' +
        '<stop offset="0.42" stop-color="#ffffff" stop-opacity="0.06"/>' +
        '<stop offset="1" stop-color="#000000" stop-opacity="0.4"/>' +
      '</linearGradient>' +
      '<radialGradient id="jewelShine" cx="0.5" cy="0.5" r="0.5">' +
        '<stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>' +
        '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
      '</radialGradient>' + clips;
  }

  // The hidden SVG that carries every gradient and clip path, injected once.
  function jewelDefsSVG(){
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" ' +
      'style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">' +
      '<defs>' + defsMarkup() + '</defs></svg>';
  }

  function jewelTileSVG(type) {
    const s = Object.prototype.hasOwnProperty.call(SHAPES, type) ? SHAPES[type] : null;
    if (!s) return '';
    const shape = '<' + s.tag + ' ' + s.attrs + ' fill="currentColor" ' +
      'stroke="rgba(0,0,0,0.55)" stroke-width="6" stroke-linejoin="round"/>';
    // The gloss and the top-left shine are clipped to the jewel so no white
    // spills past a triangle, star or diamond edge.
    const gloss = '<g clip-path="url(#jewel-' + type + '-clip)">' +
        '<rect x="0" y="0" width="100" height="100" fill="url(#jewelGloss)"/>' +
        '<ellipse cx="33" cy="29" rx="21" ry="13.5" fill="url(#jewelShine)"/>' +
      '</g>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ' +
      'width="100%" height="100%" aria-hidden="true" focusable="false">' +
      shape + gloss + '</svg>';
  }

  return { TYPES, SHAPES, jewelTileSVG, jewelDefsSVG };
});

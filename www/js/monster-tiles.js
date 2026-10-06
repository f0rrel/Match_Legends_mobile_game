/* =========================================================
   MATCH LEGENDS — MONSTER TILE ARTWORK
   One tiny SVG drawing per tile type, drawn in code: no images,
   no build step, no DOM access, no dependencies. Classic script —
   everything here runs both in the game (window.MonsterTiles) and
   under Node's test runner (module.exports).

   Every drawing is a plain string:
   - starts with <svg>, carries viewBox "0 0 100 100" and
     width/height 100% so it scales inside whatever tile wears it;
   - paints only with fill="currentColor" / stroke="currentColor",
     so the tile's own CSS colour is the only colour on screen;
   - 3-6 <path> elements, kept cheap for a phone running 61 tiles;
   - the FIRST path is the monster's silhouette (head shape,
     horns/ears/fangs, body outline). Two monsters must never share
     that outline, so tiles stay readable without colour.
   Unknown types draw ''.
========================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MonsterTiles = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* The outline only: filled, so the shape reads at tile size. */
  const OUT = 'fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
  /* Solid currentColor marks: eyes, grins, brows. */
  const IN = 'fill="currentColor" stroke="none"';

  const DRAWINGS = {};

  /* ---- sword: a little sword imp ----
     Blade-shaped head (tip first, then one horn on the right edge),
     stubby body below, a crossguard bar, two eyes and a fanged grin. */
  DRAWINGS.sword = [
    '<path ' + OUT + ' d="M50 5 L57 17 L77 8 L58 26 L64 43 L68 56 L66 65 L77 71 Q81 84 74 92 Q68 96 58 96 L42 96 Q32 96 26 92 Q19 84 23 71 L34 65 L32 56 L36 43 L42 26 L43 16 Z"/>',
    '<path ' + OUT + ' stroke-width="7" d="M24 69 L76 69"/>',
    '<path ' + IN + ' d="M38 53 L62 53 L58 67 L54 57 L50 68 L46 57 L42 67 Z"/>',
    '<path ' + IN + ' d="M36 44 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0 M55 44 a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0"/>'
  ];

  /* ---- shield: a stubby shield golem ----
     Round body with two stub arms growing straight out of the
     outline, a chunky arched brow, dot eyes and a small mouth. */
  DRAWINGS.shield = [
    '<path ' + OUT + ' d="M50 14 C34 14 22 26 21 42 L14 46 Q8 49 9 56 Q10 62 17 64 L22 66 C24 82 36 94 50 96 C64 94 76 82 78 66 L83 64 Q90 62 91 56 Q92 49 86 46 L79 42 C78 26 66 14 50 14 Z"/>',
    '<path ' + OUT + ' stroke-width="9" d="M31 44 Q50 34 69 44"/>',
    '<path ' + IN + ' d="M35 55 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M55 55 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0"/>',
    '<path ' + OUT + ' stroke-width="6" d="M41 72 Q50 79 59 72"/>'
  ];

  function monsterTileSVG(type) {
    const parts = Object.prototype.hasOwnProperty.call(DRAWINGS, type) ? DRAWINGS[type] : null;
    if (!parts) return '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ' +
      'width="100%" height="100%" fill="none" aria-hidden="true" focusable="false">' +
      parts.join('') + '</svg>';
  }

  return { monsterTileSVG: monsterTileSVG };
});

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

  /* Same as OUT but with the stroke weight chosen per path, so the
     attribute never appears twice on one element (XML forbids it). */
  function outline(width) {
    return 'fill="none" stroke="currentColor" stroke-width="' + width +
      '" stroke-linecap="round" stroke-linejoin="round"';
  }

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

  /* ---- urn: a wobbly urn ghost ----
     Wide lid lip overhanging rounded vessel shoulders, a bulbous body
     that fades into a floaty wavy hem instead of feet, dot eyes and a
     soft grin. Two little wisps wave where arms would be. */
  DRAWINGS.urn = [
    '<path ' + OUT + ' d="M30 8 L70 8 Q75 8 75 13 Q75 18 71 19 L68 23 C80 31 84 47 82 62 C80 76 75 85 70 87 C72 94 64 97 60 90 C57 96 51 96 48 90 C45 96 39 96 36 90 C32 97 24 94 27 87 C22 85 17 76 16 62 C14 47 18 31 32 23 L29 19 Q25 18 25 13 Q25 8 30 8 Z"/>',
    '<path ' + outline(6) + ' d="M32 24 Q50 30 68 24"/>',
    '<path ' + outline(6) + ' d="M17 54 Q6 58 9 68 Q12 75 20 72 M83 54 Q94 58 91 68 Q88 75 80 72"/>',
    '<path ' + IN + ' d="M36 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M54 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0"/>',
    '<path ' + outline(6) + ' d="M37 66 Q50 78 63 66"/>'
  ];

  /* ---- crown: a haughty crown-king imp ----
     Squared crown head: three points on top with a band across the
     brow, a small tapering body, dot eyes, a long wedge nose and a
     wide smug mouth curled up on one side. */
  DRAWINGS.crown = [
    '<path ' + OUT + ' d="M8 16 L28 36 L50 6 L72 36 L92 16 L88 42 Q88 46 84 46 L80 50 Q78 76 66 87 Q59 94 50 94 Q41 94 34 87 Q22 76 20 50 L16 46 Q12 46 12 42 Z"/>',
    '<path ' + outline(7) + ' d="M14 43 L86 43"/>',
    '<path ' + IN + ' d="M36 53 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M56 53 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0"/>',
    '<path ' + IN + ' d="M46 61 L54 61 L50 74 Z"/>',
    '<path ' + outline(6) + ' d="M39 82 Q50 89 61 80"/>'
  ];

  /* ---- flame: a lively ember sprite ----
      Licking flame head: one tall centre tip plus two side tongues,
      a pinched waist with tiny pointed arms and two little feet,
      wide bright eyes, a cheeky grin and two loose ember flicks
      sparking off the sides. No flat crown, no round pot, no blade —
      the wavy fire outline is its own silhouette. */
  DRAWINGS.flame = [
    '<path ' + OUT + ' d="M50 4 C57 13 61 18 63 23 C66 16 70 11 75 7 C77 20 79 30 79 40 C79 50 70 54 70 62 L82 65 L73 69 C79 74 79 80 76 84 L66 96 L56 86 C53 91 47 91 44 86 L34 96 L24 84 C21 80 21 74 27 69 L18 65 L30 62 C30 54 21 50 21 40 C20 32 21 24 24 16 C28 20 32 23 35 25 C39 20 44 13 50 4 Z"/>',
    '<path ' + IN + ' d="M34 50 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0 M55 48 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0"/>',
    '<path ' + outline(6) + ' d="M40 60 Q50 70 60 60"/>',
    '<path ' + IN + ' d="M11 17 C7 25 8 33 11 37 C15 31 15 23 11 17 Z M90 31 C94 38 93 46 90 50 C86 44 86 36 90 31 Z"/>'
  ];

  /* ---- gem: a faceted gem sprite ----
      Angular crystal body: flat top edge, chamfered corners, two sharp
      arm spikes and a split crystal-foot hem instead of a round base.
      Facet cuts across the crown, diamond sparkle eyes, a shy smile
      and a little four-point sparkle gleaming on the forehead. */
  DRAWINGS.gem = [
    '<path ' + OUT + ' d="M34 8 L66 8 L84 26 L84 44 L92 54 L84 62 L74 82 L66 96 L56 88 L44 88 L34 96 L26 82 L16 62 L8 54 L16 44 L16 26 Z"/>',
    '<path ' + outline(5) + ' d="M16 44 L84 44 M34 8 L36 44 M66 8 L64 44"/>',
    '<path ' + IN + ' d="M36 56 L40 50 L44 56 L40 62 Z M56 56 L60 50 L64 56 L60 62 Z"/>',
    '<path ' + outline(6) + ' d="M42 72 Q50 78 58 72"/>',
    '<path ' + IN + ' d="M50 18 L52.5 22.5 L57 25 L52.5 27.5 L50 32 L47.5 27.5 L43 25 L47.5 22.5 Z"/>'
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

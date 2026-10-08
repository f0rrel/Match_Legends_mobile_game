/* =========================================================
   MATCH LEGENDS — JUICE TEXT
   The small, pure presentation rules behind the big-match feel:
   what one cascade step says and how big it says it. No DOM, no
   timers -- a classic script that also loads under Node's test
   runner so the wording can be unit tested.

   A cascade step is 1-based within one player move: step 1 is the
   match the player made, step 2 the first chain it set off, and so
   on. The later the step, the bigger the word.
======================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Juice = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const WORDS = { 2: 'Sweet!', 3: 'Great!', 4: 'Amazing!' };
  const SCALES = [1, 1, 1.15, 1.32, 1.5, 1.7]; // indexed by step, capped at 5

  // The escalation word for a cascade step, or null for step 1 (which keeps
  // the plain match-size wording the game already showed).
  function cascadeCallout(step){
    const s = Number.isFinite(step) ? Math.floor(step) : 1;
    if (s >= 5) return 'MONSTROUS!';
    return WORDS[s] || null;
  }

  // How big that step's callout should read. Step 1 is the base size and every
  // later step grows; beyond 5 it stops growing.
  function calloutScale(step){
    const s = Number.isFinite(step) ? Math.floor(step) : 1;
    if (s <= 1) return SCALES[1];
    return SCALES[Math.min(s, 5)];
  }

  // What a special + special combo shouts, keyed by the logic's combo kind
  // ('cross', 'mega', 'kaboom'). An unknown kind says nothing.
  const COMBO_WORDS = { cross: 'CROSS BLAST!', mega: 'MEGA LINES!', kaboom: 'KABOOM!' };
  function comboCallout(kind){
    return Object.prototype.hasOwnProperty.call(COMBO_WORDS, kind) ? COMBO_WORDS[kind] : null;
  }

  return { WORDS, COMBO_WORDS, cascadeCallout, calloutScale, comboCallout };
});

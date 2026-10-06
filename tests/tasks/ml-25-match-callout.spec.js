// PENDING TASK TEST — ml-25 one short callout. Expected to FAIL until done.
//
// Definition of done: a resolved match shows exactly one short callout over the board
// saying what it did, it is never on screen twice, and it is gone shortly afterwards.
const { test, expect } = require('@playwright/test');
const { openGame, startLevel, playOneMove } = require('../helpers/game.js');

test('one callout says what the match did, then goes away', async ({ page }) => {
  const errors = await openGame(page);
  await startLevel(page, 1);

  await page.evaluate(() => {
    window.__callouts = { most: 0, texts: [] };
    const board = document.querySelector('#board');
    const sample = () => {
      const els = board.querySelectorAll('.match-callout');
      window.__callouts.most = Math.max(window.__callouts.most, els.length);
      els.forEach((el) => window.__callouts.texts.push(el.textContent.trim()));
    };
    window.__sampleCallouts = sample;
    new MutationObserver(sample).observe(board, { childList: true, subtree: true, characterData: true });
  });

  await playOneMove(page);
  await page.waitForTimeout(900);
  const seen = await page.evaluate(() => { window.__sampleCallouts(); return window.__callouts; });

  expect(seen.most).toBe(1);
  expect(seen.texts.length).toBeGreaterThan(0);
  expect(seen.texts[0]).toMatch(/MATCH|COMBO/i);
  expect(await page.locator('#board .match-callout').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('the callout is short', async ({ page }) => {
  await openGame(page);
  const anim = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'match-callout';
    document.querySelector('#board').appendChild(el);
    const cs = getComputedStyle(el);
    const r = { name: cs.animationName, duration: parseFloat(cs.animationDuration) };
    el.remove();
    return r;
  });
  expect(anim.name).not.toBe('none');
  expect(anim.duration).toBeLessThanOrEqual(0.8);
});

// Screenshots for the visual reviewer (Master System `visual_review.capture`):
//   node tests/screens/capture.js <out_dir> <screen,screen,...> <width> <height>
// Writes <out_dir>/<screen>.png for each screen, on a phone-sized viewport.
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { openGame, startLevel } = require('../helpers/game.js');

const SCREENS = {
  home: async () => {},
  levels: async page => {
    await page.click('#btn-goto-levels');
    await page.waitForSelector('#screen-levels.active');
  },
  game: async page => {
    await startLevel(page, 1);
  },
  avatars: async page => {
    await page.click('#home-avatar-strip');
    await page.waitForSelector('#screen-avatars.active');
  },
};

async function main() {
  const [outDir, names, width, height] = process.argv.slice(2);
  const browser = await chromium.launch();
  try {
    for (const name of String(names).split(',')) {
      const go = SCREENS[name];
      if (!go) throw new Error(`unknown screen: ${name} (known: ${Object.keys(SCREENS)})`);
      const page = await browser.newPage({
        viewport: { width: Number(width) || 390, height: Number(height) || 844 },
        deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      });
      await openGame(page);
      await go(page);
      await page.waitForTimeout(600); // let short effects settle
      await page.screenshot({ path: path.join(outDir, `${name}.png`) });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exit(1); });

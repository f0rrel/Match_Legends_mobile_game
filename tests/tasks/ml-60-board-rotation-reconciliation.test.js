// ACCEPTANCE TEST — ml-60 the board-rotation reconciliation record (docs only).
// Expected to FAIL until docs/ROTATION-RECONCILIATION.md exists with the right content.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DOC = path.join(__dirname, '..', '..', 'docs', 'ROTATION-RECONCILIATION.md');

function readDoc(){
  assert.ok(fs.existsSync(DOC), 'docs/ROTATION-RECONCILIATION.md is missing');
  return fs.readFileSync(DOC, 'utf8');
}

test('the reconciliation record exists', () => {
  assert.ok(fs.existsSync(DOC));
  assert.ok(fs.statSync(DOC).size > 400, 'the record is too thin to be a reconciliation');
});

test('it keeps code-verified behaviour apart from behaviour no test covers', () => {
  const text = readDoc();
  assert.match(text, /Verified by code/i);
  assert.match(text, /Not covered by an automated test/i);
});

test('it names the code facts and the tests that cover them', () => {
  const text = readDoc();
  assert.match(text, /ml-5[2-9]/);
  assert.match(text, /rotationShape|match shape/i);
  assert.match(text, /gravityForStep|screen-relative/i);
  assert.match(text, /reduced motion/i);
});

test('the uncovered behaviours are listed as uncovered, not as verified', () => {
  const text = readDoc();
  assert.match(text, /upright/i);
  assert.match(text, /refill/i);
  assert.match(text, /reduced motion/i);
  assert.match(text, /special/i);
  assert.ok(!/visual QA[^.]{0,40}(passed|complete|done)/i.test(text),
    'the record must not claim human visual QA has passed');
  assert.ok(!/all (visual )?behaviou?rs? (are )?verified by (the )?tests/i.test(text),
    'the record must not claim every behaviour is verified by tests');
});

test('ml-51 is superseded by ml-52 through ml-59 and its history is kept', () => {
  const text = readDoc();
  assert.match(text, /ml-51/);
  assert.match(text, /superseded/i);
  assert.match(text, /ml-52[^\n]{0,40}ml-59/);
  assert.match(text, /history/i);
});

test('the epic is recorded complete and the record gaps are named', () => {
  const text = readDoc();
  assert.match(text, /epic-board-rotation/);
  assert.match(text, /complete/i);
  assert.match(text, /ml-58/);
  assert.match(text, /ml-59/);
  assert.match(text, /(missing|absent|no acceptance.test)/i);
  assert.match(text, /not (evidence|proof|a sign) that the features are broken/i);
});

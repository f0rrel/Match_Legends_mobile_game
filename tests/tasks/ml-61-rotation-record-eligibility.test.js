// ACCEPTANCE TEST — ml-61 the rotation-eligibility correction in the reconciliation record.
// Expected to FAIL until docs/ROTATION-RECONCILIATION.md is corrected for commit eb87505.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DOC = path.join(__dirname, '..', '..', 'docs', 'ROTATION-RECONCILIATION.md');
function readDoc(){
  assert.ok(fs.existsSync(DOC), 'docs/ROTATION-RECONCILIATION.md is missing');
  return fs.readFileSync(DOC, 'utf8');
}

test('rotation eligibility is the original match shape, not a numeric run threshold', () => {
  const text = readDoc();
  assert.match(text, /match shape|matchShape/i);
  assert.match(text, /eligib/i);
  assert.ok(!/run of 4 while testing/i.test(text), 'the old testing-threshold wording is still there');
  assert.ok(!/5 in production/i.test(text), 'the record still claims a run of 5 earns rotation in production');
});

test('the record names eb87505 and the removed threshold constant', () => {
  const text = readDoc();
  assert.match(text, /eb87505/);
  assert.match(text, /ROTATION_TRIGGER_RUN/);
  assert.match(text, /remov|supersed/i);
});

test('ml-59 is kept as history and its threshold is marked superseded', () => {
  const text = readDoc();
  assert.match(text, /ml-59/, 'ml-59 must stay in the record as history');
  assert.ok(!/decides what earns a turn is ml-59/i.test(text),
    'the record must no longer say ml-59 decides what earns a turn');
  assert.match(text, /(threshold|run[-\s]?length|constant)[^.]{0,200}supersed|supersed[^.]{0,200}(threshold|run[-\s]?length|constant)/i,
    'the ml-59 run-length threshold must be recorded as superseded by eb87505');
});

test('a power-only clear and later cascade steps are both covered', () => {
  const text = readDoc();
  assert.match(text, /power[-\s]?only[^.]{0,80}(does not|doesn't|never|no)\s+earn/i);
  assert.match(text, /later (cascade )?step/i);
  assert.match(text, /(its|their) own match shape|own match shape/i);
});

test('the code-verified vs untested split survives the correction', () => {
  const text = readDoc();
  assert.match(text, /Verified by code/i);
  assert.match(text, /Not covered by an automated test/i);
  assert.match(text, /eb87505/);
  assert.ok(!/all (visual )?behaviou?rs? (are )?verified by (the )?tests/i.test(text),
    'the record must not claim every behaviour is verified by tests');
});

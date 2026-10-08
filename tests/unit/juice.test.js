// Unit tests for www/js/juice.js: the cascade escalation wording and size.
const test = require('node:test');
const assert = require('node:assert/strict');
const Juice = require('../../www/js/juice.js');

test('each cascade step escalates the word', () => {
  assert.equal(Juice.cascadeCallout(1), null, 'step 1 keeps the plain match wording');
  assert.equal(Juice.cascadeCallout(2), 'Sweet!');
  assert.equal(Juice.cascadeCallout(3), 'Great!');
  assert.equal(Juice.cascadeCallout(4), 'Amazing!');
  assert.equal(Juice.cascadeCallout(5), 'MONSTROUS!');
  assert.equal(Juice.cascadeCallout(9), 'MONSTROUS!', 'steps beyond five stay MONSTROUS!');
});

test('a bad or missing step falls back to step 1', () => {
  assert.equal(Juice.cascadeCallout(0), null);
  assert.equal(Juice.cascadeCallout(), null);
  assert.equal(Juice.cascadeCallout('nope'), null);
});

test('later steps read bigger, up to a cap', () => {
  const scales = [1, 2, 3, 4, 5].map(s => Juice.calloutScale(s));
  for (let i = 1; i < scales.length; i++) {
    assert.ok(scales[i] >= scales[i - 1], `step ${i + 1} must not be smaller than step ${i}`);
  }
  assert.equal(Juice.calloutScale(5), Juice.calloutScale(8), 'the size stops growing past step 5');
  assert.ok(Juice.calloutScale(4) > Juice.calloutScale(1));
});

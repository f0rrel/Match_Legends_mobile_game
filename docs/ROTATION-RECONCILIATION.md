# Board rotation — reconciliation record

The true state of the experimental Hex board rotation after release PR #5 merged
into `main` at `535e94d`. This records what shipped; it does not re-open the work.
Documentation only.

## Verified by code

- The turn is decided from the original settled match shape. `expanded.rotationShape`
  is set from `matchShape(matched)` in `attemptSwap` **before** special blasts grow
  the clear, and a power-only clear carries `null`; `resolveCascade` earns a turn only
  when that shape is `line` or `bomb` (a straight run of 4+). Coverage: ml-54
  (`tests/tasks/ml-54-board-rotation-trigger.spec.js`).
- Rotation is persistent 60-degree steps, one Hex side per qualifying match, never a
  one-off spin, and the board holds between steps. `advanceRotationStep` wraps through
  all six sides and `#board[data-rot]` (`0`…`5`) holds the resting angle. Coverage:
  ml-52, ml-53, ml-56. The constant that decides what earns a turn is ml-59 (a run of
  4 while testing, 5 in production).
- Input on a turned board is read in the orientation the player sees: `swipeDirForStep`
  is fed the session's rotation step (`session.rotStep`) so a screen swipe maps to the
  right Hex direction. Coverage: ml-52, ml-55, ml-57.
- Gravity and refill are computed screen-relative for the current orientation via
  `gravityForStep(session.rotStep)`, so the fall keeps the same on-screen up/down at
  every step. This is read from the code and **has no acceptance test**.
- The Effects setting stores an explicit choice and, once chosen, overrides the
  operating system's reduced-motion preference — the switch is the authority. ml-9
  covers persistence only (`tests/tasks/ml-9-effects-toggle.spec.js`); the override
  itself has **no direct acceptance test**.

## Not covered by an automated test

None of the following is covered by an automated test:

- tile artwork and floating score labels staying upright at every rotation step;
- refill entering from the screen-relative top and falling consistently at all six
  orientations;
- Effects ON animating while the operating system prefers reduced motion;
- rotation, input and special-tile behaviour working together.

## Records updated

- ml-51 ("Spin the board once after a huge match") is superseded by ml-52–ml-59. Its
  history is preserved and it is not reopened.
- `epic-board-rotation` is **COMPLETE**: the implementation was accepted and merged in
  PR #5. Missing automated test coverage does not make delivered behaviour incomplete.

## Record gaps

- ml-58 and ml-59 are recorded as completed but have no acceptance-test file under
  `tests/tasks/` (ml-54's spec was rewritten to cover them).
- No automated test covers tile-face / floating-label uprightness, screen-relative
  refill at all six steps, or Effects-ON over reduced motion.
- These are record-keeping gaps, not evidence that the features are broken. No new
  automated-test tasks are being created at this stage; a coverage follow-up may be
  proposed separately later at low priority.

Replace old code; don't leave the previous implementation behind as a fallback.

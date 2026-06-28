# Enemy Combat Experience Design

## Goal

Improve monster combat feel without rebuilding the combat system or lowering FPS: enemies should telegraph attacks clearly, avoid freezing at close range, and make ranged/Boss encounters easier to read.

## Scope

- Keep existing `Enemy.js` windup → strike → recover pipeline.
- Keep existing damage values mostly intact.
- Add tactical movement during cooldown: melee enemies sidestep or back off instead of standing still.
- Add ranged keep-away behavior: archers, octoroks, guardians, and wizzrobes reposition when the player gets too close.
- Make Boss and large monster attacks easier to read by extending telegraph windows and using repeated attack cues during windup.

## Non-goals

- No new enemy types in this pass.
- No physics engine.
- No heavy new particle systems.
- No global difficulty rebalance.

## Testing

- Add a source-level regression test for combat behavior wiring.
- Run existing combat, streaming, quality, and syntax checks.
- Smoke test in browser and check console errors.

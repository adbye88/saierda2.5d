# Enemy Combat Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve monster combat feel through clearer telegraphs, melee cooldown footwork, ranged keep-away, and Boss threat readability.

**Architecture:** Keep battle simulation in `src/Enemy.js` and shared hit math in `src/CombatResolver.js`. Add small helper methods to `Enemy` so existing AI states remain understandable and testable.

**Tech Stack:** Plain JavaScript, Three.js runtime objects, Node source-level tests.

---

### Task 1: Add combat behavior regression test

**Files:**
- Create: `tools/enemy-combat-experience.test.mjs`
- Read: `src/Enemy.js`

- [ ] Write a source-level test asserting that `Enemy` exposes tactical helper methods and uses them from `_attack`.
- [ ] Verify the test fails before implementation.
- [ ] Implement the minimal helpers and wiring.
- [ ] Verify the test passes.

### Task 2: Implement melee footwork and ranged keep-away

**Files:**
- Modify: `src/Enemy.js`

- [ ] Add `_combatMovementProfile()` for desired distance, keep-away distance, sidestep speed, and attack cue interval.
- [ ] Add `_moveCombatStyle(dt, dir, dist, game, profile)` for cooldown movement.
- [ ] Add `_shouldUseRangedKeepAway(dist, profile)` and `_moveRangedKeepAway(dt, dir, dist, game, profile)`.
- [ ] Call these helpers in `_attack()` when enemies are not in an active windup/strike/recover phase.

### Task 3: Improve attack readability

**Files:**
- Modify: `src/Enemy.js`

- [ ] Add `_telegraphAttackCue(profile)` so windup cues repeat at a throttled interval.
- [ ] Increase windup slightly for large monsters/Bosses and fast enemies only where readability benefits.
- [ ] Keep existing `Effects.enemyAttackCue` and avoid adding heavier rendering work.

### Task 4: Verify and ship

**Files:**
- Test: `tools/enemy-combat-experience.test.mjs`
- Existing tests: combat and performance-adjacent tools

- [ ] Run syntax checks.
- [ ] Run the new test.
- [ ] Run existing combat/streaming/quality tests.
- [ ] Run `git diff --check`.
- [ ] Run `vet`.
- [ ] Browser smoke test localhost and check console errors.
- [ ] Commit and push to `origin/main`.

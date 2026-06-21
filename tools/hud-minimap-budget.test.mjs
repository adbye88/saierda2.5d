import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/ui/HUD.js', import.meta.url), 'utf8');

const context = {
  console,
  window: {},
  navigator: { maxTouchPoints: 0 },
  document: {
    getElementById() { return null; },
    createElement() { return { style: {}, classList: { add() {}, remove() {} }, querySelector() { return { style: {} }; }, remove() {} }; },
    body: { appendChild() {} }
  },
  VisualQualitySystem: {
    level: 'low',
    getBudget() {
      return {
        effectiveLevel: 'low',
        minimapRealtimeEnemies: 12,
        minimapFarEnemies: 18,
        minimapDrops: 10,
        minimapNpcs: 8,
        minimapGates: 6
      };
    }
  },
  ArtAssets: { itemIconHtml() { return ''; } },
  ActionButtons: { setLockActive() {}, setFlurryVisible() {} },
  ChampionSystem: {},
  QuestSystem: { progress: {} }
};
context.window = context;
vm.createContext(context);
vm.runInContext(`${source}\nwindow.HUD = HUD;`, context, { filename: 'HUD.js' });

const HUD = context.window.HUD;
const lockedEnemy = { boss: false, miniBoss: false, hurtTimer: 0, _streamTier: 'dormant', mesh: { position: { x: 999, z: 999 } } };
const bossEnemy = { boss: true, miniBoss: false, hurtTimer: 0, _streamTier: 'dormant', mesh: { position: { x: 998, z: 998 } } };
const passiveEnemies = Array.from({ length: 40 }, (_, i) => ({
  boss: false,
  miniBoss: false,
  hurtTimer: 0,
  _streamTier: i % 2 === 0 ? 'active' : 'passive',
  mesh: { position: { x: i, z: i } }
}));

const realtime = HUD._selectMinimapRealtimeEnemies({
  enemies: [lockedEnemy, bossEnemy, ...passiveEnemies],
  game: { lockedEnemy },
  budget: HUD._minimapBudget()
});

assert.ok(realtime.includes(lockedEnemy), 'locked enemy should always stay on realtime minimap');
assert.ok(realtime.includes(bossEnemy), 'boss enemy should always stay on realtime minimap');
assert.ok(realtime.length <= 12, 'low budget should cap realtime minimap enemies');

const world = {
  enemies: Array.from({ length: 60 }, (_, i) => ({
    dead: false,
    boss: false,
    miniBoss: false,
    hurtTimer: 0,
    _streamTier: 'dormant',
    mesh: { position: { x: i, z: -i } }
  }))
};
const far = HUD._getMinimapFarEnemies(world);
assert.equal(far.length, 18, 'low budget should cap cached far enemy dots');

console.log('hud minimap budget ok');

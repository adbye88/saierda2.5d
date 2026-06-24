import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/ArtDirectionSystem.js', import.meta.url), 'utf8');

assert.ok(source.includes('_collectStaticGroundInfluences'), 'ArtDirectionSystem should collect static ground influence points');
assert.ok(source.includes('_terrainStoryBlend'), 'ArtDirectionSystem should blend route/camp/water/tree/chest story into ground vertex colors');
assert.ok(source.includes('world.camps'), 'terrain layering should use camp locations for trampled camp ground');
assert.ok(source.includes('world.breakables'), 'terrain layering should use chest/breakable locations for baked grounding');
assert.ok(source.includes("kind === 'tree'"), 'terrain layering should use tree roots for baked root shadows');
assert.ok(source.includes('story.treeRoot'), 'ground vertex colors should include tree-root darkening without adding new draw calls');
assert.ok(source.includes('story.camp'), 'ground vertex colors should include camp trample blending');
assert.ok(source.includes('story.chest'), 'ground vertex colors should include chest grounding');
assert.ok(source.includes('art-ground-detail-'), 'ground detail texture should remain texture-based, not object-heavy');

console.log('visual terrain layering wiring ok');

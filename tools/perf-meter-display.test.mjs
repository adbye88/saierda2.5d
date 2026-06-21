import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const initialMatch = html.match(/<div id="perf-meter">([^<]+)<\/div>/);
assert.ok(initialMatch, 'perf meter element should exist');
assert.equal(initialMatch[1].trim(), 'FPS --', 'initial perf meter should only show FPS placeholder');

const perfStart = html.indexOf('(function startPerfMeter()');
const perfEnd = html.indexOf('// ★★★ 全局按钮处理函数', perfStart);
assert.notEqual(perfStart, -1, 'startPerfMeter block should exist');
assert.notEqual(perfEnd, -1, 'startPerfMeter block should end before global button handler');
const perfBlock = html.slice(perfStart, perfEnd);

const textContentAssignments = [...perfBlock.matchAll(/el\.textContent\s*=\s*([^;]+);/g)].map(m => m[1]);
assert.ok(textContentAssignments.length >= 1, 'perf meter should update textContent');

for (const assignment of textContentAssignments) {
  assert.ok(/FPS/.test(assignment), 'perf meter assignment should include FPS');
  assert.equal(/长帧|draw|tri|stream|world|stage|detail|__worldStreamingStats|__gamePerf/.test(assignment), false, `perf meter should not render diagnostics: ${assignment}`);
}

console.log('perf meter display ok');

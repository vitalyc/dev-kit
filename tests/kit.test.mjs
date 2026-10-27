import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-kit-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const kit = path.join(dir, 'kit');
  fs.cpSync(source, kit, { recursive: true, filter: (p) => !p.includes(path.sep + 'tests') });
  const project = path.join(dir, 'project');
  fs.mkdirSync(project);
  return {
    kit,
    project,
    run: (cmd, ...args) =>
      spawnSync(process.execPath, [path.join(kit, 'kit.mjs'), cmd, project, ...args], {
        encoding: 'utf8',
      }),
  };
}
const get = (p, r) => fs.readFileSync(path.join(p, r), 'utf8');
const put = (p, r, s) => {
  fs.mkdirSync(path.dirname(path.join(p, r)), { recursive: true });
  fs.writeFileSync(path.join(p, r), s);
};
const state = (p) => JSON.parse(get(p, '.claude/dev-kit.json'));
const rel = '.claude/agents/tester.md';
test('init, idempotence, seed and project-only files survive', (t) => {
  const f = fixture(t);
  assert.equal(f.run('init').status, 0);
  put(f.project, 'docs/PROJECT.md', 'mine');
  put(f.project, '.claude/agents/custom.md', 'custom');
  assert.equal(f.run('update').status, 0);
  assert.equal(get(f.project, 'docs/PROJECT.md'), 'mine');
  assert.equal(get(f.project, '.claude/agents/custom.md'), 'custom');
});
test('dry run does not write', (t) => {
  const f = fixture(t);
  assert.equal(f.run('init', '--dry-run').status, 0);
  assert.deepEqual(fs.readdirSync(f.project), []);
});
test('unknown marked block is preserved', (t) => {
  const f = fixture(t);
  const old = '<!-- dev-kit:begin -->\nIMPORTANT\n<!-- dev-kit:end -->\nTAIL\n';
  put(f.project, 'AGENTS.md', old);
  assert.equal(f.run('init').status, 2);
  assert.equal(get(f.project, 'AGENTS.md'), old);
  assert.ok(state(f.project).pending['AGENTS.md']);
});
test('existing unmarked instructions are preserved', (t) => {
  const f = fixture(t);
  put(f.project, 'AGENTS.md', 'old rules');
  assert.equal(f.run('init').status, 2);
  assert.equal(get(f.project, 'AGENTS.md'), 'old rules');
});
test('local edits survive unchanged kit', (t) => {
  const f = fixture(t);
  f.run('init');
  const local = get(f.project, rel) + '\nLOCAL';
  put(f.project, rel, local);
  assert.equal(f.run('update').status, 0);
  assert.equal(get(f.project, rel), local);
});
test('untouched files update; project tail survives block update', (t) => {
  const f = fixture(t);
  f.run('init');
  put(f.kit, 'template/' + rel, get(f.kit, 'template/' + rel) + '\nNEW');
  put(f.project, 'AGENTS.md', get(f.project, 'AGENTS.md') + '\nCUSTOM TAIL');
  put(
    f.kit,
    'template/AGENTS.md',
    get(f.kit, 'template/AGENTS.md').replace('## Core principle', '## Updated core principle'),
  );
  assert.equal(f.run('update').status, 0);
  assert.match(get(f.project, rel), /NEW/);
  assert.match(get(f.project, 'AGENTS.md'), /CUSTOM TAIL/);
});
test('conflict persists, preserves base and edited sidecar, resolves explicitly', (t) => {
  const f = fixture(t);
  f.run('init');
  const base = state(f.project).files[rel];
  put(f.project, rel, get(f.project, rel) + '\nLOCAL');
  put(f.kit, 'template/' + rel, get(f.kit, 'template/' + rel) + '\nUPSTREAM');
  assert.equal(f.run('update').status, 2);
  assert.equal(state(f.project).files[rel], base);
  put(f.project, rel + '.kit-new', get(f.project, rel + '.kit-new') + '\nEDITED PROPOSAL');
  assert.equal(f.run('status').status, 2);
  assert.equal(f.run('update').status, 2);
  assert.match(get(f.project, rel + '.kit-new'), /EDITED PROPOSAL/);
  assert.equal(f.run('resolve', rel).status, 1);
  fs.unlinkSync(path.join(f.project, rel + '.kit-new'));
  assert.equal(f.run('update').status, 2);
  assert.equal(f.run('resolve', rel).status, 0);
  assert.equal(f.run('update').status, 0);
  assert.match(get(f.project, rel), /LOCAL/);
});
test('force replaces managed edits and clears conflict', (t) => {
  const f = fixture(t);
  f.run('init');
  put(f.project, rel, 'local');
  put(f.kit, 'template/' + rel, 'upstream');
  assert.equal(f.run('update').status, 2);
  assert.equal(f.run('update', '--force').status, 0);
  assert.equal(get(f.project, rel), 'upstream');
  assert.ok(!fs.existsSync(path.join(f.project, rel + '.kit-new')));
});
test('deleted managed file stays deleted unless forced', (t) => {
  const f = fixture(t);
  f.run('init');
  fs.unlinkSync(path.join(f.project, rel));
  f.run('update');
  assert.ok(!fs.existsSync(path.join(f.project, rel)));
  f.run('update', '--force');
  assert.ok(fs.existsSync(path.join(f.project, rel)));
});
test('retired customized file remains tracked across updates', (t) => {
  const f = fixture(t);
  f.run('init');
  put(f.project, rel, 'custom');
  fs.unlinkSync(path.join(f.kit, 'template', rel));
  f.run('update');
  f.run('update');
  assert.equal(get(f.project, rel), 'custom');
  assert.ok(state(f.project).files[rel]);
});
test('state path traversal rejected before writes', (t) => {
  const f = fixture(t);
  f.run('init');
  const st = state(f.project);
  st.files['.claude/agents/../../../outside'] = 'hash';
  put(f.project, '.claude/dev-kit.json', JSON.stringify(st));
  const before = get(f.project, 'AGENTS.md');
  assert.equal(f.run('update').status, 1);
  assert.equal(get(f.project, 'AGENTS.md'), before);
});
test('0.3 state without pending field is accepted', (t) => {
  const f = fixture(t);
  f.run('init');
  const st = state(f.project);
  delete st.pending;
  st.version = '0.3.0';
  put(f.project, '.claude/dev-kit.json', JSON.stringify(st));
  assert.equal(f.run('update').status, 0);
});

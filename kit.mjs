#!/usr/bin/env node
// dev-kit: install and update the project template (agents, commands,
// AGENTS.md/CLAUDE.md rules, docs skeleton) in a project folder.
//
//   node kit.mjs init   <project-dir> [--dry-run]
//   node kit.mjs update <project-dir> [--dry-run] [--force]
//   node kit.mjs status <project-dir>
//
// No dependencies. Works on Windows, macOS, Linux (Node 18+).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const KIT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(KIT_DIR, 'template');
const VERSION = read(path.join(KIT_DIR, 'VERSION')).trim();
const STATE_FILE = '.claude/dev-kit.json';

const BEGIN_RE = /^<!-- dev-kit:begin[^\n]*-->[ \t]*$/m;
const END_RE = /^<!-- dev-kit:end -->[ \t]*$/m;

// What the kit owns, by kind:
//   managed — whole file belongs to the kit; replaced on update unless edited locally
//   block   — only the text between dev-kit markers belongs to the kit
//   seed    — created once by init, then owned by the project
const RULES = [
  { kind: 'managed', match: (p) => p.startsWith('.claude/agents/') || p.startsWith('.claude/commands/') },
  { kind: 'block', match: (p) => p === 'AGENTS.md' || p === 'CLAUDE.md' },
  { kind: 'seed', match: () => true },
];

// ---------- helpers ----------

function read(file) { return fs.readFileSync(file, 'utf8'); }
function norm(s) { return s.replace(/\r\n/g, '\n'); }
function hash(s) { return crypto.createHash('sha256').update(norm(s)).digest('hex').slice(0, 16); }
function exists(f) { return fs.existsSync(f); }

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

function kindOf(rel) { return RULES.find((r) => r.match(rel)).kind; }

function splitBlock(text) {
  const t = norm(text);
  const b = t.match(BEGIN_RE);
  const e = t.match(END_RE);
  if (!b || !e || e.index < b.index) return null;
  const endOfEnd = e.index + e[0].length;
  return { before: t.slice(0, b.index), block: t.slice(b.index, endOfEnd), after: t.slice(endOfEnd) };
}

function fillPlaceholders(text, projectDir) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return text
    .replaceAll('{{PROJECT_NAME}}', path.basename(path.resolve(projectDir)))
    .replaceAll('{{YEAR_MONTH}}', ym);
}

function loadState(projectDir) {
  const f = path.join(projectDir, STATE_FILE);
  const state = exists(f) ? JSON.parse(read(f)) : { version: null, files: {} };
  if (!state.files || typeof state.files !== 'object' || Array.isArray(state.files)) die('invalid state.files');
  state.pending ??= {};
  if (typeof state.pending !== 'object' || Array.isArray(state.pending)) die('invalid state.pending');
  return state;
}

// Reject state paths and links that could make writes escape the target project.
function safePath(dir, rel) {
  if (typeof rel !== 'string' || rel.includes('\\') || rel.includes(':') || rel.startsWith('/') || rel.split('/').some(p => !p || p === '.' || p === '..')) die('unsafe relative path: ' + rel);
  let current = path.resolve(dir);
  for (const part of rel.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) die('refusing linked path: ' + rel);
  }
  return current;
}

// ---------- core ----------

class Run {
  constructor(projectDir, { dryRun = false, force = false } = {}) {
    this.dir = projectDir;
    this.dryRun = dryRun;
    this.force = force;
    this.log = [];
  }
  note(action, rel, extra = '') { this.log.push([action, rel, extra]); }
  write(rel, content) {
    if (this.dryRun) return;
    const full = safePath(this.dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, norm(content));
  }
  remove(rel) { if (!this.dryRun) fs.rmSync(safePath(this.dir, rel)); }
  print() {
    const w = Math.max(8, ...this.log.map(([a]) => a.length));
    for (const [a, r, x] of this.log) console.log(`  ${a.padEnd(w)}  ${r}${x ? '  — ' + x : ''}`);
    if (this.dryRun) console.log('\n  (dry run: nothing written)');
  }
}

// State per file = hash of the kit version last delivered to the project ("base").
//   local == kit                 -> ok
//   kit unchanged since base     -> local edits are kept ("custom")
//   local untouched since base   -> replaced with the new kit version
//   both changed                 -> CONFLICT: <file>.kit-new; base moves only after the owner merges
function decide(run, rel, localText, kitText, base) {
  const lh = hash(localText), kh = hash(kitText);
  if (lh === kh) return 'ok';
  if (run.force) return 'update';
  if (base === kh) return 'custom';
  if (base !== undefined && lh === base) return 'update';
  return 'conflict';
}

// 0.1–0.3 matched markers with \s*, so a block hash could include the
// blank lines after the end marker. Used only to recognise old bases.
function legacyBlock(text) {
  const t = norm(text);
  const b = t.match(/^<!-- dev-kit:begin.*-->\s*$/m);
  const e = t.match(/^<!-- dev-kit:end -->\s*$/m);
  return b && e && e.index > b.index ? t.slice(b.index, e.index + e[0].length) : undefined;
}

// Seed files shipped by 0.1–0.3, whose state did not record seeds.
const LEGACY_SEEDS = [
  '.claude/settings.json', 'docs/ARCHITECTURE.md', 'docs/DEPLOY.md', 'docs/HANDOFF.md',
  'docs/PROJECT.md', 'docs/decisions/ADR-000-template.md', 'docs/decisions/README.md',
  'docs/design/README.md', 'docs/history/README.md', 'docs/product/README.md',
];

const MERGE_MARKERS = /^(?:<<<<<<<(?: |$)|=======$|>>>>>>>(?: |$))/m;

// A conflict waits while <file>.kit-new exists. Deleting it means "merged":
// the next update accepts the file as it is — no extra command.
function syncOwned(run, rel, tpl, state, newState, block) {
  const full = safePath(run.dir, rel);
  const sidecar = safePath(run.dir, rel + '.kit-new');
  const incoming = block ? splitBlock(tpl)?.block : tpl;
  if (incoming === undefined) die('invalid template markers: ' + rel);
  let base = state.files[rel];
  let pending = state.pending[rel];
  if (!pending && exists(sidecar)) pending = { incoming: hash(incoming) };
  if (base !== undefined) newState.files[rel] = base;
  delete newState.pending[rel];

  if (pending && !run.force) {
    const content = exists(full) ? read(full) : '';
    const problem = exists(sidecar) ? 'waiting: merge ' + rel + '.kit-new into the file, then delete it'
      : MERGE_MARKERS.test(content) ? 'merge markers (<<<<<<<) left in the file'
      : block && !splitBlock(content) ? 'dev-kit markers missing in the file'
      : null;
    if (problem) { newState.pending[rel] = pending; run.note('CONFLICT', rel, problem); return; }
    base = pending.incoming;                       // the owner merged it
    newState.files[rel] = base;
    run.note('merged', rel, 'your merge accepted');
  }

  if (!exists(full)) {
    if (base && !run.force) { run.note('skipped', rel, 'deleted locally; --force restores it'); return; }
    run.write(rel, tpl); newState.files[rel] = hash(incoming); run.note('added', rel);
    if (run.force && exists(sidecar)) run.remove(rel + '.kit-new');
    return;
  }
  const local = read(full);
  const parts = block ? splitBlock(local) : null;
  const localOwned = block ? parts?.block : local;
  const merged = block && parts ? parts.before + incoming + parts.after : tpl;
  if (block && localOwned !== undefined && base !== undefined && base !== hash(localOwned)) {
    if (hash(legacyBlock(local) ?? '') === base) base = hash(localOwned);
    else if (hash(legacyBlock(tpl) ?? '') === base) base = hash(incoming);
  }
  // Unknown base is a conflict, never permission to replace existing rules.
  const action = localOwned === undefined ? 'conflict' : decide(run, rel, localOwned, incoming, base);
  if (action === 'conflict') {
    run.write(rel + '.kit-new', merged);
    newState.pending[rel] = { incoming: hash(incoming) };
    run.note('CONFLICT', rel, 'your version kept; kit version in ' + rel + '.kit-new — merge, then delete it');
    return;
  }
  if (action === 'custom') run.note('custom', rel, 'local edits kept');
  else {
    if (action === 'update') run.write(rel, merged);
    newState.files[rel] = hash(incoming);
    if (action === 'update' || !run.log.some(([x, r]) => x === 'merged' && r === rel)) run.note(action === 'ok' ? 'ok' : 'updated', rel);
  }
  if (run.force && exists(sidecar)) run.remove(rel + '.kit-new');
}

function sync(projectDir, { init, dryRun, force }) {
  if (!exists(projectDir) || !fs.statSync(projectDir).isDirectory()) die(`not a folder: ${projectDir}`);
  const state = loadState(projectDir);
  if (!init && !state.version) die(`${projectDir} has no ${STATE_FILE}; run init first`);
  const run = new Run(projectDir, { dryRun, force });
  const newState = { version: VERSION, updated: new Date().toISOString().slice(0, 10), files: {}, pending: { ...state.pending }, seeds: [] };
  const tplFiles = walk(TEMPLATE);

  // Preflight all tracked paths before any mutation.
  for (const rel of [...tplFiles, ...Object.keys(state.files), ...Object.keys(state.pending), STATE_FILE]) {
    safePath(projectDir, rel); safePath(projectDir, rel + '.kit-new');
  }
  for (const rel of tplFiles) {
    const kind = kindOf(rel);
    const tpl = read(path.join(TEMPLATE, rel));
    if (kind === 'managed') syncOwned(run, rel, tpl, state, newState, false);
    else if (kind === 'block') syncOwned(run, rel, tpl, state, newState, true);
    else {
      // Seed: created once. Update adds only seeds that are new in the kit,
      // so a file the owner deleted on purpose is not recreated.
      newState.seeds.push(rel);
      const known = (state.seeds ?? (state.version ? LEGACY_SEEDS : [])).includes(rel);
      if (exists(safePath(projectDir, rel))) { if (init) run.note('kept', rel, 'exists, project-owned'); }
      else if (init || !known) { run.write(rel, fillPlaceholders(tpl, projectDir)); run.note('created', rel, init ? '' : 'new in the kit'); }
    }
  }

  // Managed files the kit no longer ships.
  for (const [rel, h] of Object.entries(state.files)) {
    if (tplFiles.includes(rel) || kindOf(rel) !== 'managed') continue;
    const full = safePath(projectDir, rel);
    if (state.pending[rel]) {
      newState.files[rel] = h;
      if (exists(safePath(projectDir, rel + '.kit-new'))) { run.note('CONFLICT', rel, 'merge and delete ' + rel + '.kit-new first'); continue; }
      delete newState.pending[rel];
      run.note('orphan', rel, 'no longer in the kit, your version kept');
      continue;
    }
    if (!exists(full)) continue;
    if (hash(read(full)) === h || force) { run.remove(rel); run.note('removed', rel, 'no longer in the kit'); }
    else { newState.files[rel] = h; run.note('orphan', rel, 'no longer in the kit, edited locally — kept'); }
  }

  for (const rel of tplFiles) {
    if (exists(path.join(projectDir, rel + '.kit-new')) && !run.log.some(([a, r]) => a === 'CONFLICT' && r === rel)) run.note('pending', rel + '.kit-new', 'not merged yet');
  }

  if (!dryRun) {
    fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, STATE_FILE), JSON.stringify(newState, null, 2) + '\n');
  }
  console.log(`dev-kit ${state.version ?? '(none)'} → ${VERSION}  in ${path.resolve(projectDir)}\n`);
  run.print();
  const conflicts = Object.keys(newState.pending).length;
  if (conflicts) { console.log('\n  Conflicts: merge what you want from each *.kit-new into the file and delete the *.kit-new; the next update accepts it.'); process.exitCode = 2; }
}

function status(projectDir) {
  const state = loadState(projectDir);
  if (!state.version) { console.log(`${projectDir}: dev-kit not installed`); return; }
  console.log(`installed ${state.version} (updated ${state.updated}), kit ${VERSION}`);
  sync(projectDir, { init: false, dryRun: true, force: false });
}

function die(msg) { console.error('dev-kit: ' + msg); process.exit(1); }

// ---------- CLI ----------

const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const target = rest.find((a) => !a.startsWith('--'));
const opts = { dryRun: flags.has('--dry-run'), force: flags.has('--force') };

switch (cmd) {
  case 'init': sync(target ?? die('usage: node kit.mjs init <project-dir>'), { ...opts, init: true }); break;
  case 'update': sync(target ?? die('usage: node kit.mjs update <project-dir>'), { ...opts, init: false }); break;
  case 'status': status(target ?? die('usage: node kit.mjs status <project-dir>')); break;
  default:
    console.log(`dev-kit ${VERSION}
  node kit.mjs init   <project-dir> [--dry-run]           install into a project
  node kit.mjs update <project-dir> [--dry-run] [--force] update kit-owned files
  node kit.mjs status <project-dir>                       what update would do`);
}

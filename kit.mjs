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

const BEGIN_RE = /^<!-- dev-kit:begin.*-->\s*$/m;
const END_RE = /^<!-- dev-kit:end -->\s*$/m;

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
  return exists(f) ? JSON.parse(read(f)) : { version: null, files: {} };
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
    const full = path.join(this.dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, norm(content));
  }
  remove(rel) { if (!this.dryRun) fs.rmSync(path.join(this.dir, rel)); }
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
//   both changed                 -> CONFLICT: new version in <file>.kit-new, base moves on
//                                   (merge by hand once; later updates keep your merge)
function decide(run, rel, localText, kitText, base) {
  const lh = hash(localText), kh = hash(kitText);
  if (lh === kh) return 'ok';
  if (run.force) return 'update';
  if (base === kh) return 'custom';
  if (base !== undefined && lh === base) return 'update';
  return 'conflict';
}

function syncManaged(run, rel, tpl, state, newState) {
  const full = path.join(run.dir, rel);
  const base = state.files[rel];
  if (!exists(full)) {
    if (base && !run.force) { run.note('skipped', rel, 'deleted locally; --force restores it'); newState.files[rel] = base; return; }
    run.write(rel, tpl); newState.files[rel] = hash(tpl); run.note('added', rel); return;
  }
  newState.files[rel] = hash(tpl);
  switch (decide(run, rel, read(full), tpl, base)) {
    case 'ok': run.note('ok', rel); break;
    case 'custom': newState.files[rel] = base; run.note('custom', rel, 'edited locally, kit unchanged — kept'); break;
    case 'update': run.write(rel, tpl); run.note('updated', rel); break;
    case 'conflict': run.write(rel + '.kit-new', tpl); run.note('CONFLICT', rel, 'edited locally and changed in the kit; new version in ' + rel + '.kit-new'); break;
  }
}

function syncBlock(run, rel, tpl, state, newState) {
  const full = path.join(run.dir, rel);
  const t = splitBlock(tpl);
  if (!exists(full)) { run.write(rel, tpl); newState.files[rel] = hash(t.block); run.note('added', rel); return; }
  const l = splitBlock(read(full));
  if (!l) {
    run.write(rel + '.kit-new', tpl);
    run.note('CONFLICT', rel, 'no dev-kit markers; template in ' + rel + '.kit-new — merge it (or run /adopt)');
    return;
  }
  // No base yet (markers added by hand): the kit's block wins.
  const base = state.files[rel] ?? hash(l.block);
  const merged = l.before + t.block + l.after;
  newState.files[rel] = hash(t.block);
  switch (decide(run, rel, l.block, t.block, base)) {
    case 'ok': run.note('ok', rel); break;
    case 'custom': newState.files[rel] = base; run.note('custom', rel, 'kit block edited locally, kit unchanged — kept'); break;
    case 'update': run.write(rel, merged); run.note('updated', rel, 'kit block'); break;
    case 'conflict': run.write(rel + '.kit-new', merged); run.note('CONFLICT', rel, 'kit block edited locally and changed in the kit; merged file in ' + rel + '.kit-new'); break;
  }
}

function sync(projectDir, { init, dryRun, force }) {
  if (!exists(projectDir) || !fs.statSync(projectDir).isDirectory()) die(`not a folder: ${projectDir}`);
  const state = loadState(projectDir);
  if (!init && !state.version) die(`${projectDir} has no ${STATE_FILE}; run init first`);
  const run = new Run(projectDir, { dryRun, force });
  const newState = { version: VERSION, updated: new Date().toISOString().slice(0, 10), files: {} };
  const tplFiles = walk(TEMPLATE);

  for (const rel of tplFiles) {
    const kind = kindOf(rel);
    const tpl = read(path.join(TEMPLATE, rel));
    if (kind === 'managed') syncManaged(run, rel, tpl, state, newState);
    else if (kind === 'block') syncBlock(run, rel, tpl, state, newState);
    else if (init) {
      if (exists(path.join(projectDir, rel))) run.note('kept', rel, 'exists, project-owned');
      else { run.write(rel, fillPlaceholders(tpl, projectDir)); run.note('created', rel); }
    }
  }

  // Managed files the kit no longer ships.
  for (const [rel, h] of Object.entries(state.files)) {
    if (tplFiles.includes(rel) || kindOf(rel) !== 'managed') continue;
    const full = path.join(projectDir, rel);
    if (!exists(full)) continue;
    if (hash(read(full)) === h || force) { run.remove(rel); run.note('removed', rel, 'no longer in the kit'); }
    else { run.note('orphan', rel, 'no longer in the kit, edited locally — kept'); }
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
  const conflicts = run.log.filter(([a]) => a === 'CONFLICT').length;
  if (conflicts) console.log(`\n  ${conflicts} conflict(s): compare *.kit-new with the file, merge, delete *.kit-new, run update again.`);
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

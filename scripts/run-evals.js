#!/usr/bin/env node
// Routing evals: does each skill description attract the prompts it should, and only those?
//   node scripts/run-evals.js                    keyword ranking, deterministic, runs in CI
//   node scripts/run-evals.js --runner copilot   ask a real model (opt-in, costs tokens); also: claude
// Approach adapted from addyosmani/agent-skills scripts/run-evals.js (MIT).
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile, execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { frontmatter } = require('./validate');

const ROOT = path.resolve(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'evals', 'cases');
const DISTRACTORS_FILE = path.join(ROOT, 'evals', 'distractors.json');

const MIN_POSITIVE = 3;
const MIN_NEGATIVE = 2;
const TOP_K = 3;
const COLLISION_WARN = 0.5;
const COLLISION_ERROR = 0.75;
const RUNNER_TIMEOUT_MS = 2 * 60 * 1000;
const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---------- loading ----------

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function loadSkills(ref) {
  const names = ref
    ? git(['ls-tree', '--name-only', `${ref}:skills`]).split('\n').filter(Boolean)
    : fs.readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  return names.flatMap((name) => {
    const rel = `skills/${name}/SKILL.md`;
    let text;
    try {
      text = ref ? git(['show', `${ref}:${rel}`]) : fs.readFileSync(path.join(ROOT, rel), 'utf8');
    } catch {
      return [];
    }
    const data = frontmatter(path.join(ROOT, rel), text);
    return data?.description ? [{ name, description: data.description, own: true }] : [];
  });
}

function loadDistractors() {
  return JSON.parse(fs.readFileSync(DISTRACTORS_FILE, 'utf8')).skills.map((s) => ({ ...s, own: false }));
}

function loadCases() {
  if (!fs.existsSync(CASES_DIR)) return [];
  return fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.json')).sort().map((file) => {
    try {
      return { file, data: JSON.parse(fs.readFileSync(path.join(CASES_DIR, file), 'utf8')) };
    } catch (error) {
      return { file, parseError: error.message };
    }
  });
}

// Coverage and schema problems, shared by both tiers.
function checkCases(skills, cases) {
  const problems = [];
  const own = new Set(skills.map((s) => s.name));
  for (const s of skills) {
    if (!cases.some((c) => c.file === `${s.name}.json`)) problems.push(`${s.name}: no case file (evals/cases/${s.name}.json)`);
  }
  for (const c of cases) {
    if (c.parseError) {
      problems.push(`${c.file}: invalid JSON — ${c.parseError}`);
      continue;
    }
    const skill = c.file.replace(/\.json$/, '');
    if (c.data.skill_name !== skill) problems.push(`${c.file}: skill_name "${c.data.skill_name}" does not match the filename`);
    if (!own.has(skill)) problems.push(`${c.file}: no skill named "${skill}"`);
    const positive = c.data.trigger?.positive ?? [];
    const negative = c.data.trigger?.negative ?? [];
    if (positive.length < MIN_POSITIVE || negative.length < MIN_NEGATIVE) {
      problems.push(`${skill}: needs ${MIN_POSITIVE} positive / ${MIN_NEGATIVE} negative prompts, has ${positive.length}/${negative.length}`);
    }
    for (const t of [...positive, ...negative]) {
      if (typeof t.prompt !== 'string' || !t.prompt.trim()) problems.push(`${c.file}: every trigger needs a non-empty "prompt"`);
    }
    for (const t of negative) {
      // Owners point at our own skills only; third-party distractors are never asserted on.
      if (t.owner !== undefined && (!own.has(t.owner) || t.owner === skill)) {
        problems.push(`${c.file}: negative owner "${t.owner}" must be another skill in this repo`);
      }
    }
  }
  return problems;
}

// ---------- tier 1: keyword ranking ----------

const STOP = new Set(
  'a an and any are as at be before by can could for from help how i in into is it its let me my need of on or our please so some that the them this to up use want we what when which with you your'.split(' '),
);

function stem(word) {
  let w = word;
  for (const suffix of ['ing', 'ed', 'es', 's']) {
    if (w.length > suffix.length + 3 && w.endsWith(suffix) && !w.endsWith('ss')) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  if (w.length > 4 && w.at(-1) === w.at(-2) && !'aeiou'.includes(w.at(-1))) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

function tokenize(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
    .map(stem);
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function buildCorpus(catalog) {
  const docs = new Map();
  for (const s of catalog) {
    const nameTokens = tokenize(s.name.replace(/-/g, ' '));
    docs.set(s.name, termFreq([...nameTokens, ...nameTokens, ...tokenize(s.description)]));
  }
  const df = new Map();
  for (const tf of docs.values()) for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const idf = (term) => Math.log(1 + docs.size / (1 + (df.get(term) ?? 0)));
  return { docs, idf };
}

function vec(tf, idf) {
  return new Map([...tf].map(([term, f]) => [term, f * idf(term)]));
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [t, w] of a) {
    na += w * w;
    dot += w * (b.get(t) ?? 0);
  }
  for (const w of b.values()) nb += w * w;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function rank(prompt, corpus) {
  const pv = vec(termFreq(tokenize(prompt)), corpus.idf);
  return [...corpus.docs]
    .map(([name, tf]) => ({ name, score: cosine(pv, vec(tf, corpus.idf)) }))
    .sort((a, b) => b.score - a.score);
}

function runLexical({ catalog, skills, cases, minRank1, only }) {
  const corpus = buildCorpus(catalog);
  const own = new Set(skills.map((s) => s.name));
  const errors = checkCases(skills, cases);
  const warnings = [];
  let passed = 0;
  let positives = 0;
  let rank1 = 0;
  let skipped = 0;
  const top3 = (ranking) => ranking.filter((r) => r.score > 0).slice(0, 3).map((r) => `${r.name} (${r.score.toFixed(2)})`).join(', ') || 'none';

  for (const c of cases) {
    const skill = c.data?.skill_name;
    if (!own.has(skill) || (only && skill !== only)) continue;

    for (const t of c.data.trigger?.positive ?? []) {
      if (t.lexical === false) {
        skipped++;
        continue;
      }
      positives++;
      const ranking = rank(t.prompt, corpus);
      const idx = ranking.findIndex((r) => r.name === skill);
      if (idx === 0 && ranking[0].score > 0) rank1++;
      if (ranking[idx].score === 0) errors.push(`${skill}: shares no vocabulary with "${t.prompt}"`);
      else if (idx >= TOP_K) errors.push(`${skill}: ranked #${idx + 1} (need top ${TOP_K}) for "${t.prompt}" — top: ${top3(ranking)}`);
      else passed++;
    }

    for (const t of c.data.trigger?.negative ?? []) {
      if (t.lexical === false) {
        skipped++;
        continue;
      }
      const ranking = rank(t.prompt, corpus);
      let ok = true;
      if (ranking[0].name === skill && ranking[0].score > 0) {
        errors.push(`${skill}: ranked #1 for negative prompt "${t.prompt}" (description too broad)`);
        ok = false;
      }
      if (t.owner) {
        const ownerIdx = ranking.findIndex((r) => r.name === t.owner);
        const selfIdx = ranking.findIndex((r) => r.name === skill);
        if (ranking[ownerIdx].score === 0 || ownerIdx > selfIdx) {
          errors.push(`${skill}: owner ${t.owner} (#${ownerIdx + 1}) does not outrank it (#${selfIdx + 1}) for "${t.prompt}"`);
          ok = false;
        }
      }
      if (ok) passed++;
    }
  }

  // Only pairs that involve at least one of our skills; a collision is an error only between two of ours.
  const names = [...corpus.docs.keys()];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const [a, b] = [names[i], names[j]];
      if (!own.has(a) && !own.has(b)) continue;
      if (only && a !== only && b !== only) continue;
      const sim = cosine(vec(corpus.docs.get(a), corpus.idf), vec(corpus.docs.get(b), corpus.idf));
      const label = `${a} ↔ ${b} descriptions are ${(sim * 100).toFixed(0)}% similar`;
      if (sim >= COLLISION_ERROR && own.has(a) && own.has(b)) errors.push(`collision: ${label}`);
      else if (sim >= COLLISION_WARN) warnings.push(`overlap: ${label}`);
    }
  }

  const rate = positives ? (rank1 / positives) * 100 : 0;
  if (minRank1 !== undefined && rate < minRank1) errors.push(`rank-1 rate ${rate.toFixed(0)}% is below the required ${minRank1}%`);

  for (const e of errors) console.log(`  ✗  ${e}`);
  for (const w of warnings) console.log(`  ⚠  ${w}`);
  console.log(`\n${passed} trigger checks passed — ${errors.length} error(s), ${warnings.length} warning(s), ${skipped} non-English prompt(s) skipped`);
  console.log(`rank-1 rate: ${rate.toFixed(0)}% (${rank1}/${positives} positive prompts rank their skill first)`);
  return errors.length ? 1 : 0;
}

// ---------- tier 2: real model ----------

const RUNNERS = {
  copilot: (prompt, model) => [
    'copilot',
    ['-s', '--no-custom-instructions', '--disable-builtin-mcps', '--no-ask-user', '--available-tools', 'none', ...(model ? ['--model', model] : []), '-p', prompt],
  ],
  claude: (prompt, model) => ['claude', ['-p', '--tools', '', '--strict-mcp-config', ...(model ? ['--model', model] : []), prompt]],
};

function routerPrompt(catalog, request) {
  const list = catalog.map((s) => `- ${s.name}: ${s.description}`).join('\n');
  return [
    'You are the skill router of a coding agent. Before acting, the agent loads every skill whose description matches the request.',
    'Choose only from the skills listed below. Do not use tools.',
    `<skills>\n${list}\n</skills>`,
    'Reply with JSON only, no prose: {"skills": ["<name>", ...]}. List the skills you would load, most relevant first. Use an empty list when no skill fits.',
    `<request>\n${request}\n</request>`,
  ].join('\n\n');
}

function callRunner(runner, model, prompt, cwd) {
  const [cmd, args] = RUNNERS[runner](prompt, model);
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, encoding: 'utf8', timeout: RUNNER_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(`${cmd} failed: ${(stderr || stdout || error.message).trim().split('\n').slice(-3).join(' ')}`));
      else resolve(stdout);
    });
  });
}

function parsePicks(raw, known) {
  const json = raw.match(/\{[\s\S]*\}/);
  if (!json) return null;
  try {
    const skills = JSON.parse(json[0]).skills;
    return Array.isArray(skills) ? skills.filter((s) => known.has(s)) : null;
  } catch {
    return null;
  }
}

async function pool(items, limit, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  }));
}

async function runModel({ catalog, skills, cases, runner, model, runs, concurrency, minPass, only }) {
  const problems = checkCases(skills, cases);
  if (problems.length) {
    for (const p of problems) console.log(`  ✗  ${p}`);
    return 1;
  }
  const own = new Set(skills.map((s) => s.name));
  const known = new Set(catalog.map((s) => s.name));
  const triggers = cases
    .filter((c) => own.has(c.data.skill_name) && (!only || c.data.skill_name === only))
    .flatMap((c) => [
      ...(c.data.trigger.positive ?? []).map((t) => ({ ...t, skill: c.data.skill_name, kind: 'positive' })),
      ...(c.data.trigger.negative ?? []).map((t) => ({ ...t, skill: c.data.skill_name, kind: 'negative' })),
    ]);
  const jobs = triggers.flatMap((trigger) => Array.from({ length: runs }, () => trigger));

  // Empty cwd, so the runner loads no project instructions or skills from this repo.
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-routing-eval-'));
  console.log(`Routing ${triggers.length} prompts × ${runs} runs through ${runner}${model ? ` (${model})` : ''} against ${catalog.length} skills…\n`);

  const results = new Map(triggers.map((t) => [t, []]));
  const record = async (trigger) => {
    let picks;
    try {
      picks = parsePicks(await callRunner(runner, model, routerPrompt(catalog, trigger.prompt), cwd), known);
    } catch (error) {
      picks = { error: error.message };
    }
    results.get(trigger).push(picks);
  };

  try {
    // Fail fast on a missing login or CLI before spending the whole batch.
    await record(jobs[0]);
    const first = results.get(jobs[0])[0];
    if (first?.error) {
      console.log(`  ✗  ${first.error}`);
      return 1;
    }
    await pool(jobs.slice(1), concurrency, record);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }

  const passes = (t, picks) => Array.isArray(picks) && (t.kind === 'positive' ? picks.includes(t.skill) : !picks.includes(t.skill));
  const bySkill = new Map();
  let passedRuns = 0;
  const failures = [];
  for (const [t, all] of results) {
    const ok = all.filter((p) => passes(t, p)).length;
    passedRuns += ok;
    const row = bySkill.get(t.skill) ?? { positive: [0, 0], negative: [0, 0] };
    row[t.kind][0] += ok;
    row[t.kind][1] += all.length;
    bySkill.set(t.skill, row);
    if (ok * 2 <= all.length) failures.push({ t, ok, all });
  }

  const pct = ([ok, total]) => (total ? `${ok}/${total}`.padEnd(7) + `${Math.round((ok / total) * 100)}%`.padStart(5) : 'n/a');
  console.log(`${'skill'.padEnd(20)} ${'picked when it should'.padEnd(22)} left alone when it should`);
  for (const [skill, row] of [...bySkill].sort()) console.log(`${skill.padEnd(20)} ${pct(row.positive).padEnd(22)} ${pct(row.negative)}`);

  if (failures.length) {
    console.log('\nFailing prompts (majority of runs):');
    for (const { t, ok, all } of failures) {
      const seen = all.map((p) => (Array.isArray(p) ? `[${p.join(', ')}]` : p?.error ? `error: ${p.error}` : 'unparseable reply'));
      console.log(`  ✗  ${t.skill} (${t.kind}) ${ok}/${all.length}: "${t.prompt}"\n       got ${[...new Set(seen)].join(' | ')}`);
    }
  }

  const rate = (passedRuns / jobs.length) * 100;
  console.log(`\npass rate: ${rate.toFixed(0)}% (${passedRuns}/${jobs.length} runs)`);
  if (minPass !== undefined && rate < minPass) {
    console.log(`  ✗  below the required ${minPass}%`);
    return 1;
  }
  return 0;
}

// ---------- main ----------

function numberOption(values, key, { min = 0, max = Infinity, integer = false } = {}) {
  if (values[key] === undefined) return undefined;
  const n = Number(values[key]);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`--${key} must be a number from ${min} to ${max}`);
  }
  return n;
}

async function main() {
  const { values } = parseArgs({
    options: {
      runner: { type: 'string' },
      model: { type: 'string' },
      runs: { type: 'string', default: '3' },
      concurrency: { type: 'string', default: '4' },
      ref: { type: 'string' },
      only: { type: 'string' },
      'no-distractors': { type: 'boolean', default: false },
      'min-rank1': { type: 'string' },
      'min-pass': { type: 'string' },
    },
  });

  if (values.runner && !RUNNERS[values.runner]) throw new Error(`--runner must be one of: ${Object.keys(RUNNERS).join(', ')}`);
  if (values.only && !SKILL_NAME.test(values.only)) throw new Error('--only must be a kebab-case skill name');
  if (values.ref) git(['rev-parse', '--verify', '--quiet', `${values.ref}^{commit}`]);

  const skills = loadSkills(values.ref);
  const catalog = [...skills, ...(values['no-distractors'] ? [] : loadDistractors())].sort((a, b) => a.name.localeCompare(b.name));
  const cases = loadCases();
  console.log(`Skills from ${values.ref ?? 'working tree'}: ${skills.length} ours${values['no-distractors'] ? '' : ` + ${catalog.length - skills.length} distractors`}, ${cases.length} case files\n`);

  if (!values.runner) {
    return runLexical({ catalog, skills, cases, only: values.only, minRank1: numberOption(values, 'min-rank1', { max: 100 }) });
  }
  return runModel({
    catalog,
    skills,
    cases,
    only: values.only,
    runner: values.runner,
    model: values.model,
    runs: numberOption(values, 'runs', { min: 1, max: 20, integer: true }),
    concurrency: numberOption(values, 'concurrency', { min: 1, max: 16, integer: true }),
    minPass: numberOption(values, 'min-pass', { max: 100 }),
  });
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`✖ ${error.message}`);
    process.exit(1);
  },
);

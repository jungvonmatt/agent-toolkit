const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const script = path.resolve(__dirname, '../skills/pr-review/scripts/legacy-scan.mjs');
const reference = path.resolve(__dirname, '../skills/pr-review/references/modern-web-guidance.md');
const load = () => import('../skills/pr-review/scripts/legacy-scan.mjs');

// Keeps the developer's own git configuration out of the fixture repositories.
const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
const twelveRules = Array.from({ length: 12 }, (_, i) => `.r${i} {\n  color: red;\n}\n`).join('');
const legacyRule = '.acc {\n  max-height: 0;\n  overflow: hidden;\n  transition: max-height .3s;\n}\n';

// Creates a repository with a `main` commit and a `pr` commit, then checks out `main` again.
function fixture(context, { base = {}, change }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'legacy-scan-test-'));
  context.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: dir, env: gitEnv });
  git('init', '-q', '-b', 'main');
  for (const [file, text] of Object.entries(base)) writeFileSync(path.join(dir, file), text);
  git('add', '-A');
  git('commit', '-q', '--allow-empty', '-m', 'base');
  git('checkout', '-q', '-b', 'pr');
  change({ dir, git });
  git('add', '-A');
  git('commit', '-q', '-m', 'pr');
  const head = git('rev-parse', 'HEAD').toString().trim();
  git('checkout', '-q', 'main');
  return { dir, refs: { checkout: dir, base: 'main', head } };
}

// A stub scanner: it records the folder it got and reports one finding per staged web file.
function stubScanner(seen = {}) {
  return (folder) => {
    seen.folder = folder;
    seen.files = Object.fromEntries(readdirSync(folder).map((name) => [name, readFileSync(path.join(folder, name), 'utf8')]));
    const names = Object.keys(seen.files).filter((name) => name !== '.mwgrc');
    const findings = names.map((file) => ({ file, line: 1, lineContent: '.acc {', message: 'uses max-height' }));
    const rule = { ruleId: 'animate-to-intrinsic-sizes', verifierRubric: { keepWhen: ['keep'], dropWhen: ['drop'] }, findings };
    return { guides: [{ guideId: 'animate-to-intrinsic-sizes', rules: [rule] }], note: 'covers part of the guides' };
  };
}

test('scans the head version of a changed file while the base is checked out', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, { base: { 'a.css': '.a {}\n' }, change: ({ dir }) => writeFileSync(path.join(dir, 'a.css'), `.a {}\n${legacyRule}`) });
  const seen = {};
  const report = scanPullRequest(refs, { runScanner: stubScanner(seen), version: '1.2.3' });
  assert.equal(report.status, 'ok');
  assert.equal(seen.files['1.css'], `.a {}\n${legacyRule}`);
  assert.deepEqual(report.scanned, [{ path: 'a.css', changedLines: [[2, 6]] }]);
});

test('follows a renamed and edited file to its new path', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, {
    base: { 'old.css': twelveRules },
    change: ({ dir, git }) => {
      git('mv', 'old.css', 'new.css');
      writeFileSync(path.join(dir, 'new.css'), twelveRules + legacyRule);
    },
  });
  const report = scanPullRequest(refs, { runScanner: stubScanner(), version: '1.2.3' });
  assert.deepEqual(report.scanned, [{ path: 'new.css', changedLines: [[37, 41]] }]);
});

test('skips symlinks, deletions, and files that are not web files', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, {
    base: { 'gone.css': '.g {}\n', 'notes.md': 'a\n' },
    change: ({ dir, git }) => {
      git('rm', '-q', 'gone.css');
      writeFileSync(path.join(dir, 'notes.md'), 'b\n');
      symlinkSync('/etc/hosts', path.join(dir, 'link.css'));
      writeFileSync(path.join(dir, 'kept.vue'), '<template></template>\n');
    },
  });
  const report = scanPullRequest(refs, { runScanner: stubScanner(), version: '1.2.3' });
  assert.deepEqual(report.scanned.map((file) => file.path), ['kept.vue']);
  assert.deepEqual(report.skipped, [{ path: 'link.css', reason: 'symlink' }]);
});

test('keeps a hostile file name out of every shell', async (t) => {
  const { scanPullRequest } = await load();
  const name = "x$(touch PWNED)it's.css";
  const { dir, refs } = fixture(t, { change: ({ dir }) => writeFileSync(path.join(dir, name), legacyRule) });
  const report = scanPullRequest(refs, { runScanner: stubScanner(), version: '1.2.3' });
  assert.deepEqual(report.scanned.map((file) => file.path), [name]);
  assert.equal(existsSync(path.join(dir, 'PWNED')), false);
  assert.equal(existsSync(path.join(process.cwd(), 'PWNED')), false);
});

test("uses the base ref's .mwgrc, not the PR's", async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, {
    base: { '.mwgrc': '{"baseline":"widely"}\n' },
    change: ({ dir }) => {
      writeFileSync(path.join(dir, '.mwgrc'), '{"baseline":"limited","allowVolatileFeatures":true}\n');
      writeFileSync(path.join(dir, 'a.css'), legacyRule);
    },
  });
  const seen = {};
  scanPullRequest(refs, { runScanner: stubScanner(seen), version: '1.2.3' });
  assert.equal(seen.files['.mwgrc'], '{"baseline":"widely"}\n');
});

test('writes {} as .mwgrc when the base has none, so ~/.mwgrc stays out', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, { change: ({ dir }) => writeFileSync(path.join(dir, 'a.css'), legacyRule) });
  const seen = {};
  scanPullRequest(refs, { runScanner: stubScanner(seen), version: '1.2.3' });
  assert.equal(seen.files['.mwgrc'], '{}\n');
});

test('maps each finding back to its PR path with the rule rubric and changed lines', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, { change: ({ dir }) => writeFileSync(path.join(dir, 'b.scss'), legacyRule) });
  const report = scanPullRequest(refs, { runScanner: stubScanner(), version: '1.2.3' });
  assert.deepEqual(report.findings, [
    {
      path: 'b.scss',
      line: 1,
      lineContent: '.acc {',
      guideId: 'animate-to-intrinsic-sizes',
      ruleId: 'animate-to-intrinsic-sizes',
      message: 'uses max-height',
      keepWhen: ['keep'],
      dropWhen: ['drop'],
      changedLines: [[1, 5]],
    },
  ]);
  assert.equal(report.note, 'covers part of the guides');
});

test('reports skipped and runs no scanner when no web file changed', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, { change: ({ dir }) => writeFileSync(path.join(dir, 'notes.md'), 'a\n') });
  const report = scanPullRequest(refs, { runScanner: () => assert.fail('the scanner must not run'), version: '1.2.3' });
  assert.equal(report.status, 'skipped');
  assert.equal(report.reason, 'no changed web files');
});

test('reports unavailable when the scanner fails, and deletes its folder', async (t) => {
  const { scanPullRequest } = await load();
  const { refs } = fixture(t, { change: ({ dir }) => writeFileSync(path.join(dir, 'a.css'), legacyRule) });
  let folder;
  const failing = (dir) => {
    folder = dir;
    throw Object.assign(new Error('Command failed'), { stderr: 'npm notice New version\nmodern-web-guidance requires Node.js >= 22\n' });
  };
  const report = scanPullRequest(refs, { runScanner: failing, version: '1.2.3' });
  assert.equal(report.status, 'unavailable');
  assert.equal(report.reason, 'legacy-scan failed: modern-web-guidance requires Node.js >= 22');
  assert.equal(existsSync(folder), false);
});

test('refuses a ref that looks like a git option', async () => {
  const { scanPullRequest } = await load();
  assert.throws(() => scanPullRequest({ checkout: '.', base: '--output=x', head: 'HEAD' }), /--base needs a value/);
});

test('reads the pinned version from the shared reference', async () => {
  const { pinnedVersion } = await load();
  const pinned = readFileSync(reference, 'utf8').match(/modern-web-guidance@(\d+\.\d+\.\d+)/)[1];
  assert.equal(pinnedVersion(), pinned);
});

test('prints its usage and exits with 2 when an argument is missing', () => {
  const result = spawnSync(process.execPath, [script, '--checkout', '.'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: node legacy-scan\.mjs --checkout <path> --base <target ref> --head <head SHA>/);
});

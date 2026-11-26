#!/usr/bin/env node
// Scans the web files that a PR changes with the legacy-scan of modern-web-guidance, at the PR's head
// commit, and prints one JSON report.
//
// usage: node legacy-scan.mjs --checkout <path> --base <target ref> --head <head SHA>
//
// It reads each file from git, never from the working tree, so it scans the PR's version whatever is
// checked out, and no PR file name reaches a shell. It runs the scanner from a new temporary folder that
// holds the base ref's .mwgrc, or {} when the base has none. The PR's packages and npm settings and the
// reviewer's ~/.mwgrc therefore take no part. The folder is deleted afterwards.
//
// The report's status is "ok", "skipped" (no changed web file to scan), or "unavailable" (with a reason).
// "submitted" lists the files handed to the scanner; the scanner can still skip one without saying so, so
// a report with no findings does not prove that every file was checked. The script exits with 2 only
// when its arguments are wrong.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const USAGE = 'usage: node legacy-scan.mjs --checkout <path> --base <target ref> --head <head SHA>';
const WEB_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.scss', '.less', '.js', '.mjs', '.cjs', '.jsx',
  '.ts', '.mts', '.cts', '.tsx', '.vue', '.svelte', '.astro',
]);
const SKIPPED_MODES = new Map([['120000', 'symlink'], ['160000', 'submodule']]);
const BUFFER = 64 * 1024 * 1024;
// The pinned scanner skips a file over 1,000,000 bytes without saying so, so the helper lists it as skipped.
const SCANNER_MAX_BYTES = 1_000_000;
const COVERAGE = 'The scanner can skip a submitted file or match without saying so: past its 5,000-file limit, '
  + 'or on very long lines such as minified code. No finding does not prove that every file was checked.';

// The shared reference pins the version, so raising the pin there also raises it here.
export function pinnedVersion(reference = new URL('../references/modern-web-guidance.md', import.meta.url)) {
  const match = readFileSync(reference, 'utf8').match(/modern-web-guidance@(\d+\.\d+\.\d+)/);
  if (!match) throw new Error(`no pinned modern-web-guidance version in ${fileURLToPath(reference)}`);
  return match[1];
}

// Git's global options keep pathspecs literal and keep the user's diff tools and colors out.
function git(checkout, args, options = {}) {
  return execFileSync('git', ['--literal-pathspecs', '-C', checkout, ...args], { maxBuffer: BUFFER, ...options });
}

// Parses `git diff --raw -z` output. A rename or copy record holds the old and the new path.
function parseRawDiff(raw) {
  const fields = raw.split('\0');
  const records = [];
  for (let i = 0; i < fields.length - 1; ) {
    const [, newMode, , newBlob, status] = fields[i].slice(1).split(' ');
    const twoPaths = /^[RC]/.test(status);
    const file = fields[twoPaths ? i + 2 : i + 1];
    records.push({ status: status[0], newMode, newBlob, path: file, oldPath: twoPaths ? fields[i + 1] : file });
    i += twoPaths ? 3 : 2;
  }
  return records;
}

// Keeps the added, modified, renamed, and copied web files. Lists symlinks and submodules as skipped.
function selectFiles(records) {
  const scan = [];
  const skipped = [];
  for (const record of records) {
    if (record.status === 'D' || !WEB_EXTENSIONS.has(path.extname(record.path).toLowerCase())) continue;
    const reason = SKIPPED_MODES.get(record.newMode);
    if (reason) skipped.push({ path: record.path, reason });
    else scan.push(record);
  }
  return { scan, skipped };
}

// Returns the new-file line ranges that a `git diff -U0` patch adds or changes. A pure deletion counts
// as a change on the line before it.
function changedLines(patch) {
  return [...patch.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)].map(([, start, count = '1']) => {
    const first = Math.max(Number(start), 1);
    return [first, first + Math.max(Number(count), 1) - 1];
  });
}

// Maps each legacy-scan finding from its temporary file name back to the PR path.
function mapFindings(report, files) {
  const entries = (report.guides ?? []).flatMap((guide) =>
    (guide.rules ?? []).flatMap((rule) => (rule.findings ?? []).map((finding) => ({ guide, rule, finding }))),
  );
  return entries
    .filter(({ finding }) => files.has(finding.file))
    .map(({ guide, rule, finding }) => ({
      path: files.get(finding.file).path,
      line: finding.line,
      lineContent: finding.lineContent,
      guideId: guide.guideId,
      ruleId: rule.ruleId,
      message: finding.message,
      keepWhen: rule.verifierRubric?.keepWhen ?? [],
      dropWhen: rule.verifierRubric?.dropWhen ?? [],
      changedLines: files.get(finding.file).changedLines,
    }));
}

function runLegacyScan(folder, version) {
  const windows = process.platform === 'win32';
  const output = execFileSync(windows ? 'npx.cmd' : 'npx', ['-y', `modern-web-guidance@${version}`, 'legacy-scan', '.', '--json'], {
    cwd: folder,
    env: { ...process.env, DISABLE_TELEMETRY: '1' },
    encoding: 'utf8',
    maxBuffer: BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: windows, // npx.cmd needs a shell on Windows; every argument here is fixed or ours.
  });
  return JSON.parse(output);
}

function baseMwgrc(checkout, base) {
  try {
    return git(checkout, ['show', `${base}:.mwgrc`], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '{}\n';
  }
}

function reason(error) {
  const lines = String(error.stderr || error.message).split('\n').map((line) => line.trim());
  return lines.find((line) => line && !/^npm (notice|warn)/i.test(line)) ?? 'unknown error';
}

// Writes each file's head blob into the folder under a counter name. Returns the staged files
// (name -> { path, changedLines }) and the files over the scanner's size limit.
function stageFiles(folder, scan, { checkout, base, head }) {
  const range = `${base}...${head}`;
  const files = new Map();
  const oversized = [];
  for (const record of scan) {
    const blob = git(checkout, ['cat-file', 'blob', record.newBlob]);
    if (blob.length > SCANNER_MAX_BYTES) {
      oversized.push({ path: record.path, reason: `over the scanner's size limit of ${SCANNER_MAX_BYTES} bytes` });
      continue;
    }
    const name = `${files.size + 1}${path.extname(record.path).toLowerCase()}`;
    writeFileSync(path.join(folder, name), blob);
    const patch = git(checkout, ['diff', '-U0', '-M', '--no-color', '--no-ext-diff', '--no-textconv', range, '--', record.oldPath, record.path], { encoding: 'utf8' });
    files.set(name, { path: record.path, changedLines: changedLines(patch) });
  }
  return { files, oversized };
}

export function scanPullRequest(refs, { runScanner = runLegacyScan, version = pinnedVersion() } = {}) {
  const { checkout, base, head } = refs;
  for (const [name, value] of Object.entries({ checkout, base, head })) {
    if (!value || value.startsWith('-')) throw new Error(`--${name} needs a value that does not start with "-"`);
  }
  const raw = git(checkout, ['diff', '--raw', '-z', '--no-abbrev', '-M', `${base}...${head}`], { encoding: 'utf8' });
  const { scan, skipped } = selectFiles(parseRawDiff(raw));
  const empty = { status: 'skipped', base, head, version, submitted: [], skipped, findings: [] };
  if (scan.length === 0) return { ...empty, reason: 'no changed web files' };

  const folder = mkdtempSync(path.join(tmpdir(), 'legacy-scan-'));
  try {
    writeFileSync(path.join(folder, '.mwgrc'), baseMwgrc(checkout, base));
    const { files, oversized } = stageFiles(folder, scan, refs);
    const report = { ...empty, submitted: [...files.values()], skipped: [...skipped, ...oversized] };
    if (files.size === 0) return { ...report, reason: "no changed web file within the scanner's size limit" };
    let result;
    try {
      result = runScanner(folder, version);
    } catch (error) {
      return { ...report, status: 'unavailable', reason: `legacy-scan failed: ${reason(error)}` };
    }
    return { ...report, status: 'ok', findings: mapFindings(result, files), coverage: COVERAGE, scannerNote: result.note };
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

function main() {
  let refs;
  try {
    ({ values: refs } = parseArgs({
      options: { checkout: { type: 'string' }, base: { type: 'string' }, head: { type: 'string' } },
      strict: true,
    }));
    if (!refs.checkout || !refs.base || !refs.head) throw new Error('missing argument');
  } catch (error) {
    process.stderr.write(`${error.message}\n${USAGE}\n`);
    process.exit(2);
  }
  let report;
  try {
    report = scanPullRequest(refs);
  } catch (error) {
    report = { status: 'unavailable', reason: reason(error), base: refs.base, head: refs.head };
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();

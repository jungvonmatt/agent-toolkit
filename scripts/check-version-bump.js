#!/usr/bin/env node
// Fails when a change to what the plugin ships keeps the version of the base.
// Claude Code keys its plugin cache by version: with the same version an
// installed copy never refreshes, so users keep running the old skills.
// Usage: node scripts/check-version-bump.js [<base ref>] (default origin/main)
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = process.argv[2] || process.env.VERSION_BASE || 'origin/main';
const SHIPPED = [/^skills\//, /^commands\//, /^agents\//, /^hooks\//, /^\.claude-plugin\/plugin\.json$/];
const MANIFEST = '.claude-plugin/plugin.json';

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

const mergeBase = git('merge-base', base, 'HEAD').trim();
const changed = git('diff', '--name-only', mergeBase, 'HEAD')
  .split('\n')
  .filter((file) => SHIPPED.some((pattern) => pattern.test(file)) && file !== MANIFEST);

if (changed.length === 0) {
  console.log('version check: no shipped file changed');
  process.exit(0);
}

const versionAt = (ref) => JSON.parse(git('show', `${ref}:${MANIFEST}`)).version;
const before = versionAt(mergeBase);
const after = versionAt('HEAD');

if (before === after) {
  console.error(
    `version check: ${changed.length} shipped file(s) changed, but ${MANIFEST} is still ${after}. ` +
      'Bump the version in every manifest (npm test checks that they match), or installed plugins keep the old skills.\n' +
      changed.map((file) => `  ${file}`).join('\n'),
  );
  process.exit(1);
}
console.log(`version check: ${before} -> ${after}`);

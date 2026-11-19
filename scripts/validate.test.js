const test = require('node:test');
const assert = require('node:assert/strict');
const { guidanceCopyProblems, guidancePinProblems } = require('./validate.js');

// Runs the pin check over one document per text and returns "file:line message" strings.
const pinProblems = (...texts) =>
  guidancePinProblems(texts.map((text, i) => ({ file: `doc${i + 1}.md`, text }))).map(
    (problem) => `${problem.file}:${problem.line} ${problem.message}`,
  );

test('accepts one exact version, also before a sentence mark', () => {
  assert.deepEqual(pinProblems('`npx -y modern-web-guidance@1.0.1 search "x"`', 'Raise modern-web-guidance@1.0.1.'), []);
});

test('accepts the plugin marketplace name and the skills installer', () => {
  assert.deepEqual(
    pinProblems('/plugin install modern-web-guidance@googlechrome', 'npx skills add GoogleChrome/modern-web-guidance'),
    [],
  );
});

test('flags a dist-tag or a range instead of an exact version', () => {
  const problems = pinProblems('npx modern-web-guidance@latest\nnpx modern-web-guidance@beta\nnpx modern-web-guidance@^1.0.1');
  assert.deepEqual(problems, [
    'doc1.md:1 pin modern-web-guidance to an exact version, not "@latest"',
    'doc1.md:2 pin modern-web-guidance to an exact version, not "@beta"',
    'doc1.md:3 pin modern-web-guidance to an exact version, not "@^1.0.1"',
  ]);
});

test('flags each runner call without a version', () => {
  const calls = [
    'npx -y modern-web-guidance search "x"',
    'pnpm dlx modern-web-guidance search "x"',
    'yarn dlx modern-web-guidance search "x"',
    'npm exec -- modern-web-guidance search "x"',
    'npx --package=modern-web-guidance modern-web search "x"',
  ];
  assert.equal(pinProblems(calls.join('\n')).length, calls.length);
});

test('flags a version that differs from the first pin, and names the first pin', () => {
  assert.deepEqual(pinProblems('npx modern-web-guidance@1.0.1', '\nnpx modern-web-guidance@1.0.0'), [
    'doc2.md:2 modern-web-guidance@1.0.0 does not match @1.0.1 in doc1.md:1',
  ]);
});

test('blames only the copy that drifted from the others', () => {
  const copies = ['a', 'b', 'c'].map((name) => ({ file: `${name}.md`, text: 'shared' }));
  copies.push({ file: 'd.md', text: 'edited' });
  assert.deepEqual(guidanceCopyProblems(copies), [{ file: 'd.md', message: 'differs from a.md; keep every copy identical' }]);
});

test('accepts identical copies and no copies at all', () => {
  assert.deepEqual(guidanceCopyProblems([{ file: 'a.md', text: 'x' }, { file: 'b.md', text: 'x' }]), []);
  assert.deepEqual(guidanceCopyProblems([]), []);
});

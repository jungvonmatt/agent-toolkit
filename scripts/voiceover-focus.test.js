const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const script = path.resolve(__dirname, '../skills/voiceover-check/scripts/vo.sh');

function fixture(context, options = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'voiceover-focus-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const state = path.join(directory, 'front');
  const opened = path.join(directory, 'opened');
  const cursor = path.join(directory, 'cursor');
  const moves = path.join(directory, 'moves');
  writeFileSync(state, options.front ?? 'Terminal');
  writeFileSync(cursor, '5');
  const commands = {
    osascript: `#!/bin/bash
case "$*" in
  *frontmostApplication*)
    printf '%s\\t%s\\n' "$(cat "$TEST_FRONT_PID" 2>/dev/null)" "$(cat "$TEST_FRONT")"
    exit 0 ;;
  *URLForApplicationWithBundleIdentifier*)
    echo /nonexistent/VoiceOver.app
    exit 0 ;;
  *activateWithOptions*)
    echo "$*" | sed -E 's/.*Identifier\\(([0-9]+)\\).*/\\1/' > "$TEST_FRONT_PID"
    printf 'Google Chrome' > "$TEST_FRONT"
    exit 0 ;;
esac
position=$(cat "$TEST_CURSOR")
case "$2" in
  *"move right"*) position=$((position + 1)); echo right >> "$TEST_MOVES" ;;
  *"move left"*) position=$((position - 1)); echo left >> "$TEST_MOVES" ;;
  *'perform command "find next heading"'*) position=$((position + 10)); echo 'find next heading' >> "$TEST_MOVES" ;;
  *'perform command "jump to top level"'*) position=0; echo 'jump to top level' >> "$TEST_MOVES" ;;
  *"into item"*) echo into >> "$TEST_MOVES" ;;
  *"perform command"*) echo other-command >> "$TEST_MOVES" ;;
  *"last phrase"*)
    if [ "$TEST_WEB" = 1 ] && [ "$position" = 0 ]; then
      echo 'Example Page - selected tab, group'
    elif [ "$TEST_WEB" = 1 ] && [ "$position" = 3 ]; then
      echo "Example Page $TEST_WEB_ROLE"
    else
      echo "item $position"
    fi
    exit 0 ;;
  *bounds*) echo "0, 0, $position, 1"; exit 0 ;;
esac
printf '%s' "$position" > "$TEST_CURSOR"
`,
    open: `#!/bin/bash
printf '%s\\n' "$@" > "$TEST_OPENED"
[ "$TEST_OPEN_FAIL" = 0 ] || exit 1
[ "$TEST_OPEN_IGNORED" = 0 ] || exit 0
if [ "$1" = -na ]; then
  /bin/bash -c 'sleep 30; :' fake-browser "$@" >/dev/null 2>&1 &
  [ "$TEST_LAUNCH_BEHIND" = 1 ] && exit 0
  printf '%s' "$!" > "$TEST_FRONT_PID"
fi
printf '%s' "$2" > "$TEST_FRONT"
`,
    pgrep: '#!/bin/bash\nexit 0\n',
    plutil: `#!/bin/bash
cat <<'XML'
<plist><dict>
<key>escape</key><string>SCRWorkspace.escapeKey</string>
<key>find next heading</key><string>Global.findNextHeading</string>
<key>find next landmark</key><string>SCRWebArea.nextLandmark</string>
<key>jump to top level</key><string>SCRWorkspace.escapeToTopLevel</string>
</dict></plist>
XML
`,
  };
  for (const [name, content] of Object.entries(commands)) {
    writeFileSync(path.join(directory, name), content, { mode: 0o755 });
  }
  return {
    run: (...args) => spawnSync('/bin/bash', [script, ...args], {
      encoding: 'utf8',
      timeout: 15000,
      env: {
        ...process.env,
        PATH: `${directory}:/usr/bin:/bin`,
        TEST_FRONT: state,
        TEST_OPENED: opened,
        TEST_CURSOR: cursor,
        TEST_MOVES: moves,
        TEST_WEB: options.web ? '1' : '0',
        TEST_WEB_ROLE: options.webRole ?? 'Webinhalt',
        TEST_OPEN_FAIL: options.fail ? '1' : '0',
        TEST_OPEN_IGNORED: options.ignored ? '1' : '0',
        TEST_LAUNCH_BEHIND: options.behind ? '1' : '0',
        TEST_FRONT_PID: path.join(directory, 'front-pid'),
        TMPDIR: directory,
      },
    }),
    front: () => readFileSync(state, 'utf8'),
    opened: () => existsSync(opened) ? readFileSync(opened, 'utf8') : null,
    moves: () => existsSync(moves) ? readFileSync(moves, 'utf8').trim().split('\n') : [],
    bindInstance: (expected, actual) => {
      writeFileSync(path.join(directory, 'voiceover-check.browser-pid'), String(expected));
      writeFileSync(path.join(directory, 'front-pid'), String(actual));
    },
  };
}

test('front prints the full name of the app in front, including spaces', (context) => {
  const browser = fixture(context, { front: 'Google Chrome Canary' });
  const result = browser.run('front');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'Google Chrome Canary\n');
});

test('commands lists the VoiceOver command names of this Mac, filtered', (context) => {
  const browser = fixture(context);
  const result = browser.run('commands', 'NEXT');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'find next heading\nfind next landmark\n');
});

test('web skips a matching tab title and enters the named web area', (context) => {
  const browser = fixture(context, { front: 'Safari', web: true });
  const result = browser.run('web', 'Safari', 'Example Page');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(browser.moves(), ['jump to top level', 'right', 'right', 'right', 'into']);
});

test('web refuses a title match without a web-content role', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('web', 'Safari', 'item 0', '1');
  assert.equal(result.status, 5, result.stderr);
  assert.ok(!browser.moves().includes('into'));
});

test('web accepts the English web-content role', (context) => {
  const browser = fixture(context, { front: 'Safari', web: true, webRole: 'web content' });
  const result = browser.run('web', 'Safari', 'Example Page', '3');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(browser.moves().at(-1), 'into');
});

test('web refuses a tab whose title contains the web-content role words', (context) => {
  const browser = fixture(context, {
    front: 'Safari', web: true, webRole: 'Webinhalt - selected tab, group',
  });
  const result = browser.run('web', 'Safari', 'Example Page', '3');
  assert.equal(result.status, 5, result.stderr);
  assert.ok(!browser.moves().includes('into'));
});

test('commands stop when another instance of the same browser is in front', (context) => {
  const browser = fixture(context, { front: 'Google Chrome' });
  browser.bindInstance(123, 999);
  const result = browser.run('poll', 'Google Chrome', '0');
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /process/);
});

test('commands accept the bound browser instance', (context) => {
  const browser = fixture(context, { front: 'Google Chrome' });
  browser.bindInstance(123, 123);
  const result = browser.run('poll', 'Google Chrome', '0');
  assert.equal(result.status, 0, result.stderr);
});

test('do refuses to navigate another instance with the same app name', (context) => {
  const browser = fixture(context, { front: 'Google Chrome' });
  browser.bindInstance(123, 999);
  const result = browser.run('do', 'Google Chrome', 'find next heading');
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(browser.moves(), []);
});

test('wait refuses another instance with the same app name without activation', (context) => {
  const browser = fixture(context, { front: 'Google Chrome' });
  browser.bindInstance(123, 999);
  const result = browser.run('wait', 'Google Chrome', '0');
  assert.equal(result.status, 2, result.stderr);
  assert.equal(browser.opened(), null);
});

test('focus reactivates the bound process instead of opening the app by name', (context) => {
  const browser = fixture(context, { front: 'Google Chrome' });
  browser.bindInstance(123, 999);
  const result = browser.run('focus', 'Google Chrome', '0');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(browser.opened(), null);
  assert.equal(browser.run('poll', 'Google Chrome', '0').status, 0);
});

test('web stops when no item starts with the page title', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('web', 'Safari', 'Missing page', '3');
  assert.equal(result.status, 5);
  assert.ok(!browser.moves().includes('into'));
});

test('do runs a VoiceOver command and prints what VoiceOver says next', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('do', 'Safari', 'Find Next Heading');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(browser.moves(), ['find next heading']);
  assert.equal(result.stdout, '001  item 15\n');
});

test('do marks a command that changes nothing', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('do', 'Safari', 'escape');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '001  (no move) item 5\n');
});

test('do refuses a name that is not a VoiceOver command on this Mac', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('do', 'Safari', 'find next heading" & do shell script "id');
  assert.equal(result.status, 7);
  assert.deepEqual(browser.moves(), []);
});

test('back moves the VoiceOver cursor backward and prints each item', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('back', 'Safari', '2', '0.3');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(browser.moves(), ['left', 'left']);
  assert.equal(result.stdout, '001  item 4\n002  item 3\n');
});

test('seekback stops on the first earlier item that contains the text', (context) => {
  const browser = fixture(context, { front: 'Safari' });
  const result = browser.run('seekback', 'Safari', 'item 3', '5');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(browser.moves(), ['left', 'left']);
});

test('launch starts a separate browser instance with a fresh profile, and close ends only that one', (context) => {
  const browser = fixture(context);
  const launched = browser.run('launch', 'Google Chrome', 'https://example.test/', '0');
  assert.equal(launched.status, 0, launched.stderr);
  const args = browser.opened().trim().split('\n');
  assert.deepEqual(args.slice(0, 3), ['-na', 'Google Chrome', '--args']);
  const profile = args.find((arg) => arg.startsWith('--user-data-dir='))?.slice('--user-data-dir='.length);
  assert.ok(profile && existsSync(profile), 'the fresh profile directory exists');
  assert.ok(args.includes('--no-first-run'));
  assert.equal(args.at(-1), 'https://example.test/');
  assert.equal(browser.front(), 'Google Chrome');

  const running = () => spawnSync('pgrep', ['-f', '--', `--user-data-dir=${profile}`]).status === 0;
  assert.ok(running(), 'the launched instance runs');
  const closed = browser.run('close');
  assert.equal(closed.status, 0, closed.stderr);
  assert.ok(!running(), 'the launched instance ends');
  assert.ok(!existsSync(profile), 'the fresh profile is removed');
});

test('launch brings its own instance forward when macOS starts it behind another app', (context) => {
  const browser = fixture(context, { behind: true });
  context.after(() => browser.run('close'));
  const result = browser.run('launch', 'Google Chrome', 'https://example.test/', '3');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(browser.front(), 'Google Chrome');
  assert.match(result.stdout, /\(process \d+\) is in front/);
});

test('launch refuses Safari, which has no separate instance', (context) => {
  const browser = fixture(context);
  const result = browser.run('launch', 'Safari', 'https://example.test/', '0');
  assert.equal(result.status, 1);
  assert.equal(browser.opened(), null);
});

test('close without a launched browser does nothing', (context) => {
  const browser = fixture(context);
  const result = browser.run('close');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No browser was launched/);
});

test('focus brings the requested browser forward, including names with spaces', (context) => {
  const browser = fixture(context);
  const result = browser.run('focus', 'Google Chrome', '0');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(browser.front(), 'Google Chrome');
  assert.equal(browser.opened(), '-a\nGoogle Chrome\n');
  assert.match(result.stdout, /"Google Chrome" is in front/);
});

test('focus fails when activation succeeds but the browser stays behind', (context) => {
  const browser = fixture(context, { ignored: true });
  const result = browser.run('focus', 'Safari', '0');
  assert.equal(result.status, 2, result.stderr);
  assert.equal(browser.front(), 'Terminal');
  assert.match(result.stderr, /Terminal/);
});

test('focus reports an activation failure', (context) => {
  const browser = fixture(context, { fail: true });
  const result = browser.run('focus', 'Safari', '0');
  assert.equal(result.status, 2, result.stderr);
  assert.equal(browser.front(), 'Terminal');
  assert.match(result.stderr, /could not bring "Safari" to the front/);
});

test('wait only observes focus and does not activate a browser', (context) => {
  const browser = fixture(context);
  const result = browser.run('wait', 'Safari', '0');
  assert.equal(result.status, 2, result.stderr);
  assert.equal(browser.opened(), null);
});

test('an app switch during a check stops it without reclaiming focus', (context) => {
  const browser = fixture(context);
  const result = browser.run('poll', 'Safari', '0');
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /stopped: "Terminal" is in front/);
  assert.equal(browser.opened(), null);
});
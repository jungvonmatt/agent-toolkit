#!/usr/bin/env node
// Structural checks for skills, commands, docs, and plugin manifests. No dependencies.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const errors = [];

const read = (file) => fs.readFileSync(file, 'utf8');
const rel = (file) => path.relative(root, file) || '.';
const fail = (file, message, line) => {
  errors.push(`${rel(file)}${line ? `:${line}` : ''}: ${message}`);
};
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, ext);
    return entry.name.endsWith(ext) ? [full] : [];
  });
}

// Blank out fenced code blocks but keep line numbers stable.
function stripFences(text) {
  return text.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, (block) => block.replace(/[^\n]/g, ''));
}

function parseScalar(raw) {
  if (raw.startsWith('"')) {
    if (!raw.endsWith('"') || raw.length < 2) throw new Error('unterminated double-quoted value');
    return JSON.parse(raw);
  }
  if (raw.startsWith("'")) {
    if (!raw.endsWith("'") || raw.length < 2) throw new Error('unterminated single-quoted value');
    return raw.slice(1, -1).replaceAll("''", "'");
  }
  if (/^[[\]{}&*!|>%@`,?]|^- /.test(raw)) throw new Error(`plain value cannot start with "${raw[0]}"; quote it`);
  if (/: | #|:$/.test(raw)) throw new Error('plain value contains ": " or " #"; quote it');
  return raw;
}

// Minimal parser for the flat `key: value` frontmatter used here; rejects what real YAML would reject.
function frontmatter(file, text = read(file)) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return fail(file, 'missing frontmatter block');

  const data = {};
  let key = null;
  let continuable = false;
  const lines = match[1].split(/\r?\n/);
  for (const [i, line] of lines.entries()) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z][\w-]*):(?:\s+(.*))?$/);
    if (kv) {
      key = kv[1];
      if (key in data) return fail(file, `duplicate frontmatter key "${key}"`, i + 2);
      const raw = (kv[2] ?? '').trim();
      const block = /^[>|][-+]?$/.test(raw);
      continuable = block || !/^["']/.test(raw);
      try {
        data[key] = block ? '' : parseScalar(raw);
      } catch (error) {
        return fail(file, `frontmatter "${key}": ${error.message}`, i + 2);
      }
    } else if (continuable && /^\s+\S/.test(line)) {
      data[key] = `${data[key]} ${line.trim()}`.trim();
    } else {
      return fail(file, 'unparseable frontmatter line', i + 2);
    }
  }
  return data;
}

function checkLinks(file) {
  const text = stripFences(read(file));
  for (const match of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(<|#|[a-z][a-z0-9+.-]*:)/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURI(target.replace(/[#?].*$/, '')));
    if (!fs.existsSync(resolved)) fail(file, `broken link "${target}"`, lineAt(text, match.index));
  }
}

// Inline-code paths like `references/foo.md` are relative to the skill root.
function checkSkillPaths(file, skillDir) {
  const text = stripFences(read(file));
  for (const match of text.matchAll(/`((?:references|assets|examples|fonts|scripts)\/[^`\s*?{}$<>]+)`/g)) {
    if (!fs.existsSync(path.join(skillDir, match[1]))) fail(file, `missing file "${match[1]}"`, lineAt(text, match.index));
  }
}

function checkMarkdown(file) {
  const text = read(file);
  const prose = stripFences(text).replace(/`[^`\n]*`/g, (span) => ' '.repeat(span.length));
  for (const match of prose.matchAll(/\\u[0-9a-fA-F]{4}/g)) {
    fail(file, `literal escape "${match[0]}" in prose`, lineAt(prose, match.index));
  }

  // A closing fence uses the same character, is at least as long, and has no info string.
  let open = null;
  for (const [i, line] of text.split('\n').entries()) {
    const fence = line.match(/^[ \t]*(`{3,}|~{3,})(.*)$/);
    if (!fence) continue;
    if (!open) open = { marker: fence[1], line: i + 1 };
    else if (fence[1][0] === open.marker[0] && fence[1].length >= open.marker.length && !fence[2].trim()) open = null;
  }
  if (open) fail(file, `code fence "${open.marker}" is never closed`, open.line);
}

// Headings like `### 4b. Title` or `## Step 1 — Title` define the step numbers a skill can reference.
function stepHeadings(skillFile) {
  const text = stripFences(read(skillFile));
  return new Set([...text.matchAll(/^#{2,4} (?:Step )?(\d+[a-z]?)[.\s]/gm)].map((match) => match[1]));
}

function checkStepRefs(file, steps) {
  const text = read(file);
  for (const match of text.matchAll(/\bSteps? (\d+[a-z]?)\b/g)) {
    if (!steps.has(match[1])) fail(file, `"${match[0]}" does not match any step heading in SKILL.md`, lineAt(text, match.index));
  }
}

function loadJson(relPath) {
  const file = path.join(root, relPath);
  if (!fs.existsSync(file)) return fail(file, 'missing manifest');
  try {
    return JSON.parse(read(file));
  } catch (error) {
    return fail(file, `invalid JSON: ${error.message}`);
  }
}

function checkManifests() {
  const main = loadJson('plugin.json');
  if (!main) return null;

  const versions = [['package.json', loadJson('package.json')?.version]];
  const plugins = [['plugin.json', main]];
  for (const relPath of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    const manifest = loadJson(relPath);
    if (!manifest) continue;
    if (manifest.name !== main.name) fail(path.join(root, relPath), `name "${manifest.name}" does not match plugin.json "${main.name}"`);
    plugins.push([relPath, manifest]);
  }
  for (const relPath of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
    const entry = loadJson(relPath)?.plugins?.find((plugin) => plugin.name === main.name);
    if (entry) versions.push([relPath, entry.version]);
    else fail(path.join(root, relPath), `no plugin entry named "${main.name}"`);
  }

  for (const [relPath, manifest] of plugins) {
    versions.push([relPath, manifest.version]);
    for (const declared of [].concat(manifest.skills ?? [], manifest.commands ?? [])) {
      if (!fs.existsSync(path.join(root, declared))) fail(path.join(root, relPath), `declared path "${declared}" does not exist`);
    }
  }
  for (const [relPath, version] of versions) {
    if (version !== main.version) fail(path.join(root, relPath), `version ${version} does not match plugin.json ${main.version}`);
  }
  return main.name;
}

function checkSkills() {
  const skillsDir = path.join(root, 'skills');
  const names = [];
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');
    names.push(entry.name);

    if (!fs.existsSync(skillFile)) {
      fail(skillDir, 'missing SKILL.md');
      continue;
    }
    if (!fs.existsSync(path.join(skillDir, 'README.md'))) fail(skillDir, 'missing README.md');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.name) || entry.name.length > 64) {
      fail(skillDir, 'directory name must be lowercase-hyphenated and at most 64 characters');
    }

    const data = frontmatter(skillFile);
    if (data) {
      if (data.name !== entry.name) fail(skillFile, `name "${data.name}" must match directory "${entry.name}"`);
      if (!data.description) fail(skillFile, 'description is required');
      else if (data.description.length > 1024) fail(skillFile, `description is ${data.description.length} characters (max 1024)`);
      else if (!/^Use when\b/.test(data.description)) fail(skillFile, 'description must start with "Use when" and state triggers, not the workflow');
    }

    const steps = stepHeadings(skillFile);
    for (const file of walk(skillDir, '.md')) {
      checkLinks(file);
      checkSkillPaths(file, skillDir);
      checkMarkdown(file);
      checkStepRefs(file, steps);
    }
  }
  return names;
}

function checkSkillRefs(file, pluginName, skills) {
  const text = read(file);
  for (const match of text.matchAll(new RegExp(`\\b${pluginName}:([a-z0-9-]+)`, 'g'))) {
    if (!skills.includes(match[1])) fail(file, `unknown skill "${match[0]}"`, lineAt(text, match.index));
  }
}

function checkCommands(pluginName, skills) {
  for (const file of walk(path.join(root, '.claude', 'commands'), '.md')) {
    const data = frontmatter(file);
    if (data && !data.description) fail(file, 'description is required');
    checkLinks(file);
    checkMarkdown(file);
    if (pluginName) checkSkillRefs(file, pluginName, skills);
  }
}

function checkReadme(pluginName, skills) {
  const file = path.join(root, 'README.md');
  checkLinks(file);
  checkMarkdown(file);
  checkLinks(path.join(root, 'CONTRIBUTING.md'));
  checkMarkdown(path.join(root, 'CONTRIBUTING.md'));
  if (pluginName) checkSkillRefs(file, pluginName, skills);

  const text = read(file);
  const commandSection = text.split(/^### Commands\b.*$/m)[1]?.split(/^#{1,3} /m)[0];
  if (!commandSection) fail(file, 'missing "### Commands" section');
  else {
    const listed = [...commandSection.matchAll(/^\|\s*`\/[\w-]+:([a-z0-9-]+)`\s*\|/gm)].map((match) => match[1]);
    const commands = walk(path.join(root, '.claude', 'commands'), '.md').map((command) => path.basename(command, '.md'));
    for (const command of commands) if (!listed.includes(command)) fail(file, `command "${command}" is missing from the Commands table`);
    for (const command of listed) if (!commands.includes(command)) fail(file, `Commands table lists "${command}" but .claude/commands/${command}.md does not exist`);
  }

  const section = text.split(/^## Skills[ \t]*$/m)[1]?.split(/^#{1,3} /m)[0];
  if (!section) return fail(file, 'missing "## Skills" section');
  const listed = [...section.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((match) => match[1]);
  for (const skill of skills) if (!listed.includes(skill)) fail(file, `skill "${skill}" is missing from the Skills table`);
  for (const skill of listed) if (!skills.includes(skill)) fail(file, `Skills table lists unknown skill "${skill}"`);
}

function main() {
  const pluginName = checkManifests();
  const skills = checkSkills();
  checkCommands(pluginName, skills);
  checkReadme(pluginName, skills);

  if (errors.length) {
    console.error(`✖ ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n${errors.map((error) => `  ${error}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✔ ${skills.length} skills, commands, docs, and manifests are valid`);
}

if (require.main === module) main();

module.exports = { frontmatter };

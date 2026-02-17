import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const skillsDir = path.resolve('skills');

const parseFrontmatter = (content: string) => {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('---', 3);
  if (end === -1) return null;
  return content.slice(3, end).trim();
};

test('skills have basic frontmatter', async () => {
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  assert.ok(skillDirs.length > 0);

  for (const dir of skillDirs) {
    const filePath = path.join(skillsDir, dir, 'SKILL.md');
    const raw = await fs.readFile(filePath, 'utf8');
    const frontmatter = parseFrontmatter(raw);
    assert.ok(frontmatter, `Missing frontmatter in ${dir}`);
    assert.ok(/name:\s*\S+/.test(frontmatter ?? ''), `Missing name in ${dir}`);
    assert.ok(/description:\s*\S+/.test(frontmatter ?? ''), `Missing description in ${dir}`);
    assert.ok(/version:\s*\S+/.test(frontmatter ?? ''), `Missing version in ${dir}`);
    assert.ok(/minRuntime:\s*\S+/.test(frontmatter ?? ''), `Missing minRuntime in ${dir}`);
  }
});

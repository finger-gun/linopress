import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

type SkillFrontmatter = {
  name?: string;
  description?: string;
  version?: string;
  minRuntime?: string;
  maxRuntime?: string;
};

const parseFrontmatter = (content: string): SkillFrontmatter => {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('---', 3);
  if (end === -1) return {};
  const raw = content.slice(3, end).trim();
  const record: SkillFrontmatter = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim();
    if (key === 'name') record.name = value;
    if (key === 'description') record.description = value;
    if (key === 'version') record.version = value;
    if (key === 'minRuntime') record.minRuntime = value;
    if (key === 'maxRuntime') record.maxRuntime = value;
  }
  return record;
};

const parseVersion = (input?: string) => {
  if (!input) return null;
  const match = input.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return match.slice(1, 4).map((part) => Number(part));
};

const compareVersion = (left?: string, right?: string) => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
};

export const validateSkillsCompatibility = (skillsDir: string, runtimeVersion: string) => {
  const warnings: string[] = [];
  const entries = readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    let content = '';
    try {
      content = readFileSync(skillPath, 'utf8');
    } catch {
      warnings.push(`Skill ${entry.name} missing SKILL.md`);
      continue;
    }
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter.version) {
      warnings.push(`Skill ${frontmatter.name ?? entry.name} missing version`);
    }
    if (frontmatter.minRuntime && compareVersion(runtimeVersion, frontmatter.minRuntime) < 0) {
      throw new Error(
        `Skill ${frontmatter.name ?? entry.name} requires runtime >= ${frontmatter.minRuntime}`,
      );
    }
    if (frontmatter.maxRuntime && compareVersion(runtimeVersion, frontmatter.maxRuntime) > 0) {
      throw new Error(
        `Skill ${frontmatter.name ?? entry.name} requires runtime <= ${frontmatter.maxRuntime}`,
      );
    }
  }
  return warnings;
};

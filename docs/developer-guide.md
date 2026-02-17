# Developer Guide

## Overview

Linopress is a TypeScript codebase with Docker-based WordPress sandboxes and a Sisu-powered agent runtime. This guide covers the local dev workflow and core directories.

See `AGENT.md` for agent-specific context and guardrails.

## Requirements

- Node.js 20+
- pnpm 9+
- Docker Desktop
- agent-browser CLI (for browser tool support)

## Install and Build

```bash
pnpm install
pnpm build
```

### Browser Tool Dependency

The browser tool uses the `agent-browser` (https://github.com/vercel-labs/agent-browser) CLI for headless automation. Install it once on your machine:

```bash
npm install -g agent-browser
agent-browser install
```

## CLI Usage

```bash
node dist/cli.js provision yoga-studio --port 8080
node dist/cli.js start yoga-studio
node dist/cli.js stop yoga-studio
node dist/cli.js destroy yoga-studio
```

## Stack Files

Each site stack is created under:

```
.linopress/stacks/<siteId>/
```

It contains:

- `docker-compose.yml` (per-site)
- `.env` (per-site)
- `nginx.conf`

## Key Directories

- `docker/`: stack templates
- `src/stack/`: provisioning + lifecycle
- `src/tools/`: tool wrappers
- `src/models/`: types + validation
- `skills/`: Claude-format skills (filesystem-based, app-owned)

## Agent Tools

Use the Sisu terminal tool for command execution and read/list operations. Use the file tool only for controlled writes/deletes within `/var/www/html/wp-content` and `/tmp/linopress`.

The browser tool wraps `agent-browser` and expects the CLI to be available on the host. The export tool generates portable bundles under `./exports/<siteId>/` by default (or `EXPORT_DIR`).

## Skills (Claude Format)

Linopress skills are **Claude-style filesystem skills**, not TypeScript modules. Each skill lives in its own directory with a `SKILL.md` file containing YAML frontmatter and instructions, and optional resources/scripts.

Recommended location:

- `skills/<skill-name>/SKILL.md`

These are loaded by `@sisu-ai/mw-skills` via configured skill directories. Do not implement skills under `src/skills/`.

Example configuration:

```ts
import path from 'node:path';
import { skillsMiddleware } from '@sisu-ai/mw-skills';

const repoRoot = process.cwd();
app.use(skillsMiddleware({ directories: [path.join(repoRoot, 'skills')] }));
```

When registering tools for skills, alias the terminal tool to snake_case names for ecosystem compatibility:

```ts
registerTools(terminal.tools, {
  aliases: {
    terminalRun: 'bash',
    terminalReadFile: 'read_file',
    terminalCd: 'cd',
  },
});
```

## Troubleshooting

- Docker errors: ensure Docker Desktop is running
- Build errors: run `pnpm build` and check TypeScript output

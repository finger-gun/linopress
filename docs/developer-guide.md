# Developer Guide

## Overview

Linopress is a TypeScript codebase with Docker-based WordPress sandboxes and a Sisu-powered agent runtime. This guide covers the local dev workflow and core directories.

## Requirements

- Node.js 20+
- pnpm 9+
- Docker Desktop

## Install and Build

```bash
pnpm install
pnpm build
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

## Agent Tools

Use the Sisu terminal tool for command execution and read/list operations. Use the file tool only for controlled writes/deletes within `/var/www/html/wp-content` and `/tmp/linopress`.

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

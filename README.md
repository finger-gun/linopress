<div align="center">
<h1>
  <br>
  <img src="./assets/linopress-logotype.svg" alt="Linopress" width="500">
</h1>

<h4>
Linopress is an agentic automation layer for WordPress. Describe a site in natural language and it provisions a fresh stack, builds content with tools, validates it, and exports a portable bundle.
</h4>

<p>

[![Node](https://img.shields.io/badge/node-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-339933?logo=typescript&logoColor=white)
![TypeScript](https://img.shields.io/badge/SISU-2.x-339933?&logoColor=white)
![AI](https://img.shields.io/badge/AI-Enabled-6f42c1)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</p>

<p>

[CLI](docs/cli.md) · [Build Process](docs/build-process.md) · [Build Report](docs/build-report.md) · [SiteSpec](docs/site-spec.md) · [Developer Guide](docs/developer-guide.md)

</p>
</div>

## Why Linopress

- Tool-driven execution (wp-cli, filesystem, browser, export)
- Isolated runtime per site
- Built-in validation and optional self-healing
- Deterministic outputs via SiteSpec

## Quick Start

Requirements:

- Node.js 20+
- pnpm 9+
- Docker Desktop (running)

Install and build:

```bash
pnpm install
pnpm build
```

Build a site from a prompt:

```bash
node dist/cli.js build yoga-studio --prompt "Create a modern yoga studio website with pricing, schedule, testimonials, and contact form" --port 8080 --browser
```

Build a site from a spec:

```bash
node dist/cli.js build yoga-studio --spec ./site-spec.json --port 8080
```

## Documentation

- CLI usage and flags: [docs/cli.md](docs/cli.md)
- Build pipeline overview: [docs/build-process.md](docs/build-process.md)
- Build report schema: [docs/build-report.md](docs/build-report.md)
- SiteSpec format: [docs/site-spec.md](docs/site-spec.md)
- Architecture notes: [docs/architecture.md](docs/architecture.md)
- Developer guide: [docs/developer-guide.md](docs/developer-guide.md)
- Project manifest: [docs/manifest.md](docs/manifest.md)

## Status

Early foundation phase. Expect breaking changes while the core workflow stabilizes.

## Repository Layout

```text
.
├─ docs/
├─ skills/
├─ src/
├─ prompts/
├─ templates/
├─ docker/
├─ tools/
├─ tests/
├─ assets/
└─ openspec/
```

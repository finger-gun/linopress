# Linopress

Linopress is an **agentic automation layer for WordPress**: describe a site in natural language, and the system plans, builds, validates, repairs, and exports it through deterministic tooling.

It is designed for builders who want reproducible outcomes—not one-off manual clicks.

## What Linopress aims to do

Given a request like:

> “Create a modern yoga studio website with pricing, schedule, testimonials, and contact form.”

Linopress is being designed to:

- Provision an isolated WordPress runtime per site.
- Execute builds through structured skills and allowlisted tools.
- Install/configure WordPress, plugins, themes, pages, and menus.
- Validate the result via CLI and real browser smoke tests.
- Run short self-healing loops for recoverable failures.
- Export a portable bundle that can be deployed elsewhere.

## Core principles

- **Tool-driven execution** — state changes happen via explicit tools, not free-form mutation.
- **Isolation by default** — one site, one sandboxed runtime.
- **Verification first** — every build is validated before completion.
- **Minimal self-healing** — small, bounded repair cycles before hard failure.
- **Portability over lock-in** — exported artifacts are intended to run outside Linopress.

## Architecture (v0.1 direction)

```text
LLM Planner
  -> Skills (WordPress capabilities)
    -> Tools (wp-cli, filesystem, browser, export)
      -> Isolated runtime (WordPress + DB + agent-api)
```

Runtime model:

- Per-site stack: `wordpress`, `db`, `agent-api` (and optional browser container).
- Shared writable content boundary: `wp-content`.
- Compose-first deployment model, with Kubernetes considered later.

## Spec-driven development

Linopress is currently defined through **OpenSpec** change/spec documents.

- Project manifest: `docs/manifest.md`
- OpenSpec config/context: `openspec/config.yaml`
- Foundation change set: `openspec/changes/linopress-foundation/`

## Skills (Claude Format)

Linopress skills are **filesystem-based Claude skills** (directories containing a `SKILL.md` with YAML frontmatter and instructions). The app loads them via `@sisu-ai/mw-skills` from the repo-owned `skills/` directory.

Skills are not TypeScript modules under `src/`.

Current skills live under `skills/` (wp-install, plugin-installer, theme-generator, page-builder, site-validator, browser-smoke-test, self-healing).

Planned capability areas in the foundation scope include:

- Agent framework and runtime isolation
- WordPress install and wp-cli tooling
- Plugin installer and theme generator skills
- Page builder and site validator skills
- Browser smoke testing and self-healing
- Export tooling for portable bundles

## Current status

🚧 **Early foundation phase**

Core scaffolding exists for local development. Expect breaking changes while the foundation work lands.

Recent foundation progress includes first-pass implementations of the browser tool (agent-browser CLI integration) and export bundle tooling.

## Quick Start (Local Dev)

### Requirements

- Node.js 20+
- pnpm 9+
- Docker Desktop (running)

### Install and Build

```bash
pnpm install
pnpm build
```

### Provision a Site Stack

```bash
node dist/cli.js provision yoga-studio --port 8080
```

### Start/Stop/Destroy

```bash
node dist/cli.js start yoga-studio
node dist/cli.js stop yoga-studio
node dist/cli.js destroy yoga-studio
```

### Optional Browser Container

```bash
node dist/cli.js provision yoga-studio --port 8080 --browser
```

## Developer Guide

See `docs/developer-guide.md` for stack layout, workflows, and troubleshooting.

Agent context: `AGENT.md`.

## Repository layout

```text
.
├─ docs/
│  └─ manifest.md
└─ openspec/
   ├─ config.yaml
   └─ changes/
      └─ linopress-foundation/
         ├─ proposal.md
         ├─ design.md
         ├─ tasks.md
         └─ specs/
```

## Near-term roadmap

- Establish the initial Compose-based runtime and agent API skeleton.
- Implement first allowlisted tools (`wp-cli`, file, browser, export).
- Deliver first-pass skills for install/build/validate/export.
- Wire validation + self-healing loop with structured build reports.
- Add pragmatic quick start once the initial fundraising milestone lands.

---

If you want to collaborate early, start with the OpenSpec change documents and align proposals to the architecture principles above.

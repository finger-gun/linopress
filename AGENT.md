# Linopress Agent Notes

## Project Summary

Linopress is an agentic automation layer for WordPress: prompt -> build -> verify (CLI + browser) -> self-heal -> export.

The system is deterministic. All state changes must go through allowlisted tools and skills.

## Core Principles

- Tool-driven execution only. No free-form mutations.
- Isolation by default: one site per sandboxed runtime.
- Verification first: CLI validation + browser smoke test per build.
- Self-healing is bounded (max 2 cycles) and always produces a BuildReport.
- Portability: export bundles include wp-content, database.sql, manifest.json.

## Runtime Model

- Per-site Docker Compose stack: wordpress + db + agent-api (+ optional browser container).
- Shared writable volume: /var/www/html/wp-content.
- Browser navigation is allowlisted to local WordPress URLs only.

## Tools

- wp-cli tool: allowlisted commands only.
- file tool: restricted to /var/www/html/wp-content and /tmp/linopress.
- browser tool: backed by agent-browser CLI.
- export tool: builds portable bundle into ./exports/<siteId> (or EXPORT_DIR).

## Skills (Claude Format)

Skills are filesystem directories with SKILL.md (YAML frontmatter + instructions). They are loaded by @sisu-ai/mw-skills.

Supported skill location:

- skills/<skill-name>/SKILL.md

Skills are not TypeScript modules under src/.

## OpenSpec

OpenSpec is the source of truth for work. See:

- openspec/config.yaml
- openspec/changes/linopress-foundation/

## Guardrails

- No external browsing or shell access beyond allowlists.
- No Docker socket exposure.
- Never surface secrets in model-visible output.

## Frontend Implementation Conventions

- Prefer component-first UI construction: when a UI section has distinct responsibility or expected reuse, implement it as a dedicated component instead of expanding page-level JSX.
- Co-locate component-specific styles with their component (e.g., `Component.tsx` + `Component.module.css`) and avoid centralizing unrelated component styles in a single page stylesheet.
- Keep page-level styles focused on route layout and shared structural primitives; move visual/interactive details into the owning component stylesheet.

# Linopress — Vision & Architecture Manifesto (v0.1)

---

## 1. Vision

**Linopress is the automation layer for WordPress.**

Gutenberg made WordPress block-based.
Linotype industrialized printing.

Linopress industrializes WordPress creation.

A user describes a website in natural language.
Linopress provisions an isolated WordPress runtime, builds the site deterministically using structured tools and skills, verifies it through a real browser, self-heals if needed, and produces a fully portable export bundle.

Linopress treats WordPress as infrastructure — not UI.

---

## Docs Index

- CLI usage and flags: `docs/cli.md`
- Build pipeline overview: `docs/build-process.md`
- Build report schema: `docs/build-report.md`
- SiteSpec format: `docs/site-spec.md`
- Architecture notes: `docs/architecture.md`
- Developer guide: `docs/developer-guide.md`
- Style seeds: `docs/style-seeds.md`
- Deployment: `docs/deployment.md`
- Security: `docs/security.md`

## 2. Core Philosophy

### Deterministic > Improvised

The model never freely mutates the system.
All state changes happen through allowlisted tools and structured skills.

### Isolation by Default

One site = one sandboxed runtime.
Disposable, reproducible, portable.

### Verify Everything

Every build must pass CLI validation and browser smoke tests.

### Self-Healing

If validation fails, Linopress attempts minimal repair cycles before reporting failure.

### Opinionated, Not Restrictive

Provide strong defaults and style seeds — but allow:

- Parent themes
- Blank block themes
- User-selected themes

### Portable Output

No lock-in. Every site is exportable and deploy-anywhere.

---

## 3. Target Audience (v0.1)

Primary:

- Small businesses
- Freelancers
- Consultants
- Personal bloggers

Not targeting (yet):

- Enterprise-scale installations
- High-traffic infrastructure
- Multisite networks
- Large WooCommerce stores

---

## 4. Product Promise

Given a prompt:

> “Create a modern yoga studio website with pricing, schedule, testimonials, and contact form.”

Linopress will:

- Provision WordPress in an isolated runtime
- Install and configure curated plugins
- Generate and activate a theme
- Create pages and menus
- Apply brand styling
- Validate via wp-cli and browser
- Capture screenshots
- Export a deployable bundle

Without manual intervention.

---

## 5. Architecture Overview

### Runtime Model

One site = one isolated environment.

MVP implementation:

- Docker Compose stack

Future:

- Kubernetes pod per site

Per-site stack:

- wordpress (nginx + php-fpm)
- db (mariadb)
- agent-api (Sisu runtime + skills)
- optional: headless Chromium for agent-browser

Shared writable volume:

- /var/www/html/wp-content

Tooling baseline:

- Monorepo: Turborepo
- Package manager: pnpm

Each environment is disposable and reproducible.

---

## 6. Agent Architecture

Layered model:

LLM Planner
→ Skills (WordPress domain capabilities)
→ Tools (wp-cli, file ops, agent-browser)
→ Sandboxed WordPress runtime

The LLM plans.
Skills encapsulate domain logic.
Tools execute deterministically.

The model never directly edits arbitrary system state.

---

## 7. Tools (Low-Level Primitives)

Minimal allowlisted tool surface:

- wp-cli tool
- File tool (restricted to wp-content)
- agent-browser tool
- Export tool

Terminal rules:

- Command allowlist only
- Root-scoped filesystem access
- No external browsing by default
- No Docker socket exposure

---

## 8. Skills (Composable Capabilities)

Initial skill set:

- SiteSpecExtractor
- wpInstallOrEnsure
- PluginInstaller
- ThemeGenerator (parent / blank block / user theme)
- PageBuilder (block-based content)
- MenuConfigurator
- SecurityBaseline
- SiteValidator (CLI)
- BrowserSmokeTest
- ExportBundle

Future skills:

- WooCommerce
- Multilingual
- Performance optimization
- Migration/import
- Headless mode
- Membership systems

Skills are composable and extensible.

---

## 9. Theme Philosophy

Three modes:

1. Parent theme + child theme (default)
2. Blank block theme generation
3. User-selected theme

Linopress ships 2–3 style seeds:

- Design tokens
- Section patterns
- Layout archetypes

These inspire output but do not restrict it.

Block themes are preferred for from-scratch generation.

All themes must pass validation.

---

## 10. Validation & Self-Healing Loop

Every build executes:

1. CLI validation
2. Browser smoke test
3. Screenshot capture
4. Console error detection
5. Repair loop (max N cycles)
6. Re-validation

Even on failure, Linopress produces a structured BuildReport.

Validation is not optional.
It defines product identity.

---

## 11. Security Model

- Per-site sandbox isolation
- Restricted filesystem writes
- Allowlisted commands only
- No external browsing (unless explicitly enabled)
- Secrets stored outside model context
- Audit logging of tool calls

Security constraints are architectural, not advisory.

---

## 12. Output & Portability

Each site can be exported as:

- wp-content/
- database.sql
- manifest.json
- bundled archive

Linopress does not own the runtime.
The user does.

---

## 13. Differentiation

Linopress is not:

- A no-code builder
- A visual page editor
- A hosting platform
- A generic AI coding agent

Linopress is:

> The automation engine for WordPress.

It industrializes site creation the way Linotype industrialized printing.

---

## 14. First Milestone Definition

Success means:

A user prompts:

> “Create a modern yoga studio site.”

Linopress produces:

- A running preview
- Generated theme and pages
- Installed and configured plugins
- Passing CLI + browser validation
- Screenshots
- Export bundle

With zero manual intervention.

---

## 15. Long-Term Vision

Linopress evolves into:

- A programmable WordPress runtime
- A composable skill ecosystem
- A deploy-anywhere artifact generator
- A versionable site automation engine

Gutenberg made WordPress composable.

Linopress makes it autonomous.

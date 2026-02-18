## Context

The current `linopress build` flow creates a fresh WordPress site in an isolated stack, runs validation and self-healing, and exports a bundle. Users need an iterative update path to refine an existing build with natural-language change requests while preserving determinism, tool allowlists, and the sandbox model.

Component diagram (text):

CLI (`linopress update`) → Agent API (Sisu runtime) → Update Orchestrator → Skills/Tools (page-builder, theme-generator, wp-cli, file-tool) → Validation (site-validator + browser-tool) → Report + Export

## Goals / Non-Goals

**Goals:**

- Add a CLI update command that targets an existing site build and applies a user change prompt.
- Reuse the existing isolation model (one site per stack) and only allow tool-driven changes.
- Produce an updated report and (optional) export bundle after successful validation.

**Non-Goals:**

- Real-time collaborative editing or UI-based editing.
- Unrestricted external browsing or arbitrary shell access.
- Hosting, multisite management, or WooCommerce automation.

## Decisions

1. **CLI surface and orchestration**
   - Decision: introduce `linopress update` (name can be finalized later, with an alias if needed) that accepts a change prompt and a target site/build identifier.
   - Rationale: mirrors `linopress build` ergonomics and keeps the update flow deterministic and repeatable.
   - Alternatives considered: `linopress modify` (less consistent with other commands) and a `build --update` flag (blurs lifecycle stages).

2. **Update execution model**
   - Decision: implement an Update Orchestrator that mirrors build orchestration but starts from an existing site stack and runs a constrained set of skills/tools to apply changes.
   - Rationale: reuse proven pipeline steps (validation, self-healing, reporting) while limiting scope to incremental updates.
   - Alternatives considered: re-run full build from the original prompt (wastes time and discards user edits).

3. **Data models (implementation-ready for Node/TS + Sisu)**
   - SiteSpec (existing):
     ```ts
     type SiteSpec = {
       siteId: string;
       prompt: string;
       themeMode: 'parent' | 'blank' | 'user';
       pages?: Array<{ title: string; slug?: string; content?: string }>;
       plugins?: string[];
       metadata?: Record<string, string>;
     };
     ```
   - BuildReport (existing, reused for updates with an update mode flag):
     ```ts
     type BuildReport = {
       siteId: string;
       status: 'success' | 'failed' | 'partial';
       mode: 'build' | 'update';
       steps: Array<{ name: string; status: string; durationMs: number }>;
       validation: { cli: string; browser: string; warnings?: string[] };
       healingCycles?: Array<{ attempt: number; result: string; notes?: string }>;
       exportPath?: string;
       startedAt: string;
       finishedAt: string;
     };
     ```
   - UpdateRequest (new):
     ```ts
     type UpdateRequest = {
       siteId: string;
       prompt: string;
       baseSpecPath?: string;
       allowlistProfile?: 'default' | 'strict';
     };
     ```

4. **Tool and URL allowlists**
   - Tool allowlist (update flow): `page-builder-skill`, `theme-generator-skill`, `wp-cli-tool`, `file-tool`, `site-validator-skill`, `browser-tool`, `export-tool`.
   - URL allowlist: only the local WordPress base URL for the target site; no external navigation.

5. **Self-healing loop and fallback policies**
   - Decision: reuse the existing validation + self-healing loop (max 2 cycles) for updates.
   - Fallbacks: if update validation fails and theme changes are implicated, attempt a theme fallback from blank block theme to parent theme before the final failure report.

## Risks / Trade-offs

- Update drift reduces reproducibility → record update prompt and inputs in BuildReport and export manifest; keep update allowlists tight.
- Change scope ambiguity in natural-language prompts → constrain to allowed tools and run validation + browser smoke tests after each update.
- Theme fallback could mask deeper issues → include explicit report notes when fallback occurs so users can decide to retry or rebuild.

## Why

Linopress requires a complete foundational architecture to fulfill its vision as the automation layer for WordPress. Currently, there is no runtime infrastructure, agent framework, or tool ecosystem to enable deterministic, sandboxed WordPress site creation. This foundation is needed now to support the first milestone: a prompt-to-production yoga studio demo that validates the core promise of zero-intervention site generation with built-in verification and self-healing.

## What Changes

- **NEW**: Docker Compose runtime architecture with per-site isolation (wordpress + db + agent-api containers)
- **NEW**: Sisu-based agent framework with skill layer and allowlisted tool primitives
- **NEW**: WordPress automation tools (wp-cli wrapper, file operations, browser testing)
- **NEW**: Core skills for WordPress installation, plugin management, theme generation, and content creation
- **NEW**: Validation and self-healing system with CLI checks and browser smoke tests
- **NEW**: Export capability for portable site bundles (wp-content + DB + manifest)
- **NEW**: Security model with sandboxed execution, restricted filesystem access, and command allowlisting

## Capabilities

### New Capabilities

- `runtime-isolation`: Per-site Docker Compose stacks with isolated wordpress, database, and agent-api containers; shared wp-content volume; lifecycle management (provision, destroy, export)
- `agent-framework`: Sisu-based agent runtime with layered architecture (LLM planner → skills → tools → sandbox); skill registration and execution; state management and error handling
- `wp-cli-tool`: WordPress CLI automation primitive; command allowlisting; root-scoped filesystem access; execution within agent-api container context
- `file-tool`: Filesystem operations restricted to wp-content directory; read/write/modify capabilities; validation of file paths and permissions
- `browser-tool`: Agent-browser integration for headless Chrome automation; URL allowlisting (local WordPress only); screenshot capture; console error detection
- `export-tool`: Site bundle generation including wp-content archive, database dump, and manifest.json; validation of export completeness
- `wp-install-skill`: WordPress core installation and configuration; database setup; admin user creation; baseline security settings
- `plugin-installer-skill`: Plugin discovery and installation via wp-cli; activation and configuration; dependency resolution; curated plugin registry
- `theme-generator-skill`: Block theme generation with three modes (parent theme, blank block, user-selected); style seed integration; theme validation
- `page-builder-skill`: Block-based page and post creation; content template system; menu and navigation configuration
- `site-validator-skill`: CLI validation checks (database integrity, file permissions, WordPress health); validation reporting; failure detection
- `browser-smoke-test-skill`: Automated browser testing of critical pages; screenshot capture; console error checking; accessibility smoke tests
- `self-healing-skill`: Failure analysis and automated repair cycles (max 2 attempts); targeted fixes for common issues; structured build reports on success or failure
- `export-bundle-skill`: Orchestration of export process; bundle verification; manifest generation with site metadata

### Modified Capabilities

<!-- No existing capabilities are being modified -->

## Impact

**New Dependencies**:
- Docker & Docker Compose for runtime isolation
- Sisu framework (@sisu-ai/core, @sisu-ai/runtime) for agent execution
- vercel-labs/agent-browser for headless browser automation
- wp-cli for WordPress automation
- MariaDB for database layer
- Node.js + TypeScript for agent-api and skills

**New Infrastructure**:
- `docker/` directory with compose files and container configs
- `agent-api/` service directory with skill implementations
- `tools/` directory with allowlisted tool definitions
- `schemas/` directory for validation rules and templates

**Security Architecture**:
- Command allowlisting in terminal tool (no arbitrary shell execution)
- Filesystem restrictions (writes limited to wp-content + temp)
- Network isolation (no Docker socket exposure, URL allowlisting)
- Secret management (environment-based, never in model context)

**Success Criteria**:
End-to-end demo scenario must succeed:
1. User provides prompt: "Create a modern yoga studio website with pricing, schedule, testimonials, and contact form"
2. System provisions isolated WordPress stack via Docker Compose
3. Agent executes skills to install WordPress, plugins, generate theme, create pages
4. Validation passes: CLI checks + browser smoke tests on all pages
5. Screenshots captured automatically
6. Export bundle generated with wp-content + database + manifest
7. Zero manual intervention required throughout process

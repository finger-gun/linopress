## Context

Linopress is being built from scratch as an agentic WordPress automation system. The foundation must establish:
- **Runtime isolation**: Per-site sandboxed WordPress environments
- **Agent architecture**: LLM-driven automation with structured skills and tools
- **Deterministic execution**: No free-form system mutation; all state changes via allowlisted tools
- **Verification-first**: Built-in validation and self-healing as core product identity

Current state: Greenfield project with no existing infrastructure.

Constraints:
- MVP targets small businesses/personal blogs (not enterprise scale)
- Must produce portable, deploy-anywhere output (no vendor lock-in)
- Security and isolation are non-negotiable architectural requirements
- Node.js/TypeScript + Sisu framework for agent runtime

Stakeholders:
- End users: Non-technical users who provide natural language prompts
- System: Automated agent executing skills without human intervention

## Goals / Non-Goals

**Goals:**
- Establish isolated, reproducible WordPress runtime using Docker Compose
- Implement Sisu-based agent framework with skill/tool separation
- Create minimal, allowlisted tool surface for WordPress automation
- Build core skill set for end-to-end site creation (install → theme → content → validate → export)
- Implement validation + self-healing loop as architectural foundation
- Enable first milestone demo (yoga studio site from prompt)

**Non-Goals:**
- WooCommerce or e-commerce functionality (future)
- Multisite network management
- Hosting platform features (backup scheduling, CDN, monitoring)
- Visual page builder UI (Linopress is CLI/API-driven)
- Unrestricted shell access or external web browsing
- Kubernetes deployment (Docker Compose for MVP; K8s deferred)

## Decisions

### 1. Runtime Isolation: Docker Compose over Kubernetes

**Decision**: Use Docker Compose for per-site isolation in MVP; defer Kubernetes to v2.

**Rationale**:
- Docker Compose provides sufficient isolation for MVP use case (single-machine, small scale)
- Simpler local development and testing workflow
- Lower operational complexity for early adopters
- Per-site stack: `wordpress` (nginx + php-fpm), `db` (MariaDB), `agent-api` (Node.js + Sisu)
- Optional: `browser` container (headless Chrome) for smoke tests

**Alternatives considered**:
- **Kubernetes pods**: Better multi-tenant scalability, but over-engineered for MVP target users (small businesses, not SaaS)
- **Native WordPress installs**: No isolation, risk of cross-site contamination

**Architecture**:
```
docker-compose.yml (per site)
├── wordpress:
│   ├── Image: wordpress:php8.2-fpm + nginx
│   ├── Volumes: /var/www/html/wp-content (shared)
│   └── Ports: 8080 (HTTP)
├── db:
│   ├── Image: mariadb:11
│   ├── Volumes: /var/lib/mysql (persistent)
│   └── Env: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE
├── agent-api:
│   ├── Image: node:20-alpine
│   ├── Volumes: /var/www/html/wp-content (shared, read-write)
│   ├── Tools: wp-cli, file-tool, browser-tool, export-tool
│   └── Skills: wp-install, plugin-installer, theme-generator, etc.
└── browser (optional):
    ├── Image: browserless/chrome
    └── Ports: 3000 (Chrome DevTools Protocol)
```

**Trade-off**: Docker Compose limits scalability to single-host deployments. Mitigated by making runtime model pluggable (interface-based) for future K8s adapter.

---

### 2. Agent Architecture: Sisu Framework with Skill/Tool Layering

**Decision**: Use Sisu (@sisu-ai/*) for agent runtime with strict layering: LLM Planner → Skills → Tools → Sandbox.

**Rationale**:
- Sisu provides structured skill/tool abstraction vs. raw LLM API calls
- Enforces tool allowlisting and deterministic execution
- Built-in state management and error handling
- TypeScript-native for type safety

**Layering model**:
```
┌─────────────────────────────────────┐
│ LLM Planner (Claude/GPT via Sisu)   │  ← Plans high-level strategy
├─────────────────────────────────────┤
│ Skills (WordPress domain logic)     │  ← Composable capabilities
│  - wpInstallSkill                   │
│  - pluginInstallerSkill             │
│  - themeGeneratorSkill              │
│  - pageBuilderSkill                 │
│  - siteValidatorSkill               │
│  - selfHealingSkill                 │
├─────────────────────────────────────┤
│ Tools (Primitives)                  │  ← Allowlisted, atomic operations
│  - wp-cli (command allowlist)       │
│  - file (wp-content scoped)         │
│  - browser (URL allowlist)          │
│  - export (bundle generation)       │
├─────────────────────────────────────┤
│ Sandboxed WordPress Runtime         │  ← Docker containers
└─────────────────────────────────────┘
```

**Alternatives considered**:
- **Raw LangChain**: More flexible but requires custom tool validation and state management
- **Custom agent loop**: High development cost, reinventing solved problems

**Skills as composable units**:
- Each skill exports a Sisu skill definition with typed inputs/outputs
- Skills orchestrate tools but never directly mutate state
- Skills can call other skills (e.g., `selfHealingSkill` calls `siteValidatorSkill`)

---

### 3. Tool Allowlisting: Command-Based Security Model

**Decision**: All tools use strict allowlists; no arbitrary command execution.

**wp-cli tool allowlist** (executed via `docker exec` in wordpress container):
```typescript
const WP_CLI_ALLOWLIST = [
  'wp core install',
  'wp core version',
  'wp plugin install',
  'wp plugin activate',
  'wp plugin list',
  'wp theme install',
  'wp theme activate',
  'wp theme list',
  'wp post create',
  'wp post list',
  'wp menu create',
  'wp menu item add-*',
  'wp option get',
  'wp option update',
  'wp db export',
  'wp db check',
  'wp doctor check',  // WordPress health checks
];
```

**file-tool restrictions**:
- Allowed paths: `/var/www/html/wp-content/**`, `/tmp/linopress/**`
- Denied paths: `/wp-admin`, `/wp-includes`, `/wp-config.php`
- Operations: read, write, copy, delete (with path validation)

**browser-tool URL allowlist**:
```typescript
const BROWSER_URL_ALLOWLIST = [
  /^http:\/\/localhost:\d+\/.*/,      // Local WordPress
  /^http:\/\/wordpress:\d+\/.*/,      // Docker internal
];
// All other URLs rejected before navigation
```

**Rationale**:
- Prevents arbitrary shell injection attacks
- Limits blast radius of LLM errors or prompt injection
- Auditable tool usage via structured logs

---

### 4. Data Models: SiteSpec and BuildReport

**SiteSpec** (input to agent):
```typescript
interface SiteSpec {
  prompt: string;                    // Natural language description
  siteId: string;                    // Unique identifier (UUID)
  themeMode: 'parent' | 'blank' | 'user-selected';
  styleSeed?: string;                // Optional style inspiration
  plugins?: string[];                // Curated plugin names
  pages?: PageSpec[];                // Explicit page definitions
}

interface PageSpec {
  title: string;
  slug: string;
  content: string | ContentTemplate;
  template?: string;                 // Block template reference
}
```

**BuildReport** (output from agent):
```typescript
interface BuildReport {
  siteId: string;
  status: 'success' | 'failed' | 'partial';
  steps: BuildStep[];
  validation: ValidationResult;
  screenshots: string[];             // File paths
  exportBundle?: string;             // Path to .zip
  errors?: ErrorLog[];
  healingCycles?: HealingCycle[];    // Self-repair attempts
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    wpVersion: string;
    themeGenerated: string;
    pluginsInstalled: string[];
  };
}

interface ValidationResult {
  cli: {
    databaseOk: boolean;
    filesystemOk: boolean;
    healthCheckOk: boolean;
  };
  browser: {
    pagesLoaded: string[];
    consoleErrors: ConsoleError[];
    screenshotsCaptured: number;
  };
}
```

**Rationale**:
- SiteSpec provides deterministic input (same spec = same output)
- BuildReport enables auditability and debugging
- Structured validation results support self-healing decisions

---

### 5. Theme Generation: Parent Theme Default with Block Theme Fallback

**Decision**: Default to parent theme + child theme; fallback to blank block theme on failure.

**Parent theme strategy**:
- Ship 2-3 curated parent themes (e.g., "Minimalist Pro", "Studio Bold")
- Generate child theme with custom styles and patterns
- Benefits: Stable foundation, reduced PHP/template complexity
- Risk: Parent theme updates may break customizations → Mitigate with version pinning

**Blank block theme fallback**:
- If parent theme fails validation or user requests "from scratch"
- Generate minimal theme.json with style tokens
- Use core block patterns (no custom PHP templates)
- Benefits: Full control, future-proof (block-based is WordPress direction)

**Fallback sequence** (in `themeGeneratorSkill`):
1. Attempt child theme on selected parent
2. If validation fails → attempt blank block theme
3. If still fails → report failure (no silent degradation)

**Alternatives considered**:
- **Always blank block theme**: Higher complexity for simple sites, more prone to generation errors
- **User-uploaded theme only**: Limits automation, requires manual theme selection

**Style seeds**:
- Design tokens: colors, typography, spacing scales
- Section patterns: hero, testimonials, pricing tables
- No enforcement; LLM uses as inspiration

---

### 6. Self-Healing Loop: Max 2 Repair Cycles

**Decision**: Implement bounded self-healing with structured failure detection and targeted repairs.

**Healing flow**:
```
Build Attempt
    ↓
Validation (CLI + Browser)
    ↓
Pass? → Export → Success
    ↓ Fail
Analyze Errors
    ↓
Healing Cycle 1: Targeted Fix
    ↓
Re-Validate
    ↓
Pass? → Export → Success
    ↓ Fail
Healing Cycle 2: Aggressive Fix
    ↓
Re-Validate
    ↓
Pass? → Export → Success
    ↓ Fail
Report Failure (with full BuildReport)
```

**Healing strategies**:
- **Database errors**: Run `wp db repair`, regenerate admin user
- **File permission errors**: Reset wp-content permissions to 755/644
- **Plugin conflicts**: Deactivate all plugins, re-activate one by one
- **Theme errors**: Fallback to blank block theme
- **404 errors**: Regenerate missing pages, flush rewrite rules

**Rationale**:
- Bounded cycles prevent infinite loops and resource exhaustion
- Structured error analysis (via validation results) enables targeted fixes
- Failure reports still provide value (screenshots, partial export, error logs)

**Alternatives considered**:
- **Unlimited healing**: Risk of runaway costs and time
- **Zero healing**: Lower success rate, worse UX for edge cases

---

### 7. Export Format: wp-content + DB Dump + Manifest

**Decision**: Export bundle includes:
1. `wp-content/` directory (themes, plugins, uploads)
2. `database.sql` (mysqldump output)
3. `manifest.json` (metadata: site spec, build report, versions)

**Manifest structure**:
```json
{
  "version": "1.0",
  "siteId": "uuid",
  "created": "ISO8601 timestamp",
  "wordpressVersion": "6.4.2",
  "phpVersion": "8.2",
  "plugins": ["plugin-slug@version"],
  "theme": {
    "name": "child-theme-name",
    "parent": "parent-theme-slug",
    "mode": "parent"
  },
  "buildReport": { /* full BuildReport object */ }
}
```

**Bundle format**: `.tar.gz` archive with standard structure:
```
site-{siteId}.tar.gz
├── wp-content/
├── database.sql
└── manifest.json
```

**Portability**:
- User can extract and deploy to any WordPress host
- `database.sql` includes base URL (`http://localhost:8080`) → user must run search-replace on deployment
- No Linopress-specific dependencies in exported site

---

## Risks / Trade-offs

### Risk: Docker Compose single-host limitation
**Impact**: Cannot scale beyond one physical machine  
**Mitigation**: Design runtime interface to be pluggable; plan K8s adapter for v2

### Risk: Sisu framework dependency
**Impact**: Coupled to external library with uncertain long-term support  
**Mitigation**: Minimize Sisu surface area; keep tool/skill contracts framework-agnostic

### Risk: LLM hallucinations in theme/content generation
**Impact**: Broken CSS, invalid block markup, poor quality content  
**Mitigation**: Validation layer catches structural errors; self-healing attempts fixes; style seeds guide output

### Risk: wp-cli command injection via LLM-generated parameters
**Impact**: Arbitrary command execution in wordpress container  
**Mitigation**: Strict command allowlist + parameter sanitization in wp-cli tool wrapper

### Risk: Browser smoke tests miss edge cases
**Impact**: Site looks broken in real-world usage despite passing validation  
**Mitigation**: Test critical paths (homepage, key pages); capture screenshots for manual review; iterate on test coverage

### Risk: Parent theme version drift breaking child themes
**Impact**: WordPress updates parent theme, child overrides break  
**Mitigation**: Pin parent theme versions in manifest; document upgrade process

### Risk: Export bundles include secrets (API keys in DB)
**Impact**: Credentials leaked in exported files  
**Mitigation**: Scan database.sql for common secret patterns before export; warn user

### Risk: Self-healing makes too many changes (diverges from spec)
**Impact**: Output doesn't match user intent  
**Mitigation**: Log all healing actions in BuildReport; limit to 2 cycles; only apply targeted fixes

---

## Migration Plan

**Phase 1: Foundation Setup** (this change)
1. Initialize Node.js project with TypeScript
2. Create `docker/` directory with base compose files
3. Scaffold `agent-api/` service structure
4. Implement tool wrappers (wp-cli, file, browser, export)
5. Build core skills (wp-install, plugin-installer, theme-generator, page-builder)
6. Implement validation + self-healing loop
7. Create export bundle functionality

**Phase 2: Integration Testing**
1. Test per-site isolation (multiple Docker Compose stacks)
2. Validate tool allowlists prevent unauthorized operations
3. Run end-to-end demo (yoga studio spec → export bundle)
4. Verify exported site deploys to standard WordPress host

**Phase 3: Iteration**
1. Refine style seeds based on output quality
2. Expand wp-cli allowlist for discovered use cases
3. Add more healing strategies based on failure patterns
4. Optimize Docker images for faster startup

**Rollback Strategy**:
- MVP is greenfield → no rollback needed
- If deployed, Docker Compose down + rm volumes destroys site cleanly

---

## Open Questions

1. **Style seed format**: JSON design tokens vs. CSS variables vs. natural language descriptions?
   - **Recommendation**: Start with JSON (colors, typography) + natural language patterns; iterate based on LLM effectiveness

2. **Browser container lifecycle**: Per-site browser container vs. shared pool?
   - **Recommendation**: Per-site for MVP (simpler), shared pool optimization later if resource usage is high

3. **Plugin curation strategy**: Maintain allowlist vs. trust WordPress.org repository?
   - **Recommendation**: Curated allowlist for MVP (quality control), expand cautiously

4. **Theme style seed licensing**: Can we redistribute parent themes in exports?
   - **Action**: Verify GPL compatibility; only bundle GPL-licensed themes

5. **Database size limits**: Should we cap database size for export bundles?
   - **Recommendation**: Start without limit; add 50MB warning in v2 if abuse occurs

6. **Healing cycle timeout**: Max time per healing attempt?
   - **Recommendation**: 5 minutes per cycle (10 minutes total healing time max)

7. **Multi-language support**: UTF-8 content, RTL themes, translation plugins?
   - **Defer**: English-only for MVP; design with i18n in mind for v2

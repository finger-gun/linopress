## 1. Project Initialization and Setup

- [x] 1.1 Initialize Node.js project with TypeScript configuration
- [x] 1.2 Install core dependencies: Sisu framework
- [x] 1.3 Configure TypeScript compiler options and build scripts
- [x] 1.4 Set up project directory structure (docker/, agent-api/, tools/, schemas/)
- [x] 1.5 Create .gitignore and environment variable templates
- [x] 1.6 Set up ESLint and Prettier for code quality

## 2. Docker Compose Runtime Infrastructure

- [x] 2.1 Create base docker-compose.yml template for per-site stacks
- [x] 2.2 Configure wordpress service (nginx + php-fpm, wp-content volume mount)
- [x] 2.3 Configure db service (MariaDB with persistent volume)
- [x] 2.4 Configure agent-api service (Node.js with shared wp-content volume)
- [x] 2.5 Configure optional browser service (browserless/chrome)
- [x] 2.6 Define Docker networking and port mappings
- [x] 2.7 Create Dockerfile for custom agent-api image
- [x] 2.8 Implement site stack provisioning CLI command
- [x] 2.9 Implement site stack lifecycle management (start, stop, destroy)
- [x] 2.10 Add health checks for wordpress and db containers
- [x] 2.11 Configure resource limits (memory, CPU) for containers
- [x] 2.12 Test per-site isolation with multiple concurrent stacks

## 3. Data Models and TypeScript Interfaces

- [x] 3.1 Define SiteSpec interface with all required fields
- [x] 3.2 Define PageSpec interface for content specifications
- [x] 3.3 Define BuildReport interface with validation results
- [x] 3.4 Define ValidationResult interface for CLI and browser checks
- [x] 3.5 Define BuildStep, ErrorLog, and HealingCycle interfaces
- [x] 3.6 Create manifest.json schema definition
- [x] 3.7 Implement validation functions for data models using Zod or similar

## 4. WP-CLI Tool Implementation

- [x] 4.1 Create wp-cli tool wrapper with Sisu tool definition
- [x] 4.2 Define WP_CLI_ALLOWLIST constant with permitted commands
- [x] 4.3 Implement command validation against allowlist
- [x] 4.4 Implement parameter sanitization for injection prevention
- [x] 4.5 Implement docker exec wrapper for command execution in wordpress container
- [x] 4.6 Add stdout/stderr/exit code capture
- [x] 4.7 Implement JSON output parsing for structured commands
- [x] 4.8 Add command timeout enforcement
- [x] 4.9 Implement WordPress installation detection
- [x] 4.10 Add database connectivity validation before DB commands
- [x] 4.11 Create idempotent command wrappers for common operations
- [x] 4.12 Implement error code interpretation and mapping
- [x] 4.13 Add comprehensive logging for all wp-cli invocations

## 5. File Tool Implementation

- [x] 5.1 Create file tool wrapper with Sisu tool definition
- [x] 5.2 Define allowed paths: /var/www/html/wp-content/**, /tmp/linopress/**
- [x] 5.3 Implement path validation with traversal attack prevention
- [x] 5.4 Implement file read operations (text and binary)
- [x] 5.5 Implement file write operations with atomic writes
- [x] 5.6 Implement file copy operations
- [x] 5.7 Implement file delete operations (files and directories)
- [x] 5.8 Implement directory listing with recursive and filter options
- [x] 5.9 Implement file metadata operations (exists, size, mtime)
- [x] 5.10 Set correct file permissions (644 for files, 755 for directories)
- [x] 5.11 Implement temporary file management in /tmp/linopress
- [x] 5.12 Add UTF-8 encoding handling for text files
- [x] 5.13 Implement concurrent access safety mechanisms

## 6. Browser Tool Implementation

- [x] 6.1 Create browser tool wrapper with Sisu tool definition
- [x] 6.2 Integrate vercel-labs/agent-browser CLI
- [x] 6.3 Define BROWSER_URL_ALLOWLIST for local WordPress URLs
- [x] 6.4 Implement URL validation before navigation
- [x] 6.5 Implement page navigation with DOMContentLoaded wait
- [x] 6.6 Implement screenshot capture (full-page and viewport)
- [x] 6.7 Implement console error detection and capture
- [x] 6.8 Implement page element inspection operations
- [x] 6.9 Add page load performance metrics collection
- [x] 6.10 Implement viewport configuration (desktop/mobile)
- [x] 6.11 Add network request monitoring for failed assets
- [x] 6.12 Implement JavaScript execution in page context
- [x] 6.13 Add browser container lifecycle management
- [x] 6.14 Implement Chrome DevTools Protocol connection
- [x] 6.15 Add navigation timeout enforcement
- [x] 6.16 Implement automatic error screenshot capture

## 7. Export Tool Implementation

- [x] 7.1 Create export tool wrapper with Sisu tool definition
- [x] 7.2 Implement wp-content directory archival to tar.gz
- [x] 7.3 Implement database dump using wp-cli db export
- [x] 7.4 Implement manifest.json generation with BuildReport
- [x] 7.5 Create combined tar.gz bundle with all components
- [x] 7.6 Implement bundle naming convention (site-{siteId}\_{timestamp}.tar.gz)
- [x] 7.7 Add export bundle validation (contents, integrity, SQL syntax)
- [x] 7.8 Implement export to configured output directory
- [x] 7.9 Add secret scanning for API keys and passwords
- [x] 7.10 Implement export size reporting and warnings
- [x] 7.11 Add export metadata recording (timestamp, duration, status)
- [x] 7.12 Implement atomic export writes with temp files
- [x] 7.13 Add cleanup of intermediate files on success
- [x] 7.14 Implement screenshot inclusion in export bundle

## 8. WordPress Install Skill Implementation

- [x] 8.1 Create wpInstallSkill with Sisu skill definition (Claude skill)
- [x] 8.2 Implement database connectivity verification
- [x] 8.3 Implement WordPress core installation via wp-cli
- [x] 8.4 Add admin user creation with secure password generation
- [x] 8.5 Implement site URL configuration (WP_HOME, WP_SITEURL)
- [x] 8.6 Apply baseline security settings (DISALLOW_FILE_EDIT)
- [x] 8.7 Configure SEO-friendly permalink structure
- [x] 8.8 Set WordPress timezone
- [x] 8.9 Implement default content cleanup option
- [x] 8.10 Add site language configuration
- [x] 8.11 Implement installation verification (version check, DB tables)
- [x] 8.12 Add idempotent installation detection
- [x] 8.13 Implement error handling with actionable messages

## 9. Plugin Installer Skill Implementation

- [x] 9.1 Create pluginInstallerSkill with Sisu skill definition (Claude skill)
- [x] 9.2 Define curated plugin registry for common use cases
- [x] 9.3 Implement plugin search against registry
- [x] 9.4 Implement plugin installation via wp-cli
- [x] 9.5 Add support for specific version installation
- [x] 9.6 Implement parallel plugin installation
- [x] 9.7 Implement plugin activation with error detection
- [x] 9.8 Add dependency resolution logic
- [x] 9.9 Implement default plugin configuration
- [x] 9.10 Add plugin compatibility validation
- [x] 9.11 Implement plugin deactivation functionality
- [x] 9.12 Implement plugin removal/uninstall
- [x] 9.13 Add plugin list retrieval with status
- [x] 9.14 Implement installation verification

## 10. Theme Generator Skill Implementation

- [x] 10.1 Create themeGeneratorSkill with Sisu skill definition (Claude skill)
- [x] 10.2 Select 2-3 curated parent themes for shipping
- [x] 10.3 Implement parent theme selection logic based on style seed
- [x] 10.4 Implement child theme generation (style.css, functions.php)
- [x] 10.5 Implement blank block theme generation with theme.json
- [x] 10.6 Create style seed parser for colors, typography, spacing
- [x] 10.7 Implement theme.json generation with design tokens
- [x] 10.8 Add block pattern generation (hero, testimonials, pricing)
- [x] 10.9 Implement custom block templates for page types
- [x] 10.10 Add theme validation (structure, headers, required files)
- [x] 10.11 Implement theme activation via wp-cli
- [x] 10.12 Implement fallback sequence (parent+child → blank → default)
- [x] 10.13 Add theme metadata generation (name, version, author)
- [x] 10.14 Implement parent theme version pinning
- [x] 10.15 Add custom font loading support

## 11. Page Builder Skill Implementation

- [x] 11.1 Create pageBuilderSkill with Sisu skill definition (Claude skill)
- [x] 11.2 Implement block-based content generation for pages
- [x] 11.3 Create content template system (homepage, about, contact, services)
- [x] 11.4 Implement page creation via wp-cli post create
- [x] 11.5 Add slug auto-generation from title
- [x] 11.6 Implement post creation with categories and featured images
- [x] 11.7 Implement navigation menu creation and configuration
- [x] 11.8 Add menu item assignment for pages
- [x] 11.9 Implement block pattern insertion for complex sections
- [x] 11.10 Add content personalization (placeholder replacement)
- [x] 11.11 Implement page hierarchy support (parent-child)
- [x] 11.12 Add block markup validation
- [x] 11.13 Implement media upload and insertion
- [x] 11.14 Add shortcode integration for forms and galleries
- [x] 11.15 Implement bulk page creation with parallel execution
- [x] 11.16 Add SEO metadata configuration if plugin installed

## 12. Site Validator Skill Implementation

- [x] 12.1 Create siteValidatorSkill with Sisu skill definition (Claude skill)
- [x] 12.2 Implement database integrity check via wp db check
- [x] 12.3 Add required tables existence verification
- [x] 12.4 Implement filesystem permissions check for wp-content
- [x] 12.5 Add WordPress health check via wp doctor check
- [x] 12.6 Implement plugin conflict detection from error logs
- [x] 12.7 Add active theme validation
- [x] 12.8 Implement content validation (expected pages exist)
- [x] 12.9 Add URL accessibility checks for key pages
- [x] 12.10 Implement permalink structure validation
- [x] 12.11 Add admin user verification
- [x] 12.12 Implement structured ValidationResult generation
- [x] 12.13 Add validation timeout enforcement
- [x] 12.14 Implement validation severity classification (critical/warning/info)
- [x] 12.15 Add custom validation rule support from site specs

## 13. Browser Smoke Test Skill Implementation

- [x] 13.1 Create browserSmokeTestSkill with Sisu skill definition (Claude skill)
- [x] 13.2 Implement critical page testing (homepage, navigation pages)
- [x] 13.3 Add screenshot capture for all tested pages
- [x] 13.4 Implement console error detection during page loads
- [x] 13.5 Add page load performance measurement
- [x] 13.6 Implement basic accessibility checks (alt text, headings)
- [x] 13.7 Add mobile viewport testing option
- [x] 13.8 Implement network error detection for assets
- [x] 13.9 Add test result aggregation into browser validation result
- [x] 13.10 Implement test timeout per page
- [x] 13.11 Add test retry logic for transient failures
- [x] 13.12 Implement browser cache clearing between tests
- [x] 13.13 Add error screenshot auto-capture
- [x] 13.14 Implement screenshot naming convention

## 14. Self-Healing Skill Implementation

- [x] 14.1 Create selfHealingSkill with Sisu skill definition (Claude skill)
- [x] 14.2 Implement error analysis from validation results
- [x] 14.3 Add healing strategy selection based on error types
- [x] 14.4 Implement database repair strategy (wp db repair)
- [x] 14.5 Add admin user regeneration
- [x] 14.6 Implement filesystem permission repair (755/644)
- [x] 14.7 Add plugin conflict resolution (deactivate all, reactivate one-by-one)
- [x] 14.8 Implement theme fallback strategy
- [x] 14.9 Add page regeneration for missing pages
- [x] 14.10 Implement rewrite rules flush for 404 errors
- [x] 14.11 Add healing action logging for BuildReport
- [x] 14.12 Implement bounded healing cycles (max 2)
- [x] 14.13 Add targeted fixes for cycle 1, aggressive fixes for cycle 2
- [x] 14.14 Implement re-validation after each healing cycle
- [x] 14.15 Add partial success handling and progress tracking
- [x] 14.16 Implement comprehensive failure report generation
- [x] 14.17 Add total healing timeout enforcement (10 minutes)
- [x] 14.18 Implement resource cleanup on healing failure

## 15. Site Spec Extractor Skill Implementation

- [ ] 15.1 Create siteSpecExtractorSkill with Sisu skill definition (Claude skill SKILL.md)
- [ ] 15.2 Define SiteSpec output schema contract (pages, plugins, theme mode, style seed, business info)
- [ ] 15.3 Implement prompt-to-SiteSpec extraction via LLM with structured output
- [ ] 15.4 Add default inference for unspecified fields (timezone, language, permalink structure)
- [ ] 15.5 Implement SiteSpec validation against Zod schema before downstream use
- [ ] 15.6 Add plugin registry constraint (reject plugins not in curated registry)
- [ ] 15.7 Implement extraction result metadata (confidence, inferred fields, ambiguities)
- [ ] 15.8 Add extraction error handling for ambiguous or underspecified prompts

## 16. Export Bundle Skill Implementation

- [ ] 16.1 Create exportBundleSkill with Sisu skill definition (Claude skill SKILL.md)
- [ ] 16.2 Implement export orchestration: invoke export tool for wp-content archive, DB dump, manifest
- [ ] 16.3 Add pre-export validation (site must pass CLI + browser checks before export)
- [ ] 16.4 Implement BuildReport inclusion in manifest generation
- [ ] 16.5 Add screenshot bundling into export archive
- [ ] 16.6 Implement export completion status reporting and error handling

## 17. Agent Framework Integration

- [ ] 17.1 Initialize Sisu agent runtime with LLM adapter configuration
- [ ] 17.2 Register all tools with Sisu (wp-cli, file, browser, export)
- [ ] 17.3 Register all skills with Sisu
- [ ] 17.4 Implement skill composability (skills calling other skills)
- [ ] 17.5 Add agent state management for build progress
- [ ] 17.6 Implement error propagation from tools → skills → planner
- [ ] 17.7 Add LLM adapter support for Claude and GPT
- [ ] 17.8 Implement execution tracing for all agent actions
- [ ] 17.9 Add skill timeout protection
- [ ] 17.10 Implement tool allowlist enforcement
- [ ] 17.11 Add graceful shutdown handling
- [ ] 17.12 Implement concurrent skill execution where safe
- [ ] 17.13 Add skill versioning and compatibility checks

## 18. Build Orchestration and Main Flow

- [ ] 18.1 Create main build orchestrator using agent framework
- [ ] 18.2 Implement SiteSpec parsing and validation
- [ ] 18.3 Add build step sequencing: extract → install → plugins → theme → content
- [ ] 18.4 Implement validation + healing loop integration
- [ ] 18.5 Add export triggering on successful validation
- [ ] 18.6 Implement BuildReport generation with all metadata
- [ ] 18.7 Add build progress tracking and logging
- [ ] 18.8 Implement error handling and failure reporting
- [ ] 18.9 Add build timeout enforcement
- [ ] 18.10 Implement CLI interface for site creation

## 19. Style Seeds and Content Templates

- [ ] 19.1 Create JSON schema for style seeds (colors, typography, spacing)
- [ ] 19.2 Design 2-3 style seed examples (minimalist, bold, elegant)
- [ ] 19.3 Create block pattern templates (hero, testimonials, pricing, FAQ)
- [ ] 19.4 Implement content templates for common page types
- [ ] 19.5 Add template variable substitution system
- [ ] 19.6 Create validation schemas for templates

## 20. Testing and Validation

- [ ] 20.1 Write unit tests for all tool wrappers
- [ ] 20.2 Write unit tests for all skills
- [ ] 20.3 Create integration test for full build flow
- [ ] 20.4 Test per-site isolation with concurrent builds
- [ ] 20.5 Validate tool allowlists prevent unauthorized operations
- [ ] 20.6 Test self-healing with various failure scenarios
- [ ] 20.7 Test export bundle creation and restoration
- [ ] 20.8 Verify security model (filesystem restrictions, command allowlisting)
- [ ] 20.9 Test browser automation and screenshot capture
- [ ] 20.10 Validate BuildReport completeness

## 21. End-to-End Demo Implementation

- [ ] 21.1 Create yoga studio SiteSpec with full requirements
- [ ] 21.2 Run end-to-end build: provision → extract → install → theme → content → validate → export
- [ ] 21.3 Verify all pages created correctly (home, about, pricing, schedule, testimonials, contact)
- [ ] 21.4 Validate CLI checks pass (database, filesystem, health)
- [ ] 21.5 Verify browser smoke tests pass on all pages
- [ ] 21.6 Confirm screenshots captured for all pages
- [ ] 21.7 Validate export bundle created with correct structure
- [ ] 21.8 Test export bundle restoration on clean WordPress host
- [ ] 21.9 Verify zero manual intervention throughout process
- [ ] 21.10 Document demo results and any issues encountered

## 22. Documentation and Polish

- [ ] 22.1 Write README with project overview and setup instructions
- [ ] 22.2 Document CLI usage and SiteSpec format
- [ ] 22.3 Create Docker setup and troubleshooting guide
- [ ] 22.4 Document tool allowlists and security model
- [ ] 22.5 Write guide for adding new skills
- [ ] 22.6 Document style seed format and examples
- [ ] 22.7 Create BuildReport schema documentation
- [ ] 22.8 Add inline code comments and JSDoc
- [ ] 22.9 Create architecture diagram
- [ ] 22.10 Write deployment guide for exported sites

## 1. Project Initialization and Setup

- [ ] 1.1 Initialize Node.js project with TypeScript configuration
- [ ] 1.2 Install core dependencies: Sisu framework (@sisu-ai/core, @sisu-ai/runtime)
- [ ] 1.3 Configure TypeScript compiler options and build scripts
- [ ] 1.4 Set up project directory structure (docker/, agent-api/, tools/, schemas/)
- [ ] 1.5 Create .gitignore and environment variable templates
- [ ] 1.6 Set up ESLint and Prettier for code quality

## 2. Docker Compose Runtime Infrastructure

- [ ] 2.1 Create base docker-compose.yml template for per-site stacks
- [ ] 2.2 Configure wordpress service (nginx + php-fpm, wp-content volume mount)
- [ ] 2.3 Configure db service (MariaDB with persistent volume)
- [ ] 2.4 Configure agent-api service (Node.js with shared wp-content volume)
- [ ] 2.5 Configure optional browser service (browserless/chrome)
- [ ] 2.6 Define Docker networking and port mappings
- [ ] 2.7 Create Dockerfile for custom agent-api image
- [ ] 2.8 Implement site stack provisioning CLI command
- [ ] 2.9 Implement site stack lifecycle management (start, stop, destroy)
- [ ] 2.10 Add health checks for wordpress and db containers
- [ ] 2.11 Configure resource limits (memory, CPU) for containers
- [ ] 2.12 Test per-site isolation with multiple concurrent stacks

## 3. Data Models and TypeScript Interfaces

- [ ] 3.1 Define SiteSpec interface with all required fields
- [ ] 3.2 Define PageSpec interface for content specifications
- [ ] 3.3 Define BuildReport interface with validation results
- [ ] 3.4 Define ValidationResult interface for CLI and browser checks
- [ ] 3.5 Define BuildStep, ErrorLog, and HealingCycle interfaces
- [ ] 3.6 Create manifest.json schema definition
- [ ] 3.7 Implement validation functions for data models using Zod or similar

## 4. WP-CLI Tool Implementation

- [ ] 4.1 Create wp-cli tool wrapper with Sisu tool definition
- [ ] 4.2 Define WP_CLI_ALLOWLIST constant with permitted commands
- [ ] 4.3 Implement command validation against allowlist
- [ ] 4.4 Implement parameter sanitization for injection prevention
- [ ] 4.5 Implement docker exec wrapper for command execution in wordpress container
- [ ] 4.6 Add stdout/stderr/exit code capture
- [ ] 4.7 Implement JSON output parsing for structured commands
- [ ] 4.8 Add command timeout enforcement
- [ ] 4.9 Implement WordPress installation detection
- [ ] 4.10 Add database connectivity validation before DB commands
- [ ] 4.11 Create idempotent command wrappers for common operations
- [ ] 4.12 Implement error code interpretation and mapping
- [ ] 4.13 Add comprehensive logging for all wp-cli invocations

## 5. File Tool Implementation

- [ ] 5.1 Create file tool wrapper with Sisu tool definition
- [ ] 5.2 Define allowed paths: /var/www/html/wp-content/**, /tmp/linopress/**
- [ ] 5.3 Implement path validation with traversal attack prevention
- [ ] 5.4 Implement file read operations (text and binary)
- [ ] 5.5 Implement file write operations with atomic writes
- [ ] 5.6 Implement file copy operations
- [ ] 5.7 Implement file delete operations (files and directories)
- [ ] 5.8 Implement directory listing with recursive and filter options
- [ ] 5.9 Implement file metadata operations (exists, size, mtime)
- [ ] 5.10 Set correct file permissions (644 for files, 755 for directories)
- [ ] 5.11 Implement temporary file management in /tmp/linopress
- [ ] 5.12 Add UTF-8 encoding handling for text files
- [ ] 5.13 Implement concurrent access safety mechanisms

## 6. Browser Tool Implementation

- [ ] 6.1 Create browser tool wrapper with Sisu tool definition
- [ ] 6.2 Integrate vercel-labs/agent-browser CLI
- [ ] 6.3 Define BROWSER_URL_ALLOWLIST for local WordPress URLs
- [ ] 6.4 Implement URL validation before navigation
- [ ] 6.5 Implement page navigation with DOMContentLoaded wait
- [ ] 6.6 Implement screenshot capture (full-page and viewport)
- [ ] 6.7 Implement console error detection and capture
- [ ] 6.8 Implement page element inspection operations
- [ ] 6.9 Add page load performance metrics collection
- [ ] 6.10 Implement viewport configuration (desktop/mobile)
- [ ] 6.11 Add network request monitoring for failed assets
- [ ] 6.12 Implement JavaScript execution in page context
- [ ] 6.13 Add browser container lifecycle management
- [ ] 6.14 Implement Chrome DevTools Protocol connection
- [ ] 6.15 Add navigation timeout enforcement
- [ ] 6.16 Implement automatic error screenshot capture

## 7. Export Tool Implementation

- [ ] 7.1 Create export tool wrapper with Sisu tool definition
- [ ] 7.2 Implement wp-content directory archival to tar.gz
- [ ] 7.3 Implement database dump using wp-cli db export
- [ ] 7.4 Implement manifest.json generation with BuildReport
- [ ] 7.5 Create combined tar.gz bundle with all components
- [ ] 7.6 Implement bundle naming convention (site-{siteId}_{timestamp}.tar.gz)
- [ ] 7.7 Add export bundle validation (contents, integrity, SQL syntax)
- [ ] 7.8 Implement export to configured output directory
- [ ] 7.9 Add secret scanning for API keys and passwords
- [ ] 7.10 Implement export size reporting and warnings
- [ ] 7.11 Add export metadata recording (timestamp, duration, status)
- [ ] 7.12 Implement atomic export writes with temp files
- [ ] 7.13 Add cleanup of intermediate files on success
- [ ] 7.14 Implement screenshot inclusion in export bundle

## 8. WordPress Install Skill Implementation

- [ ] 8.1 Create wpInstallSkill with Sisu skill definition
- [ ] 8.2 Implement database connectivity verification
- [ ] 8.3 Implement WordPress core installation via wp-cli
- [ ] 8.4 Add admin user creation with secure password generation
- [ ] 8.5 Implement site URL configuration (WP_HOME, WP_SITEURL)
- [ ] 8.6 Apply baseline security settings (DISALLOW_FILE_EDIT)
- [ ] 8.7 Configure SEO-friendly permalink structure
- [ ] 8.8 Set WordPress timezone
- [ ] 8.9 Implement default content cleanup option
- [ ] 8.10 Add site language configuration
- [ ] 8.11 Implement installation verification (version check, DB tables)
- [ ] 8.12 Add idempotent installation detection
- [ ] 8.13 Implement error handling with actionable messages

## 9. Plugin Installer Skill Implementation

- [ ] 9.1 Create pluginInstallerSkill with Sisu skill definition
- [ ] 9.2 Define curated plugin registry for common use cases
- [ ] 9.3 Implement plugin search against registry
- [ ] 9.4 Implement plugin installation via wp-cli
- [ ] 9.5 Add support for specific version installation
- [ ] 9.6 Implement parallel plugin installation
- [ ] 9.7 Implement plugin activation with error detection
- [ ] 9.8 Add dependency resolution logic
- [ ] 9.9 Implement default plugin configuration
- [ ] 9.10 Add plugin compatibility validation
- [ ] 9.11 Implement plugin deactivation functionality
- [ ] 9.12 Implement plugin removal/uninstall
- [ ] 9.13 Add plugin list retrieval with status
- [ ] 9.14 Implement installation verification

## 10. Theme Generator Skill Implementation

- [ ] 10.1 Create themeGeneratorSkill with Sisu skill definition
- [ ] 10.2 Select 2-3 curated parent themes for shipping
- [ ] 10.3 Implement parent theme selection logic based on style seed
- [ ] 10.4 Implement child theme generation (style.css, functions.php)
- [ ] 10.5 Implement blank block theme generation with theme.json
- [ ] 10.6 Create style seed parser for colors, typography, spacing
- [ ] 10.7 Implement theme.json generation with design tokens
- [ ] 10.8 Add block pattern generation (hero, testimonials, pricing)
- [ ] 10.9 Implement custom block templates for page types
- [ ] 10.10 Add theme validation (structure, headers, required files)
- [ ] 10.11 Implement theme activation via wp-cli
- [ ] 10.12 Implement fallback sequence (parent+child → blank → default)
- [ ] 10.13 Add theme metadata generation (name, version, author)
- [ ] 10.14 Implement parent theme version pinning
- [ ] 10.15 Add custom font loading support

## 11. Page Builder Skill Implementation

- [ ] 11.1 Create pageBuilderSkill with Sisu skill definition
- [ ] 11.2 Implement block-based content generation for pages
- [ ] 11.3 Create content template system (homepage, about, contact, services)
- [ ] 11.4 Implement page creation via wp-cli post create
- [ ] 11.5 Add slug auto-generation from title
- [ ] 11.6 Implement post creation with categories and featured images
- [ ] 11.7 Implement navigation menu creation and configuration
- [ ] 11.8 Add menu item assignment for pages
- [ ] 11.9 Implement block pattern insertion for complex sections
- [ ] 11.10 Add content personalization (placeholder replacement)
- [ ] 11.11 Implement page hierarchy support (parent-child)
- [ ] 11.12 Add block markup validation
- [ ] 11.13 Implement media upload and insertion
- [ ] 11.14 Add shortcode integration for forms and galleries
- [ ] 11.15 Implement bulk page creation with parallel execution
- [ ] 11.16 Add SEO metadata configuration if plugin installed

## 12. Site Validator Skill Implementation

- [ ] 12.1 Create siteValidatorSkill with Sisu skill definition
- [ ] 12.2 Implement database integrity check via wp db check
- [ ] 12.3 Add required tables existence verification
- [ ] 12.4 Implement filesystem permissions check for wp-content
- [ ] 12.5 Add WordPress health check via wp doctor check
- [ ] 12.6 Implement plugin conflict detection from error logs
- [ ] 12.7 Add active theme validation
- [ ] 12.8 Implement content validation (expected pages exist)
- [ ] 12.9 Add URL accessibility checks for key pages
- [ ] 12.10 Implement permalink structure validation
- [ ] 12.11 Add admin user verification
- [ ] 12.12 Implement structured ValidationResult generation
- [ ] 12.13 Add validation timeout enforcement
- [ ] 12.14 Implement validation severity classification (critical/warning/info)
- [ ] 12.15 Add custom validation rule support from site specs

## 13. Browser Smoke Test Skill Implementation

- [ ] 13.1 Create browserSmokeTestSkill with Sisu skill definition
- [ ] 13.2 Implement critical page testing (homepage, navigation pages)
- [ ] 13.3 Add screenshot capture for all tested pages
- [ ] 13.4 Implement console error detection during page loads
- [ ] 13.5 Add page load performance measurement
- [ ] 13.6 Implement basic accessibility checks (alt text, headings)
- [ ] 13.7 Add mobile viewport testing option
- [ ] 13.8 Implement network error detection for assets
- [ ] 13.9 Add test result aggregation into browser validation result
- [ ] 13.10 Implement test timeout per page
- [ ] 13.11 Add test retry logic for transient failures
- [ ] 13.12 Implement browser cache clearing between tests
- [ ] 13.13 Add error screenshot auto-capture
- [ ] 13.14 Implement screenshot naming convention

## 14. Self-Healing Skill Implementation

- [ ] 14.1 Create selfHealingSkill with Sisu skill definition
- [ ] 14.2 Implement error analysis from validation results
- [ ] 14.3 Add healing strategy selection based on error types
- [ ] 14.4 Implement database repair strategy (wp db repair)
- [ ] 14.5 Add admin user regeneration
- [ ] 14.6 Implement filesystem permission repair (755/644)
- [ ] 14.7 Add plugin conflict resolution (deactivate all, reactivate one-by-one)
- [ ] 14.8 Implement theme fallback strategy
- [ ] 14.9 Add page regeneration for missing pages
- [ ] 14.10 Implement rewrite rules flush for 404 errors
- [ ] 14.11 Add healing action logging for BuildReport
- [ ] 14.12 Implement bounded healing cycles (max 2)
- [ ] 14.13 Add targeted fixes for cycle 1, aggressive fixes for cycle 2
- [ ] 14.14 Implement re-validation after each healing cycle
- [ ] 14.15 Add partial success handling and progress tracking
- [ ] 14.16 Implement comprehensive failure report generation
- [ ] 14.17 Add total healing timeout enforcement (10 minutes)
- [ ] 14.18 Implement resource cleanup on healing failure

## 15. Export Bundle Skill Implementation

- [ ] 15.1 Create exportBundleSkill with Sisu skill definition
- [ ] 15.2 Implement export process orchestration
- [ ] 15.3 Add export bundle validation (contents, integrity, SQL)
- [ ] 15.4 Implement manifest generation with full BuildReport
- [ ] 15.5 Add site configuration and version info to manifest
- [ ] 15.6 Implement export location management
- [ ] 15.7 Add screenshot inclusion in bundle
- [ ] 15.8 Implement export size reporting and warnings
- [ ] 15.9 Add secret scanning with warnings
- [ ] 15.10 Implement export metadata recording
- [ ] 15.11 Add atomic export writes
- [ ] 15.12 Implement cleanup of intermediate files
- [ ] 15.13 Add portable URL verification in database
- [ ] 15.14 Implement export completion status reporting

## 16. Agent Framework Integration

- [ ] 16.1 Initialize Sisu agent runtime with LLM adapter configuration
- [ ] 16.2 Register all tools with Sisu (wp-cli, file, browser, export)
- [ ] 16.3 Register all skills with Sisu
- [ ] 16.4 Implement skill composability (skills calling other skills)
- [ ] 16.5 Add agent state management for build progress
- [ ] 16.6 Implement error propagation from tools → skills → planner
- [ ] 16.7 Add LLM adapter support for Claude and GPT
- [ ] 16.8 Implement execution tracing for all agent actions
- [ ] 16.9 Add skill timeout protection
- [ ] 16.10 Implement tool allowlist enforcement
- [ ] 16.11 Add graceful shutdown handling
- [ ] 16.12 Implement concurrent skill execution where safe
- [ ] 16.13 Add skill versioning and compatibility checks

## 17. Build Orchestration and Main Flow

- [ ] 17.1 Create main build orchestrator using agent framework
- [ ] 17.2 Implement SiteSpec parsing and validation
- [ ] 17.3 Add build step sequencing: install → plugins → theme → content
- [ ] 17.4 Implement validation + healing loop integration
- [ ] 17.5 Add export triggering on successful validation
- [ ] 17.6 Implement BuildReport generation with all metadata
- [ ] 17.7 Add build progress tracking and logging
- [ ] 17.8 Implement error handling and failure reporting
- [ ] 17.9 Add build timeout enforcement
- [ ] 17.10 Implement CLI interface for site creation

## 18. Style Seeds and Content Templates

- [ ] 18.1 Create JSON schema for style seeds (colors, typography, spacing)
- [ ] 18.2 Design 2-3 style seed examples (minimalist, bold, elegant)
- [ ] 18.3 Create block pattern templates (hero, testimonials, pricing, FAQ)
- [ ] 18.4 Implement content templates for common page types
- [ ] 18.5 Add template variable substitution system
- [ ] 18.6 Create validation schemas for templates

## 19. Testing and Validation

- [ ] 19.1 Write unit tests for all tool wrappers
- [ ] 19.2 Write unit tests for all skills
- [ ] 19.3 Create integration test for full build flow
- [ ] 19.4 Test per-site isolation with concurrent builds
- [ ] 19.5 Validate tool allowlists prevent unauthorized operations
- [ ] 19.6 Test self-healing with various failure scenarios
- [ ] 19.7 Test export bundle creation and restoration
- [ ] 19.8 Verify security model (filesystem restrictions, command allowlisting)
- [ ] 19.9 Test browser automation and screenshot capture
- [ ] 19.10 Validate BuildReport completeness

## 20. End-to-End Demo Implementation

- [ ] 20.1 Create yoga studio SiteSpec with full requirements
- [ ] 20.2 Run end-to-end build: provision → install → theme → content → validate → export
- [ ] 20.3 Verify all pages created correctly (home, about, pricing, schedule, testimonials, contact)
- [ ] 20.4 Validate CLI checks pass (database, filesystem, health)
- [ ] 20.5 Verify browser smoke tests pass on all pages
- [ ] 20.6 Confirm screenshots captured for all pages
- [ ] 20.7 Validate export bundle created with correct structure
- [ ] 20.8 Test export bundle restoration on clean WordPress host
- [ ] 20.9 Verify zero manual intervention throughout process
- [ ] 20.10 Document demo results and any issues encountered

## 21. Documentation and Polish

- [ ] 21.1 Write README with project overview and setup instructions
- [ ] 21.2 Document CLI usage and SiteSpec format
- [ ] 21.3 Create Docker setup and troubleshooting guide
- [ ] 21.4 Document tool allowlists and security model
- [ ] 21.5 Write guide for adding new skills
- [ ] 21.6 Document style seed format and examples
- [ ] 21.7 Create BuildReport schema documentation
- [ ] 21.8 Add inline code comments and JSDoc
- [ ] 21.9 Create architecture diagram
- [ ] 21.10 Write deployment guide for exported sites

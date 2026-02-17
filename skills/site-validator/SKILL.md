---
name: site-validator
description: Validate WordPress site health (DB, filesystem, content, URLs, admin) and return structured ValidationResult. Use before export and self-healing.
---

# Site Validator Skill

## Purpose

Run deterministic validation checks on a WordPress site and return structured validation results with severity.

## Inputs

- siteId
- baseUrl (for URL checks)
- expectedPages (optional list of slugs/titles)
- expectedPlugins (optional list of plugin slugs)
- check (optional: database | filesystem | health | content | urls | permalinks | admin | all)
- profile (optional: baseline | full)
- timeoutMs (optional)

## Baseline Profile (MVP)

- database integrity
- filesystem permissions
- homepage accessibility
- admin user exists

Advanced checks (performance/SEO) are skipped in baseline.

## Workflow

### Database Integrity

1. `wp db check --skip-plugins --skip-themes`
2. Verify required tables exist (`wp_posts`, `wp_users`, `wp_options`, etc.) via `wp db query` or `wp db tables` (if allowlisted).
3. Report connectivity errors as critical.

### Filesystem Permissions

1. Verify `/var/www/html/wp-content` writable.
2. Verify `wp-content/uploads` has 755 permissions.
3. Report missing write access as critical.

### Health Check

1. `wp doctor check`
2. Treat critical issues as failures; recommendations are warnings.

### Plugin Conflict Detection

1. Parse PHP error logs (if available) for plugin-related errors.
2. Report problematic plugins as failures.

### Theme Validation

1. Validate active theme directory exists in `wp-content/themes`.
2. Report missing files or PHP errors as failures.

### Content Validation

1. Verify expected pages exist and are published.
2. Report missing or draft pages as failures.

### URL Accessibility

1. Check homepage (baseUrl) returns 200.
2. Check key pages (`/about`, `/services`, `/contact` when specified) return 200.
3. Report 404s as failures.

### Permalink Validation

1. Verify permalink structure matches expected (e.g. `/%postname%/`).
2. Confirm no 404s on valid posts (rewrite rules not stale).

### Admin User Verification

1. `wp user list --role=administrator --format=json`
2. Confirm at least one admin user exists.

## Custom Validation Rules

- If site specs include required pages or plugins, validate those explicitly.

## Severity Classification

- critical: database corruption, missing admin, 404 on homepage
- warning: health recommendations, non-critical plugin updates
- info: informational checks

## Output

Return a structured ValidationResult including:

- cli.databaseOk
- cli.filesystemOk
- cli.healthCheckOk
- browser.pagesLoaded (if URL checks run)
- browser.consoleErrors (if captured)
- screenshotsCaptured (if any)

Include error details per failed check.

## Timeout

Abort and return a timeout error if checks exceed timeoutMs.

---
name: export-bundle
description: Orchestrate site export after validation, including manifest generation and bundle verification.
---

# Export Bundle Skill

## Purpose

Create a portable export bundle (wp-content, database dump, manifest) after successful validation.

## Preconditions

- Site stack is running.
- BuildReport is available.
- Export tool is registered and available.

## Inputs

- siteId
- buildReport
- outputDir (optional)
- includeScreenshots (optional)
- screenshotPaths (optional)
- maxSizeMb (optional)

## Workflow

1. Pre-export validation:
   - Run site-validator skill (CLI checks).
   - Run browser-smoke-test skill (browser checks).
   - If critical validation fails, stop and return failure.
2. Invoke export tool:
   - Use export tool with buildReport, optional outputDir, and screenshot options.
3. Manifest requirements:
   - Ensure BuildReport is embedded in manifest.
   - Include theme metadata and plugin list (from tool or provided inputs).
4. Bundle verification:
   - Ensure archive contains wp-content/, database.sql, manifest.json.
   - Surface any validation warnings (SQL validation, secrets, size).
5. Return status:
   - On success: bundle path, size, warnings, manifest.
   - On failure: error message and any retained temp info.

## Output

Return:

- status: success | failed | partial
- bundlePath (on success)
- sizeBytes (on success)
- warnings (optional)
- manifest (on success)
- error (on failure)

## Error Handling

- If validation fails, return a failed status with details.
- If export fails, return a failed status and error message.
- If secrets are detected, warn but do not block export.

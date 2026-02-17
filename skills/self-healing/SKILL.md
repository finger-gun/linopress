---
name: self-healing
description: Attempt bounded healing cycles based on validation errors and re-run validation. Use after failed validation.
version: 0.1.0
minRuntime: 0.1.0
---

# Self-Healing Skill

## Purpose

Analyze validation failures, apply targeted fixes, re-validate, and stop after two cycles with a structured report.

## Inputs

- siteId
- validationResult (from site-validator + browser-smoke-test)
- maxCycles (default 2)
- timeoutMs (default 10 minutes)
- allowRollback (optional)

## Cycle Strategy

- Cycle 1: targeted fixes
- Cycle 2: aggressive fixes

## Workflow

1. Analyze validation errors and classify: database, filesystem, plugin, theme, content, URL/permalink.
2. Build a prioritized plan of actions.
3. Execute healing actions (see below) and log each action.
4. Re-run site-validator and browser-smoke-test.
5. If validation passes: stop and return success.
6. If validation improves but still fails: continue to next cycle.
7. If no progress or timeout exceeded: stop and return failure report.

## Healing Actions

### Database repair

- `wp db repair`
- Re-run `wp db check` to confirm
- Regenerate admin user if missing

### Filesystem repair

- Reset wp-content directories to 755, files to 644
- Ensure uploads dir is writable

### Plugin conflicts

- `wp plugin deactivate --all`
- Re-activate plugins one-by-one; leave failing plugin disabled and log it

### Theme fallback

- Generate minimal blank block theme and activate
- If that fails, activate default theme (twentytwentyfour)

### Content regeneration

- Invoke page-builder skill to recreate missing pages

### Rewrite rules

- `wp rewrite flush --hard`

## Logging

Log all actions with timestamps and outcomes for BuildReport.healingCycles.

## Re-validation

After each cycle, run:

- site-validator
- browser-smoke-test

## Timeout & Cleanup

- Abort healing after timeoutMs.
- Clean temporary resources; retain logs/screenshots on failure.

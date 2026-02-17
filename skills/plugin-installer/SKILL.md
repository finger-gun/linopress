---
name: plugin-installer
description: Install, activate, and manage curated WordPress plugins via wp-cli. Use when setting up plugins for a site.
---

# Plugin Installer Skill

## Purpose

Install, activate, and manage a curated set of plugins using allowlisted wp-cli commands.

## Curated Registry (initial)

- contact-form-7 (forms/contact)
- wpforms-lite (forms/contact)
- wordpress-seo (Yoast SEO)
- seo-by-rank-math (Rank Math)
- woocommerce
- woocommerce-payments (depends on woocommerce)

## Inputs

- siteId
- action: search | install | activate | deactivate | uninstall | list
- query (for search)
- plugins: [{ slug, version?, activate? }]
- autoActivate (default true)
- resolveDependencies (default true)
- parallel (default false for dependency-safe installs)
- configureDefaults (optional)
- validateCompatibility (optional)
- rollbackOnFailure (optional)

## Workflow

### Search

1. Filter curated registry by slug/name/category/keywords.
2. Return matching slugs.

### Install

1. If curatedOnly, reject plugins not in registry.
2. Resolve dependencies (topological order).
3. Optional compatibility check (compare wp core version to minWp).
4. Install each plugin:
   - `wp plugin install <slug> [--version=<v>]`
5. Optional activation:
   - `wp plugin activate <slug>`
6. Verify installation:
   - `wp plugin list --format=json`
7. Optional default configuration steps per plugin.

### Activate/Deactivate/Uninstall/List

- `wp plugin activate <slug>`
- `wp plugin deactivate <slug>`
- `wp plugin uninstall <slug> --deactivate`
- `wp plugin list --format=json`

## Output

Return action + list of installed/activated plugins, or failures with stderr.

## Error Handling

- If activation fails and rollbackOnFailure=true, uninstall the plugin.
- Return actionable errors for missing registry entries or failed installs.

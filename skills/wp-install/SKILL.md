---
name: wp-install
description: Install or verify a WordPress site using wp-cli. Use when provisioning a site or ensuring WordPress is installed with baseline config.
version: 0.1.0
minRuntime: 0.1.0
---

# WordPress Install Skill

## Purpose

Provision or verify a WordPress site inside a Linopress container using allowlisted wp-cli commands.

## Preconditions

- Site stack is provisioned and running.
- wp-cli tool is available and allowlisted.

## Inputs

- siteId
- url (WP_HOME/WP_SITEURL)
- title
- adminUser
- adminEmail
- adminPassword (optional; generate if absent)
- timezone (optional, default UTC)
- language (optional, default en_US)
- forceReinstall (optional)

## Workflow

1. Verify database readiness: `wp db check --skip-plugins --skip-themes`.
2. If WordPress already installed:
   - If forceReinstall: reset DB with `wp db reset --yes`, then continue.
   - Else: return a skipped result.
3. Install core:
   - `wp core install --url=<url> --title=<title> --admin_user=<user> --admin_password=<pass> --admin_email=<email>`
4. Configure site URLs:
   - `wp option update home <url>`
   - `wp option update siteurl <url>`
5. Apply baseline security:
   - `wp config set DISALLOW_FILE_EDIT true --raw`
6. Set permalinks:
   - `wp rewrite structure /%postname%/ --hard` and `wp rewrite flush --hard`
7. Set timezone:
   - `wp option update timezone_string <tz>`
8. Optional language:
   - `wp language core install <locale> --activate`
9. **Default content cleanup** (ALWAYS perform — not optional):
   - `wp post delete 1 --force` (remove "Hello world!" post)
   - `wp post delete 2 --force` (remove "Sample Page")
   - `wp comment delete 1 --force` (remove default comment)
   - This prevents default content from polluting navigation and the site.
10. Verify:

- `wp core version --skip-plugins --skip-themes`
- `wp db check --skip-plugins --skip-themes`
- Ensure admin user exists via `wp user list --role=administrator --format=json`

## Output

Return status with siteId, adminUser, and generated adminPassword if one was created.

## Error Handling

- If DB check fails, return actionable error (database not ready).
- If install fails, include stderr in failure result.

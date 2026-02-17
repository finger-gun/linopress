# Tool Allowlists and Security Model

Linopress enforces a strict security boundary: skills can only call allowlisted tools, and tools can only perform allowlisted operations.

## wp-cli allowlist

Allowlisted commands live in `src/tools/wp-cli.ts` and include:

- `wp core install`, `wp core version`
- `wp plugin install`, `wp plugin activate`, `wp plugin list`
- `wp theme install`, `wp theme activate`, `wp theme list`
- `wp post create`, `wp post list`
- `wp menu create`, `wp menu item add-*`
- `wp db export`, `wp db check`

Any command not on the allowlist is rejected.

## File tool restrictions

The file tool only allows access to:

- `/var/www/html/wp-content/**`
- `/tmp/linopress/**`

Attempts to write outside these roots are rejected.

## Browser tool allowlist

Only local WordPress URLs are allowed:

- `http://localhost:<port>/...`
- `http://wordpress:<port>/...`

External navigation is blocked.

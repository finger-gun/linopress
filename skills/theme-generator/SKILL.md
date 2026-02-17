---
name: theme-generator
description: Generate or activate a WordPress theme (parent+child, blank block, or user-selected). Use when configuring site theming.
version: 0.1.0
minRuntime: 0.1.0
---

# Theme Generator Skill

## Purpose

Create or activate a theme based on the selected mode, using wp-cli and restricted filesystem writes.

## Modes

1. parent: install curated parent theme + generate child theme
2. blank: create a minimal block theme
3. user-selected: install and activate a specified theme slug

## Curated Parent Themes

- twentytwentyfour
- twentytwentythree
- twentytwentytwo

## Inputs

- siteId
- mode (parent | blank | user-selected)
- siteName (optional)
- styleSeed (optional tokens and colors)
- themeSlug (optional)

## Workflow

### Parent mode

1. Select parent theme based on styleSeed tags.
2. `wp theme install <parent>`
3. Create child theme in wp-content/themes/<child> with:
   - style.css header (Template: <parent>)
   - functions.php enqueueing parent + fonts
4. Validate required files.
5. `wp theme activate <child>`

### Blank mode

1. Create a block theme with:
   - style.css header
   - theme.json with palette + typography
   - templates and parts
   - patterns (hero, testimonials, pricing)
2. Validate required files.
3. `wp theme activate <slug>`

### User-selected

1. `wp theme install <slug>`
2. `wp theme activate <slug>`

## Fallbacks

- If parent mode fails, fallback to blank mode.
- If blank mode fails, fallback to default theme (twentytwentyfour).

## Output

- status, themeSlug, parent theme info if applicable

## Notes

- Theme files are written via the file tool (restricted to wp-content).
- When calling the file tool with operation=write, ALWAYS include the file contents in the data field.

Example:

```json
{
  "operation": "write",
  "path": "/var/www/html/wp-content/themes/child-theme/style.css",
  "data": "/* Theme Name: Child */"
}
```

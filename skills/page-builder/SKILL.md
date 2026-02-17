---
name: page-builder
description: Create pages, posts, and menus using block markup via wp-cli. Use when assembling site content.
---

# Page Builder Skill

## Purpose

Create pages, posts, and navigation menus using wp-cli with block markup and templates.

## Inputs

- siteId
- pages: { title, slug?, content?, template?, status?, parentSlug?, metaDescription?, focusKeyword? }
- posts: { title, slug?, content?, excerpt?, status?, categories?, featuredImagePath?, metaDescription?, focusKeyword? }
- menu: { name?, location?, pageSlugs? }
- siteData: map of placeholder values (BUSINESS_NAME, EMAIL, PHONE, etc.)
- parallel (optional)

## Templates

- homepage
- about
- services
- contact

Templates should return block markup and accept placeholder replacements like [BUSINESS_NAME].

## Workflow

1. Build content from template or explicit content.
2. Validate block markup by ensuring matching block open/close comments.
3. Create pages:
   - `wp post create --post_type=page --post_title=... --post_name=... --post_content=... --porcelain`
4. Support parent/child hierarchy by mapping parent slugs to IDs.
5. Create posts with categories:
   - `wp term create category <name>`
   - `wp post create ... --post_category=<list>`
6. Optional featured image:
   - `wp media import <path> --porcelain --alt=<alt>`
   - `wp post meta update <id> _thumbnail_id <mediaId>`
7. Menu creation:
   - `wp menu create <name>`
   - `wp menu item add-post <menu> <pageId>`
   - `wp menu location assign <menu> <location>`
8. Optional SEO metadata (if plugin installed):
   - Yoast: `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`
   - Rank Math: `rank_math_description`, `rank_math_focus_keyword`

## Output

- status + created page/post IDs

## Notes

- Use allowlisted wp-cli commands only.
- Use templates to keep block structure consistent.

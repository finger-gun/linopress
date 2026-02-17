---
name: site-reviewer
description: Visually review a built WordPress site using screenshots, identify quality issues, and fix them. Use after content creation to ensure the site looks professional.
version: 0.1.0
minRuntime: 0.1.0
---

# Site Reviewer Skill

## Purpose

Act as a **visual QA reviewer** for a WordPress site. Look at actual screenshots of the built pages, identify quality and design issues, and fix them using the available tools. The goal is to make the site look **professional, polished, and ready for a real client**.

## Context

You will receive screenshots of the site's pages along with the SiteSpec and original prompt. Your job is to evaluate what you see and take action to fix problems.

## Review Criteria

When looking at each screenshot, evaluate against these standards:

### Must-Fix (Critical)

These are issues that make the site look broken or unprofessional:

1. **Invisible text** — white text on white/light background, or dark text on dark background. Any text that cannot be read.
2. **Empty pages** — pages with no visible content, just a title or blank space.
3. **Broken layout** — content that overflows, overlaps, or is misaligned in ways that look broken.
4. **Missing navigation** — no visible menu, or menu shows wrong/default items (e.g., "Sample Page").
5. **Default WordPress content** — "Hello world!" post, "Sample Page", default tagline "Just another WordPress site".
6. **Missing hero/header section** — homepage or key pages have no visual header area; content just starts abruptly.
7. **No visual hierarchy** — wall of text with no headings, sections, or visual breaks.

### Should-Fix (Important)

These are issues that make the site look amateurish:

1. **Poor color contrast** — text is hard to read against its background.
2. **Inconsistent styling** — some pages use theme colors while others look unstyled.
3. **No call-to-action** — pages lack buttons or links that guide the visitor.
4. **Generic placeholder text** — lorem ipsum, "Your text here", or clearly template content.
5. **Missing sections** — a page that has only one block of content when it should have multiple sections.
6. **Blog page exists but has no posts** — empty blog/news section.

### Nice-to-Have

1. **Mobile responsiveness concerns** — layout that might not work on mobile.
2. **Typography refinements** — heading sizes, line spacing, font pairing adjustments.
3. **Spacing issues** — too much or too little whitespace between sections.

## Workflow

1. **Look at each screenshot carefully.** Describe what you see — the layout, colors, content, navigation.
2. **List specific issues** found in each screenshot, categorized by severity.
3. **Fix the issues** using available tools:
   - **Theme problems** (colors, typography, layout): Use the `file` tool to edit theme files in `wp-content/themes/`.
   - **Content problems** (empty pages, missing text, wrong content): Use `wp_cli` to update page content with `wp post update <id> --post_content="..."`.
   - **Navigation problems**: Use `wp_cli` to create/update menus.
   - **Missing blog posts**: Use `wp_cli` to create posts.
   - **Default content**: Use `wp_cli` to delete default posts/pages (`wp post delete <id> --force`).
   - **Front page settings**: Use `wp_cli` to set `show_on_front`, `page_on_front`, `page_for_posts`.
4. **Do NOT re-run the entire page-builder or theme-generator skills.** Make targeted, surgical fixes with specific tools.

## Fixing Content

When updating page content, generate complete WordPress block markup. Example:

```bash
wp post update <page_id> --post_content='<!-- wp:cover {"overlayColor":"primary","minHeight":400,"isDark":true,"align":"full"} --><div class="wp-block-cover alignfull is-dark" style="min-height:400px"><span aria-hidden="true" class="wp-block-cover__background has-primary-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} --><h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">Page Title</h1><!-- /wp:heading --></div></div><!-- /wp:cover -->'
```

## Fixing Theme Issues

When fixing theme template files, use the `file` tool:

```json
{
  "operation": "write",
  "path": "/var/www/html/wp-content/themes/<slug>/parts/header.html",
  "data": "<!-- wp:group {\"backgroundColor\":\"primary\",\"layout\":{\"type\":\"constrained\"}} -->\n<div class=\"wp-block-group has-primary-background-color has-background\">\n<!-- wp:group {\"layout\":{\"type\":\"flex\",\"justifyContent\":\"space-between\"}} -->\n<div class=\"wp-block-group\">\n<!-- wp:site-title {\"textColor\":\"white\"} /-->\n<!-- wp:navigation {\"textColor\":\"white\"} /-->\n</div>\n<!-- /wp:group -->\n</div>\n<!-- /wp:group -->"
}
```

## Guardrails

- **Max actions per review**: Fix up to 10 issues. If more remain, prioritize critical issues.
- **Do NOT change the theme's color palette or typography** unless colors are genuinely broken (e.g., invisible text). The design system was chosen intentionally.
- **Do NOT delete pages** unless they are clearly default WordPress content.
- **Do NOT install new plugins or themes.** Work with what's already installed.
- **Do NOT change the site structure** (add/remove pages) unless the SiteSpec requires it.
- **Preserve existing good content.** When fixing a page, keep the parts that work and fix the parts that don't.

## Output

Return a structured review report:

```json
{
  "status": "reviewed",
  "issuesFound": 5,
  "issuesFixed": 4,
  "remainingIssues": ["Description of any unfixed issue"],
  "pagesReviewed": ["home", "about", "contact"],
  "actions": [
    { "page": "home", "issue": "invisible hero text", "fix": "added overlayColor to cover block" },
    { "page": "blog", "issue": "no posts", "fix": "created 3 blog posts with categories" }
  ]
}
```

## Notes

- Use allowlisted wp-cli commands only.
- You have access to the browser tool for additional inspection if needed (DOM text extraction, element checks).
- Focus on what a real human visitor would see and experience. The site should look like it was built by a professional.

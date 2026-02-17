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

Create a fully custom block theme from scratch. The `styleSeed` tokens drive every design decision.

1. Derive a design system from the styleSeed:
   - **Color palette**: 4-6 colors (primary, secondary, accent, background, surface, text). Map styleSeed mood to concrete hex values. Dark themes should use dark backgrounds with light text and vibrant accents. Light themes should use white/neutral backgrounds.
   - **Typography**: Choose 1-2 Google Fonts or system font stacks that match the styleSeed mood. Define sizes for headings (h1-h4), body, and small text.
   - **Spacing**: Define a spacing scale (small, medium, large, xl) that fits the density implied by the styleSeed.

2. Create the theme directory at `wp-content/themes/<slug>/` with these files:

   **style.css** -- Theme header with name, description, version, requires, text domain.

   **theme.json** -- Full block theme configuration:

   ```json
   {
     "$schema": "https://schemas.wp.org/wp/6.4/theme.json",
     "version": 3,
     "settings": {
       "color": { "palette": [...] },
       "typography": { "fontFamilies": [...], "fontSizes": [...] },
       "spacing": { "spacingSizes": [...] },
       "layout": { "contentSize": "800px", "wideSize": "1200px" }
     },
     "styles": {
       "color": { "background": "...", "text": "..." },
       "typography": { "fontFamily": "...", "fontSize": "..." },
       "elements": {
         "heading": { "typography": { "fontFamily": "..." } },
         "link": { "color": { "text": "..." } },
         "button": { "color": { "background": "...", "text": "..." } }
       }
     }
   }
   ```

   **templates/index.html** -- Main template with header, content, footer parts:

   ```html
   <!-- wp:template-part {"slug":"header","area":"header"} /-->
   <!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
   <main class="wp-block-group">
     <!-- wp:post-content /-->
   </main>
   <!-- /wp:group -->
   <!-- wp:template-part {"slug":"footer","area":"footer"} /-->
   ```

   **templates/page.html** -- Page template (similar structure, can differ from index).

   **templates/home.html** -- Front page template. MUST include a hero section with an explicit background color from the palette (NEVER white text on a default/transparent background). Example:

   ```html
   <!-- wp:template-part {"slug":"header","area":"header"} /-->
   <!-- wp:cover {"overlayColor":"primary","minHeight":500,"isDark":true,"align":"full"} -->
   <div class="wp-block-cover alignfull is-dark" style="min-height:500px">
     <span
       aria-hidden="true"
       class="wp-block-cover__background has-primary-background-color has-background-dim-100 has-background-dim"
     ></span>
     <div class="wp-block-cover__inner-container">
       <!-- wp:heading {"textAlign":"center","level":1,"style":{"color":{"text":"#ffffff"}}} -->
       <h1 class="wp-block-heading has-text-align-center" style="color:#ffffff">Site Title</h1>
       <!-- /wp:heading -->
       <!-- wp:paragraph {"align":"center","style":{"color":{"text":"#ffffff"}}} -->
       <p class="has-text-align-center" style="color:#ffffff">Tagline or subtitle goes here.</p>
       <!-- /wp:paragraph -->
     </div>
   </div>
   <!-- /wp:cover -->
   <!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
   <main class="wp-block-group">
     <!-- wp:post-content /-->
   </main>
   <!-- /wp:group -->
   <!-- wp:template-part {"slug":"footer","area":"footer"} /-->
   ```

   **templates/single.html** -- Single post template with post title, meta, content, and comments.

   **templates/404.html** -- Custom 404 page with a helpful message and link back to home.

   **parts/header.html** -- Site header with site title and a `wp:navigation` block (NOT `wp:page-list`). The `wp:navigation` block picks up menus created by the page-builder skill. Use theme palette colors for background and text. Example:

   ```html
   <!-- wp:group {"backgroundColor":"primary","layout":{"type":"constrained"}} -->
   <div class="wp-block-group has-primary-background-color has-background">
     <!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->
     <div class="wp-block-group">
       <!-- wp:site-title {"textColor":"white"} /-->
       <!-- wp:navigation {"textColor":"white","overlayMenu":"mobile","layout":{"type":"flex"}} /-->
     </div>
     <!-- /wp:group -->
   </div>
   <!-- /wp:group -->
   ```

   IMPORTANT: Do NOT use `<!-- wp:page-list /-->` in the header. It auto-generates an alphabetical list of all pages (including unwanted defaults). Use `<!-- wp:navigation /-->` instead — it will display the menu created by the page-builder skill.

   **parts/footer.html** -- Site footer with copyright, optional social links, and secondary navigation. Use palette colors for background.

3. Validate that all required files exist (style.css, theme.json, templates/index.html, parts/header.html, parts/footer.html).
4. `wp theme activate <slug>`
5. Verify activation with `wp theme list`.

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
- **Color references in templates**: Use palette slug references like `"backgroundColor":"primary"`, `"textColor":"contrast"` in block JSON attributes. WordPress resolves these to the corresponding CSS custom properties (e.g., `var(--wp--preset--color--primary)`). This ensures templates adapt when the palette changes.
- **Hero sections MUST have visible text**: Always set a background color on hero/cover blocks. White text on a transparent/default background is invisible and unacceptable.
- **Navigation**: Always use `wp:navigation` in `parts/header.html`, never `wp:page-list`. The page-builder skill creates a proper menu that `wp:navigation` will display.

Example file write:

```json
{
  "operation": "write",
  "path": "/var/www/html/wp-content/themes/child-theme/style.css",
  "data": "/* Theme Name: Child */"
}
```

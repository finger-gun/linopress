---
name: page-builder
description: Create pages, posts, and menus using block markup via wp-cli. Use when assembling site content.
version: 0.2.0
minRuntime: 0.1.0
---

# Page Builder Skill

## Purpose

Create **rich, visually impressive** pages, blog posts, and navigation menus using wp-cli with WordPress block markup. Every page must have substantial, real-looking content — never empty scaffolds.

## Inputs

- siteId
- pages: { title, slug?, content?, template?, status?, parentSlug?, metaDescription?, focusKeyword? }
- posts: { title, slug?, content?, excerpt?, status?, categories?, featuredImagePath?, metaDescription?, focusKeyword? }
- menu: { name?, location?, pageSlugs? }
- siteData: map of placeholder values (BUSINESS_NAME, EMAIL, PHONE, etc.)
- originalPrompt: the user's original site prompt (use for tone, audience, and content generation)
- parallel (optional)

## CRITICAL: Content Quality Requirements

**Every page MUST have:**

1. A **hero/header section** with a background color from the theme palette (NEVER plain white or transparent). Use a `wp:cover` or `wp:group` block with `backgroundColor` or `gradient` set.
2. At least **2-3 content sections** with real, contextual placeholder text appropriate to the site's purpose. Write actual paragraphs, not lorem ipsum.
3. Proper visual hierarchy using **headings (h2-h4), paragraphs, buttons, spacers, and columns**.
4. Use of **theme palette colors** via preset references like `"backgroundColor":"primary"` or `"textColor":"contrast"`.

**NEVER create an empty page.** If the SiteSpec `content` field is a template hint object (e.g. `{ "id": "gallery" }`), you must generate full block markup appropriate for that page type.

## Content Templates

When `content` is a ContentTemplate object with an `id` field, generate rich block markup based on the template type:

### homepage

Hero cover block with strong heading + subheading + CTA button, followed by a features/highlights section using columns, an about/intro section, and optionally a latest-posts query loop.

```html
<!-- wp:cover {"overlayColor":"primary","minHeight":500,"isDark":true,"align":"full"} -->
<div class="wp-block-cover alignfull is-dark" style="min-height:500px">
  <span
    aria-hidden="true"
    class="wp-block-cover__background has-primary-background-color has-background-dim-100 has-background-dim"
  ></span>
  <div class="wp-block-cover__inner-container">
    <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
    <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">
      Welcome to [BUSINESS_NAME]
    </h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"align":"center","textColor":"white"} -->
    <p class="has-text-align-center has-white-color has-text-color">
      Your compelling tagline goes here — describe what makes this site special.
    </p>
    <!-- /wp:paragraph -->
    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
      <!-- wp:button {"backgroundColor":"secondary","textColor":"white"} -->
      <div class="wp-block-button">
        <a
          class="wp-block-button__link has-white-color has-secondary-background-color has-text-color has-background wp-element-button"
          >Get Started</a
        >
      </div>
      <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
  </div>
</div>
<!-- /wp:cover -->

<!-- wp:spacer {"height":"60px"} -->
<div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:heading {"level":3} -->
    <h3 class="wp-block-heading">Feature One</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>
      Describe this key feature or service in 2-3 sentences. Make it relevant to the site's purpose.
    </p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:heading {"level":3} -->
    <h3 class="wp-block-heading">Feature Two</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>
      Another compelling feature. Be specific and relevant to the audience described in the prompt.
    </p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:heading {"level":3} -->
    <h3 class="wp-block-heading">Feature Three</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>Third feature or benefit. Each card should feel distinct and valuable.</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->
```

### about

Bio section with image placeholder, mission/story section, optional team grid.

```html
<!-- wp:group {"backgroundColor":"primary","align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background">
  <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
  <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">About Us</h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"white"} -->
  <p class="has-text-align-center has-white-color has-text-color">
    Our story, mission, and the people behind what we do.
  </p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
  <!-- wp:column {"width":"40%"} -->
  <div class="wp-block-column" style="flex-basis:40%">
    <!-- wp:image {"sizeSlug":"large","alt":"About us photo"} -->
    <figure class="wp-block-image size-large"><img src="" alt="About us photo" /></figure>
    <!-- /wp:image -->
  </div>
  <!-- /wp:column -->
  <!-- wp:column {"width":"60%"} -->
  <div class="wp-block-column" style="flex-basis:60%">
    <!-- wp:heading {"level":2} -->
    <h2 class="wp-block-heading">Our Story</h2>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>
      Write 2-3 paragraphs about the company/person's background, journey, and what drives them.
      Make this authentic and specific to the site's purpose described in the prompt.
    </p>
    <!-- /wp:paragraph -->
    <!-- wp:paragraph -->
    <p>
      Include a second paragraph about values, approach, or what sets them apart. Reference the
      industry or niche from the original prompt.
    </p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->
```

### services / pricing

Service cards in columns with descriptions and CTA buttons.

```html
<!-- wp:group {"backgroundColor":"primary","align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background">
  <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
  <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">
    Our Services
  </h1>
  <!-- /wp:heading -->
</div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:group {"style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"30px","bottom":"30px","left":"30px","right":"30px"}}},"backgroundColor":"surface","layout":{"type":"constrained"}} -->
    <div
      class="wp-block-group has-surface-background-color has-background"
      style="border-radius:8px;padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px"
    >
      <!-- wp:heading {"level":3,"textColor":"primary"} -->
      <h3 class="wp-block-heading has-primary-color has-text-color">Service Name</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>
        Describe what this service includes, who it's for, and the key benefit. Be specific and
        compelling.
      </p>
      <!-- /wp:paragraph -->
      <!-- wp:buttons -->
      <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"primary"} -->
        <div class="wp-block-button">
          <a
            class="wp-block-button__link has-primary-background-color has-background wp-element-button"
            >Learn More</a
          >
        </div>
        <!-- /wp:button -->
      </div>
      <!-- /wp:buttons -->
    </div>
    <!-- /wp:group -->
  </div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->
```

### contact

Contact info, form shortcode (if CF7 installed), map placeholder.

```html
<!-- wp:group {"backgroundColor":"primary","align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background">
  <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
  <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">Contact Us</h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"white"} -->
  <p class="has-text-align-center has-white-color has-text-color">
    We'd love to hear from you. Reach out anytime.
  </p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:heading {"level":3} -->
    <h3 class="wp-block-heading">Get In Touch</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p><strong>Email:</strong> [EMAIL]</p>
    <!-- /wp:paragraph -->
    <!-- wp:paragraph -->
    <p><strong>Phone:</strong> [PHONE]</p>
    <!-- /wp:paragraph -->
    <!-- wp:paragraph -->
    <p><strong>Address:</strong> [ADDRESS]</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:heading {"level":3} -->
    <h3 class="wp-block-heading">Hours</h3>
    <!-- /wp:heading -->
    <!-- wp:paragraph -->
    <p>Monday - Friday: 9am - 5pm<br />Saturday: 10am - 2pm<br />Sunday: Closed</p>
    <!-- /wp:paragraph -->
  </div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->
```

### gallery / portfolio / books

Grid layout with card-like groups for each item.

```html
<!-- wp:group {"backgroundColor":"primary","align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background">
  <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
  <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">Gallery</h1>
  <!-- /wp:heading -->
</div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
  <!-- wp:column -->
  <div class="wp-block-column">
    <!-- wp:group {"style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"20px","bottom":"20px","left":"20px","right":"20px"}}},"backgroundColor":"surface"} -->
    <div
      class="wp-block-group has-surface-background-color has-background"
      style="border-radius:8px;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px"
    >
      <!-- wp:image {"sizeSlug":"large","alt":"Item description"} -->
      <figure class="wp-block-image size-large"><img src="" alt="Item description" /></figure>
      <!-- /wp:image -->
      <!-- wp:heading {"level":3} -->
      <h3 class="wp-block-heading">Item Title</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Brief description of this item — what it is, when it was created, or why it matters.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:group -->
  </div>
  <!-- /wp:column -->
</div>
<!-- /wp:columns -->
```

### blog

A page that displays recent posts using a query loop block.

```html
<!-- wp:group {"backgroundColor":"primary","align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background">
  <!-- wp:heading {"textAlign":"center","level":1,"textColor":"white"} -->
  <h1 class="wp-block-heading has-text-align-center has-white-color has-text-color">Blog</h1>
  <!-- /wp:heading -->
</div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:query {"queryId":1,"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date"},"align":"wide"} -->
<div class="wp-block-query alignwide">
  <!-- wp:post-template {"layout":{"type":"grid","columnCount":2}} -->
  <!-- wp:group {"style":{"spacing":{"padding":{"top":"20px","bottom":"20px","left":"20px","right":"20px"}},"border":{"radius":"8px"}},"backgroundColor":"surface"} -->
  <div
    class="wp-block-group has-surface-background-color has-background"
    style="border-radius:8px;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px"
  >
    <!-- wp:post-title {"isLink":true} /-->
    <!-- wp:post-date /-->
    <!-- wp:post-excerpt {"moreText":"Read More"} /-->
  </div>
  <!-- /wp:group -->
  <!-- /wp:post-template -->
  <!-- wp:query-pagination -->
  <!-- wp:query-pagination-previous /-->
  <!-- wp:query-pagination-numbers /-->
  <!-- wp:query-pagination-next /-->
  <!-- /wp:query-pagination -->
</div>
<!-- /wp:query -->
```

## Blog Posts

**When the original prompt mentions a blog, news, articles, or journal**, create **3-5 sample blog posts** with:

- Realistic titles relevant to the site's niche
- 2-3 paragraphs of real content per post (not lorem ipsum)
- At least one relevant category per post
- An excerpt (1-2 sentences)
- Published status

Create categories first, then posts:

```bash
# Create categories
wp term create category "Category Name" --porcelain

# Create a blog post
wp post create --post_type=post --post_title="Post Title" --post_status=publish --post_content="<!-- wp:paragraph --><p>First paragraph of real content...</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Second paragraph...</p><!-- /wp:paragraph -->" --post_excerpt="Brief excerpt." --post_category=<category_id> --porcelain
```

**Example blog posts for a children's book author site:**

- "Behind the Scenes: How I Illustrate My Characters" (category: Behind the Scenes)
- "5 Tips for Reading Aloud to Young Children" (category: Reading Tips)
- "Announcing My Newest Book: The Adventures of Luna" (category: News)

## Default Content Cleanup

**ALWAYS** perform these cleanup steps before creating any content:

```bash
# Delete default WordPress content
wp post delete 1 --force    # "Hello world!" post
wp post delete 2 --force    # "Sample Page"
wp comment delete 1 --force # Default comment
```

This prevents default content from polluting navigation and the site.

## Navigation Menu

**ALWAYS** create a proper navigation menu after all pages are created:

1. Create the menu:

   ```bash
   wp menu create "Primary" --porcelain
   ```

2. Add pages in logical order (Home first, Contact last):

   ```bash
   wp menu item add-post <menu_id> <page_id> --title="Home"
   wp menu item add-post <menu_id> <page_id> --title="About"
   wp menu item add-post <menu_id> <page_id> --title="Services"
   wp menu item add-post <menu_id> <page_id> --title="Blog"
   wp menu item add-post <menu_id> <page_id> --title="Contact"
   ```

3. Assign to primary location:

   ```bash
   wp menu location assign <menu_id> primary
   ```

4. Set the homepage as the front page:

   ```bash
   wp option update show_on_front page
   wp option update page_on_front <homepage_id>
   ```

   If a blog page exists, set it as the posts page:

   ```bash
   wp option update page_for_posts <blog_page_id>
   ```

## Workflow

1. **Clean up default content** (delete Sample Page, Hello World, default comment).
2. **Generate block markup** for each page — use template examples above as a starting point, but customize content to match the site's purpose from the original prompt. Adapt headings, text, colors, and structure.
3. **Validate block markup** by ensuring matching block open/close comments.
4. **Create pages:**
   - `wp post create --post_type=page --post_title=... --post_name=... --post_content=... --post_status=publish --porcelain`
5. Support parent/child hierarchy by mapping parent slugs to IDs.
6. **Create blog posts** (if requested) with categories, excerpts, and rich content.
7. **Create navigation menu** with pages in logical order and assign to primary location.
8. **Set front page** to the homepage and posts page to the blog page (if applicable).
9. Optional SEO metadata (if plugin installed):
   - Yoast: `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`
   - Rank Math: `rank_math_description`, `rank_math_focus_keyword`

## Output

- status + created page/post IDs + menu ID

## Notes

- Use allowlisted wp-cli commands only.
- All block markup must use **theme palette color references** (`"backgroundColor":"primary"`, `"textColor":"contrast"`) — not hardcoded hex values — so themes can be changed later.
- Replace `[BUSINESS_NAME]`, `[EMAIL]`, `[PHONE]`, `[ADDRESS]` placeholders with values from siteData if available.
- When the SiteSpec `content` field is a string, use it directly as block markup. When it's a ContentTemplate object (e.g. `{ "id": "homepage" }`), generate full block markup using the template patterns above.
- Write content that sounds authentic and specific. Reference the site's industry, audience, and tone from the original prompt. Avoid generic filler text.

# Page Builder Skill Specification

## ADDED Requirements

### Requirement: Block-Based Page Creation
The skill SHALL create WordPress pages using block-based content (Gutenberg blocks) via wp-cli.

#### Scenario: Create page with heading and paragraph blocks
- **WHEN** the skill creates an "About" page
- **THEN** it generates block markup with Heading and Paragraph blocks

#### Scenario: Create page with image block
- **WHEN** a page includes an image
- **THEN** the skill creates an Image block with appropriate src and alt attributes

### Requirement: Page Specification Input
The skill SHALL accept structured page specifications defining title, slug, content, and template.

#### Scenario: Create page from spec
- **WHEN** the skill receives {title: "About Us", slug: "about", content: "...", template: "default"}
- **THEN** it creates a WordPress page with those properties

#### Scenario: Auto-generate slug from title
- **WHEN** a page spec has title but no slug
- **THEN** the skill generates a slug by kebab-casing the title (e.g., "About Us" → "about-us")

### Requirement: Content Template System
The skill SHALL support content templates for common page types (homepage, about, contact, services).

#### Scenario: Use homepage template
- **WHEN** the skill creates a homepage using the "homepage" template
- **THEN** it generates a hero section, features section, and CTA

#### Scenario: Use contact template
- **WHEN** the skill creates a contact page using the "contact" template
- **THEN** it generates contact info blocks and a contact form shortcode

#### Scenario: Custom content overrides template
- **WHEN** a page spec provides custom content and a template
- **THEN** the custom content takes precedence

### Requirement: Post Creation
The skill SHALL create WordPress posts with title, content, excerpt, featured image, and categories.

#### Scenario: Create blog post
- **WHEN** the skill creates a blog post
- **THEN** it uses 'wp post create' with title and content

#### Scenario: Set post categories
- **WHEN** a post spec includes categories: ["Yoga", "Wellness"]
- **THEN** the skill assigns the post to those categories (creating them if needed)

#### Scenario: Set featured image
- **WHEN** a post spec includes a featured image path
- **THEN** the skill uploads the image and sets it as the post's featured image

### Requirement: Menu Configuration
The skill SHALL create navigation menus and assign them to theme locations.

#### Scenario: Create primary navigation menu
- **WHEN** the skill creates a primary menu
- **THEN** it executes 'wp menu create "Primary Menu"' and assigns it to the primary location

#### Scenario: Add pages to menu
- **WHEN** pages are created for Home, About, Services, Contact
- **THEN** the skill adds menu items for each page in order

#### Scenario: Add custom links to menu
- **WHEN** a menu requires external links
- **THEN** the skill adds custom URL menu items (e.g., link to social media)

### Requirement: Block Pattern Usage
The skill SHALL utilize block patterns for complex sections like testimonials, pricing tables, and FAQs.

#### Scenario: Insert testimonials pattern
- **WHEN** a page requires testimonials
- **THEN** the skill inserts a testimonials block pattern and populates it with content

#### Scenario: Insert pricing table pattern
- **WHEN** a page requires pricing information
- **THEN** the skill inserts a pricing block pattern with columns for each plan

### Requirement: Content Personalization
The skill SHALL replace placeholder content with site-specific information from the site spec.

#### Scenario: Replace business name placeholders
- **WHEN** a template contains [BUSINESS_NAME] and site spec includes businessName="Zen Yoga Studio"
- **THEN** all placeholders are replaced with "Zen Yoga Studio"

#### Scenario: Replace contact info placeholders
- **WHEN** a template contains [PHONE] and site spec includes phone="555-1234"
- **THEN** the placeholder is replaced with the phone number

### Requirement: Page Publication Status
The skill SHALL support creating pages as published, draft, or scheduled.

#### Scenario: Publish page immediately
- **WHEN** a page spec has status="publish"
- **THEN** the page is created and published immediately

#### Scenario: Create draft page
- **WHEN** a page spec has status="draft"
- **THEN** the page is created as a draft

### Requirement: Page Hierarchy
The skill SHALL support creating parent-child page relationships for nested navigation.

#### Scenario: Create child page
- **WHEN** a page spec has parent="Services"
- **THEN** the skill creates the page as a child of the Services page

#### Scenario: Create page hierarchy from spec
- **WHEN** page specs define a tree structure
- **THEN** the skill creates pages with correct parent-child relationships

### Requirement: Content Validation
The skill SHALL validate block markup before creating pages to prevent broken layouts.

#### Scenario: Validate block syntax
- **WHEN** block markup is generated
- **THEN** the skill verifies opening and closing block comments match

#### Scenario: Detect invalid block attributes
- **WHEN** block markup contains malformed JSON attributes
- **THEN** the skill raises a validation error

### Requirement: Media Upload
The skill SHALL upload media files (images, PDFs) to wp-content/uploads and reference them in content.

#### Scenario: Upload and insert image
- **WHEN** content references a local image file
- **THEN** the skill uploads it via 'wp media import' and inserts the media ID in the block

#### Scenario: Generate image alt text
- **WHEN** an image is uploaded without alt text
- **THEN** the skill generates descriptive alt text using the LLM

### Requirement: Shortcode Integration
The skill SHALL support inserting shortcodes for contact forms, galleries, and plugin features.

#### Scenario: Insert contact form shortcode
- **WHEN** a contact page requires a form
- **THEN** the skill inserts [contact-form-7 id="1"] or equivalent plugin shortcode

#### Scenario: Insert gallery shortcode
- **WHEN** a page requires an image gallery
- **THEN** the skill creates a gallery with uploaded images

### Requirement: SEO Metadata
The skill SHALL set SEO metadata for pages/posts if an SEO plugin is installed.

#### Scenario: Set meta description
- **WHEN** a page spec includes metaDescription
- **THEN** the skill sets the Yoast/RankMath meta description field

#### Scenario: Set focus keyword
- **WHEN** a page spec includes focusKeyword
- **THEN** the skill configures the SEO plugin's focus keyword

### Requirement: Bulk Page Creation
The skill SHALL support creating multiple pages concurrently to reduce build time.

#### Scenario: Create 10 pages in parallel
- **WHEN** the skill receives a list of 10 page specs
- **THEN** it creates them concurrently and waits for all to complete

#### Scenario: Handle partial failures
- **WHEN** 2 of 10 pages fail to create
- **THEN** the skill reports the failures and successfully creates the remaining 8

### Requirement: Page Template Assignment
The skill SHALL assign WordPress page templates to pages when needed.

#### Scenario: Assign full-width template
- **WHEN** a page spec requires template="full-width"
- **THEN** the skill sets the page template to "Full Width"

#### Scenario: Default template for unspecified
- **WHEN** no template is specified
- **THEN** the page uses the theme's default template

### Requirement: Content Revisions
The skill SHALL optionally disable or limit post revisions to reduce database size.

#### Scenario: Disable revisions for generated content
- **WHEN** pages are created by the skill
- **THEN** revisions are disabled (WP_POST_REVISIONS=false)

#### Scenario: Retain revisions for user editing
- **WHEN** configured to retain revisions
- **THEN** the skill allows WordPress to track changes

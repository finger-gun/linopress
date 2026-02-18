# Theme Generator Skill Specification

## ADDED Requirements

### Requirement: Three Theme Generation Modes
The skill SHALL support three theme generation modes: parent theme (default), blank block theme, and user-selected theme.

#### Scenario: Generate parent theme + child
- **WHEN** the skill is invoked with mode="parent"
- **THEN** it installs a curated parent theme and generates a child theme with custom styles

#### Scenario: Generate blank block theme
- **WHEN** the skill is invoked with mode="blank"
- **THEN** it generates a minimal block theme from scratch with theme.json

#### Scenario: Use user-selected theme
- **WHEN** the skill is invoked with mode="user-selected" and theme="minimalist-pro"
- **THEN** it installs the specified theme from WordPress.org

### Requirement: Parent Theme Selection
The skill SHALL select from 2-3 curated parent themes based on site requirements and style seed.

#### Scenario: Select parent theme based on style
- **WHEN** the style seed indicates "minimalist" aesthetic
- **THEN** the skill selects a clean, minimal parent theme

#### Scenario: Select parent theme based on site type
- **WHEN** the site is a blog
- **THEN** the skill selects a parent theme optimized for content reading

### Requirement: Child Theme Generation
The skill SHALL generate a child theme with style.css, functions.php, and custom templates when using parent theme mode.

#### Scenario: Create child theme structure
- **WHEN** a child theme is generated
- **THEN** the skill creates /wp-content/themes/child-theme/ with style.css and functions.php

#### Scenario: Child theme declares parent
- **WHEN** a child theme is created
- **THEN** style.css includes "Template: parent-theme-slug" header

#### Scenario: Child theme enqueues parent styles
- **WHEN** a child theme is created
- **THEN** functions.php enqueues the parent theme stylesheet

### Requirement: Blank Block Theme Generation
The skill SHALL generate a blank block theme with theme.json defining design tokens (colors, typography, spacing).

#### Scenario: Create theme.json with color palette
- **WHEN** a blank block theme is generated with a style seed
- **THEN** theme.json includes a color palette derived from the style seed

#### Scenario: Create theme.json with typography
- **WHEN** a blank block theme is generated
- **THEN** theme.json includes font families, sizes, and line heights

#### Scenario: Create theme.json with spacing scale
- **WHEN** a blank block theme is generated
- **THEN** theme.json includes a spacing scale (e.g., 10px, 20px, 40px, 80px)

### Requirement: Style Seed Integration
The skill SHALL use optional style seeds to guide theme customization with color schemes, typography, and design patterns.

#### Scenario: Apply color scheme from seed
- **WHEN** a style seed specifies colors: ["#2D3748", "#EDF2F7", "#48BB78"]
- **THEN** the theme uses these colors for primary, background, and accent

#### Scenario: Apply typography from seed
- **WHEN** a style seed specifies fonts: "Inter, Lora"
- **THEN** the theme configures Inter for headings and Lora for body text

#### Scenario: Generate theme without style seed
- **WHEN** no style seed is provided
- **THEN** the skill generates a theme with sensible default styles

### Requirement: Theme Validation
The skill SHALL validate generated themes to ensure they meet WordPress theme standards.

#### Scenario: Validate theme structure
- **WHEN** a theme is generated
- **THEN** the skill checks required files exist (style.css, index.php or templates/index.html for block themes)

#### Scenario: Validate theme headers
- **WHEN** a theme is generated
- **THEN** the skill verifies style.css contains required headers (Theme Name, Author, Version)

#### Scenario: Detect validation errors
- **WHEN** theme validation fails
- **THEN** the skill raises an error with details of missing or malformed files

### Requirement: Theme Activation
The skill SHALL activate the generated theme and verify it loads without errors.

#### Scenario: Activate child theme
- **WHEN** a child theme is generated successfully
- **THEN** the skill executes 'wp theme activate child-theme'

#### Scenario: Activate blank block theme
- **WHEN** a blank block theme is generated successfully
- **THEN** the skill activates it and verifies the homepage renders

#### Scenario: Detect activation errors
- **WHEN** theme activation fails due to PHP errors
- **THEN** the skill captures the error and attempts fallback to blank block theme

### Requirement: Fallback Strategy
The skill SHALL implement a fallback sequence: parent+child → blank block → user-selected → fail.

#### Scenario: Fallback to blank block on parent failure
- **WHEN** parent theme + child theme validation fails
- **THEN** the skill attempts to generate a blank block theme

#### Scenario: Fallback to default theme on all failures
- **WHEN** all generation modes fail
- **THEN** the skill activates a safe default theme (e.g., Twenty Twenty-Four) and reports failure

### Requirement: Block Patterns
The skill SHALL optionally include custom block patterns for common sections (hero, testimonials, pricing).

#### Scenario: Include hero pattern
- **WHEN** a theme is generated for a business site
- **THEN** the skill includes a hero block pattern with heading, subheading, and CTA button

#### Scenario: Include testimonials pattern
- **WHEN** a style seed requests testimonials
- **THEN** the skill generates a testimonials block pattern with quote, author, and image

#### Scenario: Include pricing pattern
- **WHEN** the site requires pricing tables
- **THEN** the skill generates a pricing block pattern with columns, features, and CTA

### Requirement: Custom Templates
The skill SHALL generate custom block templates for specific page types if using blank block theme mode.

#### Scenario: Generate homepage template
- **WHEN** a blank block theme is created
- **THEN** the skill creates templates/home.html with a structured homepage layout

#### Scenario: Generate single post template
- **WHEN** a blank block theme is created for a blog
- **THEN** the skill creates templates/single.html optimized for reading

### Requirement: Theme Screenshots
The skill SHALL optionally generate or download a theme screenshot for wp-admin display.

#### Scenario: Include default screenshot
- **WHEN** a theme is generated
- **THEN** the skill includes a generic screenshot.png in the theme directory

#### Scenario: Generate custom screenshot
- **WHEN** the browser tool is available
- **THEN** the skill captures a homepage screenshot and uses it as the theme screenshot

### Requirement: Theme Version Pinning
The skill SHALL pin parent theme versions in the manifest to prevent breaking changes from updates.

#### Scenario: Record parent theme version
- **WHEN** a child theme is generated with parent "minimal-pro" v2.4.1
- **THEN** the manifest records the parent theme and version

#### Scenario: Install pinned parent version
- **WHEN** restoring from an export bundle
- **THEN** the system installs the exact parent theme version specified in the manifest

### Requirement: RTL (Right-to-Left) Support
The skill SHALL optionally generate RTL styles for languages like Arabic and Hebrew.

#### Scenario: Generate RTL stylesheet
- **WHEN** a theme is generated with RTL support
- **THEN** the skill creates rtl.css with mirrored layout styles

#### Scenario: Skip RTL for LTR languages
- **WHEN** the site language is English
- **THEN** RTL stylesheet generation is skipped

### Requirement: Custom Fonts Loading
The skill SHALL support loading custom web fonts from Google Fonts or self-hosted sources.

#### Scenario: Load Google Fonts
- **WHEN** a style seed specifies fonts from Google Fonts
- **THEN** the theme enqueues the fonts using the Google Fonts API

#### Scenario: Self-host fonts
- **WHEN** configured for self-hosted fonts
- **THEN** the skill downloads font files to the theme and enqueues them locally

### Requirement: Theme Metadata
The skill SHALL set appropriate theme metadata in style.css including name, description, author, and version.

#### Scenario: Generated theme name
- **WHEN** a theme is generated for site "Yoga Studio"
- **THEN** the theme name is "Yoga Studio Custom Theme"

#### Scenario: Theme version and author
- **WHEN** a theme is generated
- **THEN** style.css includes Version: 1.0 and Author: Linopress

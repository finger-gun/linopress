# Site Spec Extractor Specification

## ADDED Requirements

### Requirement: Prompt-to-SiteSpec Extraction

The skill SHALL take a natural language prompt and produce a validated SiteSpec object with all required fields populated.

#### Scenario: Extract from descriptive prompt

- **WHEN** the user provides "Create a modern yoga studio website with pricing, schedule, testimonials, and contact form"
- **THEN** the skill produces a SiteSpec with appropriate pages (home, pricing, schedule, testimonials, contact), plugins (contact-form-7), and themeMode

#### Scenario: Extract from minimal prompt

- **WHEN** the user provides "Simple personal blog"
- **THEN** the skill produces a SiteSpec with sensible defaults (home page, blog posts enabled, default theme mode)

#### Scenario: Preserve explicit user choices

- **WHEN** the prompt specifies concrete choices (e.g., "use the flavor theme" or "no plugins")
- **THEN** the extracted SiteSpec reflects those choices exactly without overriding them

### Requirement: Default Inference

The skill SHALL infer reasonable defaults for fields not explicitly mentioned in the prompt.

#### Scenario: Default theme mode

- **WHEN** the prompt does not specify a theme preference
- **THEN** the skill defaults themeMode to 'parent'

#### Scenario: Default pages for business site

- **WHEN** the prompt describes a business (e.g., "restaurant website")
- **THEN** the skill infers common pages: home, about, menu/services, contact

#### Scenario: Default plugin selection

- **WHEN** the prompt mentions "contact form" but not a specific plugin
- **THEN** the skill selects from the curated plugin registry (e.g., contact-form-7)

### Requirement: SiteSpec Validation

The skill SHALL validate the extracted SiteSpec against the Zod schema before returning it.

#### Scenario: Valid extraction

- **WHEN** the LLM produces a well-formed SiteSpec
- **THEN** the skill validates it against siteSpecSchema and returns it

#### Scenario: Invalid extraction with recovery

- **WHEN** the LLM produces a SiteSpec with missing required fields
- **THEN** the skill fills in defaults for missing fields and re-validates

#### Scenario: Unrecoverable extraction failure

- **WHEN** the LLM fails to produce any usable structure
- **THEN** the skill returns a structured error explaining what could not be determined

### Requirement: Plugin Registry Constraint

The skill SHALL only include plugins from the curated plugin registry in the extracted SiteSpec.

#### Scenario: User requests known plugin

- **WHEN** the prompt mentions "SEO plugin"
- **THEN** the skill maps this to a registry plugin (e.g., wordpress-seo or seo-by-rank-math)

#### Scenario: User requests unknown plugin

- **WHEN** the prompt requests a plugin not in the registry
- **THEN** the skill omits it and includes a warning in the extraction result

### Requirement: Extraction Result

The skill SHALL return both the extracted SiteSpec and metadata about the extraction process.

#### Scenario: Return extraction result

- **WHEN** extraction completes
- **THEN** the skill returns {siteSpec: SiteSpec, warnings: string[], inferredDefaults: string[]}

#### Scenario: Report inferred fields

- **WHEN** the skill fills in default values
- **THEN** the inferredDefaults array lists which fields were not in the prompt and what values were chosen

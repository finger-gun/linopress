---
name: site-spec-extractor
description: Extract a structured SiteSpec from a natural language prompt with defaults, validation, and curated plugins only.
version: 0.1.0
minRuntime: 0.1.0
---

# Site Spec Extractor Skill

## Purpose

Convert a natural language prompt into a validated SiteSpec that downstream skills can consume.

## Curated Plugin Registry (initial)

- contact-form-7 (forms/contact)
- wpforms-lite (forms/contact)
- wordpress-seo (Yoast SEO)
- seo-by-rank-math (Rank Math)
- woocommerce
- woocommerce-payments (depends on woocommerce)

## Inputs

- prompt (string)
- siteId (string)
- allowUnknownPlugins (default false)

## Output

Return a JSON object with:

- siteSpec (SiteSpec)
- warnings (string[])
- inferredDefaults (string[])
- confidence (0.0 - 1.0)
- ambiguities (string[])

## Theme Mode Selection

Choose `themeMode` based on what the prompt asks for:

- **blank** -- Use when the prompt indicates a custom or unique design. Look for signals like:
  - "custom theme", "unique design", "from scratch", "original look"
  - "don't use an existing theme", "no parent theme", "fully custom"
  - Strong stylistic direction that goes beyond what a child theme can achieve (e.g., specific layouts, custom block patterns, detailed design systems)
  - When the `styleSeed` describes a distinctive visual identity that would be better served by a purpose-built theme.json with custom palettes, typography, and template structures
  - When in doubt between `parent` and `blank` and the prompt emphasizes design/branding, prefer `blank`
- **parent** -- Use when the prompt does not emphasize design uniqueness, or when speed/reliability is more important than a custom look. Good for straightforward sites where a child theme with CSS customizations is sufficient.
- **user-selected** -- Use only when the prompt explicitly names a WordPress theme slug (e.g., "use the flavor theme", "install flavor")

Default to `parent` only when the prompt gives no design-related signals at all.

## Workflow

1. Parse prompt for intent (site type, pages, features, style).
2. Build SiteSpec fields:
   - prompt (original)
   - siteId (input)
   - themeMode (parent | blank | user-selected) -- see Theme Mode Selection above
   - styleSeed (optional -- extract design tokens, colors, mood, and aesthetic from the prompt)
   - plugins (curated only)
   - pages (PageSpec list)
   - language (default en_US)
   - timezone (default UTC)
   - permalinkStructure (default /%postname%/)
   - business (name required when available; include phone/email/address if present)
3. Infer defaults when missing:
   - themeMode: see Theme Mode Selection above (default parent only when no design signals)
   - language: en_US
   - timezone: UTC
   - permalinkStructure: /%postname%/
   - pages: infer standard pages based on business type
     Record each default in inferredDefaults.
4. Enforce curated plugins:
   - If a requested plugin is not in registry, omit it and add a warning.
   - If allowUnknownPlugins=true, include but warn.
5. Validate:
   - Validate the SiteSpec against the Zod schema.
   - If validation fails, fill missing fields with defaults and retry.
6. Ambiguity handling:
   - If the prompt is underspecified (e.g., missing business name and no clear domain), add to ambiguities.
   - Set confidence low (<= 0.4) when ambiguities remain.
   - If required fields cannot be inferred, return an error object:
     { error: { message, ambiguities } }

## Example Output (parent mode -- no strong design signals)

```json
{
  "siteSpec": {
    "prompt": "Create a modern yoga studio website with pricing, schedule, testimonials, and contact form",
    "siteId": "yoga-studio",
    "themeMode": "parent",
    "styleSeed": "modern calm neutrals",
    "plugins": ["contact-form-7"],
    "pages": [
      { "title": "Home", "slug": "home", "content": { "id": "homepage" } },
      { "title": "Pricing", "slug": "pricing", "content": { "id": "pricing" } },
      { "title": "Schedule", "slug": "schedule", "content": { "id": "services" } },
      { "title": "Testimonials", "slug": "testimonials", "content": { "id": "testimonials" } },
      { "title": "Contact", "slug": "contact", "content": { "id": "contact" } }
    ],
    "language": "en_US",
    "timezone": "UTC",
    "permalinkStructure": "/%postname%/",
    "business": {
      "name": "Yoga Studio"
    }
  },
  "warnings": [],
  "inferredDefaults": [
    "themeMode=parent",
    "language=en_US",
    "timezone=UTC",
    "permalinkStructure=/%postname%/"
  ],
  "confidence": 0.72,
  "ambiguities": []
}
```

## Example Output (blank mode -- strong design/branding signals)

```json
{
  "siteSpec": {
    "prompt": "Build a bold, dark-themed motorcycle shop website with an industrial aesthetic. Custom design with heavy typography and a gritty feel.",
    "siteId": "motorcycle-shop",
    "themeMode": "blank",
    "styleSeed": "dark industrial bold heavy-typography gritty matte-black orange-accents",
    "plugins": ["contact-form-7"],
    "pages": [
      { "title": "Home", "slug": "home", "content": { "id": "homepage" } },
      { "title": "Our Bikes", "slug": "our-bikes", "content": { "id": "gallery" } },
      { "title": "About Us", "slug": "about-us", "content": { "id": "about" } },
      { "title": "Contact", "slug": "contact", "content": { "id": "contact" } }
    ],
    "language": "en_US",
    "timezone": "UTC",
    "permalinkStructure": "/%postname%/",
    "business": {
      "name": "Motorcycle Shop",
      "description": "Harley-Davidson dealer with a custom-built web presence"
    }
  },
  "warnings": [],
  "inferredDefaults": ["language=en_US", "timezone=UTC", "permalinkStructure=/%postname%/"],
  "confidence": 0.82,
  "ambiguities": []
}
```

## Error Handling

- If the prompt is ambiguous or missing required fields, return an error with ambiguities.
- Do not guess plugin slugs outside the curated registry without warning.

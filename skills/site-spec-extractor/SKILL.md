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

## Workflow

1. Parse prompt for intent (site type, pages, features, style).
2. Build SiteSpec fields:
   - prompt (original)
   - siteId (input)
   - themeMode (parent | blank | user-selected)
   - styleSeed (optional)
   - plugins (curated only)
   - pages (PageSpec list)
   - language (default en_US)
   - timezone (default UTC)
   - permalinkStructure (default /%postname%/)
   - business (name required when available; include phone/email/address if present)
3. Infer defaults when missing:
   - themeMode: parent
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

## Example Output

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

## Error Handling

- If the prompt is ambiguous or missing required fields, return an error with ambiguities.
- Do not guess plugin slugs outside the curated registry without warning.

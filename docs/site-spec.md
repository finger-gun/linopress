# SiteSpec Format

SiteSpec is the deterministic input for builds.

## Fields

- `prompt` (string, required): Original natural language prompt.
- `siteId` (string, required): Unique identifier for the site stack.
- `themeMode` ("parent" | "blank" | "user-selected", required)
- `styleSeed` (string, optional)
- `plugins` (string[], optional)
- `pages` (PageSpec[], optional)
- `language` (string, optional)
- `timezone` (string, optional)
- `permalinkStructure` (string, optional)
- `business` (object, optional)

PageSpec:

- `title` (string, required)
- `slug` (string, required)
- `content` (string | ContentTemplate, required)
- `template` (string, optional)
- `status` ("publish" | "draft" | "private" | "scheduled", optional)
- `parentSlug` (string, optional)

Business:

- `name` (string, required)
- `tagline`, `description`, `phone`, `email`, `address`, `hours` (optional)

## Example

```json
{
  "prompt": "Create a modern yoga studio website",
  "siteId": "yoga-studio",
  "themeMode": "parent",
  "styleSeed": "calm neutrals",
  "plugins": ["contact-form-7"],
  "pages": [
    { "title": "Home", "slug": "home", "content": { "id": "homepage" } },
    { "title": "Contact", "slug": "contact", "content": { "id": "contact" } }
  ],
  "language": "en_US",
  "timezone": "UTC",
  "permalinkStructure": "/%postname%/",
  "business": {
    "name": "Zen Yoga Studio",
    "tagline": "Move well. Live well.",
    "email": "hello@zenyoga.com"
  }
}
```

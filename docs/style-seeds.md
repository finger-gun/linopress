# Style Seeds

Style seeds are small JSON documents that describe colors, typography, and spacing.

## Schema

See `schemas/style-seed.schema.json` for the full schema.

## Examples

- `schemas/style-seeds/minimalist.json`
- `schemas/style-seeds/bold.json`
- `schemas/style-seeds/elegant.json`

## Example

```json
{
  "name": "Minimalist",
  "colors": {
    "primary": "#1F2933",
    "background": "#F8FAFC",
    "text": "#111827"
  },
  "typography": {
    "headingFont": "Playfair Display",
    "bodyFont": "Source Sans 3"
  },
  "spacing": {
    "base": 8,
    "md": 16,
    "lg": 32,
    "xl": 56
  }
}
```

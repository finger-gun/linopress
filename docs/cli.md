# CLI Usage

## Commands

```bash
linopress provision <site-id> [--port 8080] [--browser]
linopress start <site-id>
linopress stop <site-id>
linopress destroy <site-id>
linopress build <site-id> [--prompt "..."] [--spec path.json] [--port 8080] [--browser] [--no-browser] [--no-heal] [--timeout ms]
```

## Build Examples

```bash
linopress build yoga-studio --prompt "Create a modern yoga studio website with pricing, schedule, testimonials, and contact form" --port 8080 --browser
```

```bash
linopress build yoga-studio --spec ./site-spec.json --port 8080
```

## Notes

- Use `--spec` for deterministic builds from a SiteSpec JSON.
- Use `--prompt` to let the SiteSpec extractor generate a spec.
- `--browser` provisions the browser container for smoke tests.

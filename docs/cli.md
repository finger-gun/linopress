# CLI Usage

## Commands

```bash
linopress provision <site-id> [--port 8080] [--browser]
linopress start <site-id>
linopress stop <site-id>
linopress destroy <site-id>
linopress build <site-id> [--prompt "..."] [--spec path.json] [--port 8080] [--base-url http://...] [--browser] [--no-browser] [--review] [--no-review] [--review-cycles N] [--max-review-pages N] [--no-heal] [--heal-cycles N] [--yolo] [--timeout ms] [--skill-timeout ms]
linopress selfimprove [--site <site-id>] [--base-url http://...] [--creativeness 1-5] [--aggressive]
```

## Build Examples

```bash
linopress build yoga-studio --prompt "Create a modern yoga studio website with pricing, schedule, testimonials, and contact form" --port 8080 --browser
```

```bash
linopress build yoga-studio --spec ./site-spec.json --port 8080
```

```bash
linopress build book-author --prompt "Create a playful children's book author site" --review --review-cycles 2 --browser
```

## Selfimprove Examples

```bash
linopress selfimprove --site yoga-studio
```

```bash
linopress selfimprove --site yoga-studio --creativeness 5
```

## Flags (build)

- `--prompt "..."` Generate a SiteSpec from natural language.
- `--spec path.json` Use a SiteSpec JSON (skips prompt extraction).
- `--port 8080` Port to expose WordPress (default set in stack env).
- `--base-url http://...` Override the base URL used during build.
- `--browser` Enable browser container for visual validation.
- `--no-browser` Disable browser validation even if the stack has a browser.
- `--review` Enable visual review cycles using screenshots.
- `--no-review` Disable visual review even if defaults enable it.
- `--review-cycles N` Limit review iterations (default 2).
- `--max-review-pages N` Limit number of pages/screenshots sent to the reviewer.
- `--no-heal` Disable self-healing cycles.
- `--heal-cycles N` Limit self-healing iterations (default 2).
- `--yolo` Relax some safety checks for faster iteration.
- `--timeout ms` Global build timeout in milliseconds.
- `--skill-timeout ms` Per-skill execution timeout in milliseconds.

## Flags (all commands)

- `--site <site-id>` Alternative way to pass the site id.
- `--help` or `-h` Show usage.

## Flags (selfimprove)

- `--creativeness 1-5` Controls how aggressive the improvement loop is (default 4).
- `--aggressive` Shortcut for `--creativeness 5`.

## Notes

- Use `--spec` for deterministic builds from a SiteSpec JSON.
- Use `--prompt` to let the SiteSpec extractor generate a spec.
- `--browser` provisions the browser container for smoke tests.
- `--review` adds a visual QA pass that can fix content and navigation issues.

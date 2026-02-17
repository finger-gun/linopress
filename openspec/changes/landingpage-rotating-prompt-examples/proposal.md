## Why

The landing page currently shows a single static example prompt, which limits how effectively it communicates Linopress's range of use cases. Rotating through multiple realistic prompt examples will better demonstrate product breadth and improve first-impression clarity.

## What Changes

- Update the landing page prompt example UI to rotate through a curated set of example prompts automatically.
- Ensure the rotation is readable and non-disruptive (predictable timing and smooth transition).
- Keep the prompt examples deterministic in source (fixed list in code/content, no external fetch).
- Preserve accessibility by avoiding rapid motion and ensuring content remains legible during transitions.

## Capabilities

### New Capabilities
- `rotating-prompt-examples`: Adds support for cycling multiple hero prompt examples on the marketing landing page.

### Modified Capabilities
- None.

## Impact

- Affected code: `landingpage/index.html`, `landingpage/styles.css`, and any associated client-side script used by the landing page.
- UX impact: richer demonstration of supported prompt styles and business scenarios.
- Dependencies: no new runtime dependencies required; implement with existing web platform features.
- Security/sandbox: no change to trust boundaries; remains static client-side behavior with no external network calls.

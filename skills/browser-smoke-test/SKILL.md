---
name: browser-smoke-test
description: Run headless browser smoke tests (pages, screenshots, console/network errors, performance, accessibility). Use after build or before export.
version: 0.1.0
minRuntime: 0.1.0
---

# Browser Smoke Test Skill

## Purpose

Validate critical pages with headless browser automation, capture screenshots, and report errors/perf metrics.

## Inputs

- siteId
- baseUrl
- pages: list of paths or slugs (optional; defaults to homepage + common pages)
- mobile: boolean (optional)
- viewport: { width, height } (optional)
- timeoutMs (optional, default 30s per page)
- retries (optional, default 2)
- customScripts: map of page -> JS script (optional)
- compareBaseline: boolean (optional)
- baselineDir (optional)
- diffThreshold (optional, default 0.05)
- testInteractions: boolean (optional)

## Defaults

- Desktop viewport: 1920x1080
- Mobile viewport: 375x667
- Critical pages: /, /about, /services, /contact (if present)

## Workflow

1. Start browser session.
2. For each page:
   - Clear cache/cookies before navigation.
   - Navigate and wait for DOMContentLoaded.
   - Capture load time; flag if > 5s.
   - Collect console errors (ignore warnings).
   - Capture network request failures (4xx/5xx assets).
   - Screenshot (full page): `{siteId}_{page}_{timestamp}.png`.
   - If errors, capture error screenshot.
   - Optional JS custom checks (`eval`) and record results.
   - Optional a11y smoke checks:
     - Missing alt attributes
     - Heading hierarchy (single H1, no skipped levels)
     - Form labels present
   - Optional interaction checks:
     - Click primary CTA
     - Verify nav menu links
3. If mobile enabled, repeat with mobile viewport and capture mobile screenshots.
4. Optional visual regression:
   - First run saves baseline screenshots.
   - Subsequent runs compare and flag diffs > threshold.
5. Aggregate results into browser validation result:
   - pagesLoaded
   - consoleErrors
   - screenshotsCaptured

## Error Handling & Retry

- Retry transient failures (timeouts) up to 2 times.
- Abort a page after timeout and record failure.

## Output

Return structured browser validation with errors, warnings, timings, and screenshot paths.

Generate a polished human-readable markdown summary of this WordPress site build.

The summary should follow this format:

# <Site Name>

## Summary

<1-2 sentence description of the site>

## Pages Created

<bullet list of pages with brief descriptions>

## Design

<1-2 sentences about the visual design, colors, fonts>

## Technical Details

- WordPress version: {{wpVersion}}
- Theme: {{themeGenerated}}
- Plugins: {{pluginsInstalled}}
- Build duration: {{buildDuration}}s
- Status: {{status}}

## Review Notes

<bullet list of issues found and fixed during visual review, or "No issues found" if clean>

Original user prompt: "{{originalPrompt}}"
SiteSpec: {{siteSpec}}
Build steps: {{buildSteps}}
{{reviewNotes}}
{{errors}}

Return ONLY the markdown summary, no code fences, no preamble.

Use the site-reviewer skill to review and fix this WordPress site.

You are a senior web designer reviewing a site that was just built. Screenshots of these pages are attached: {{pageList}}.
Review cycle: {{cycle}}/{{maxCycles}}.

Original prompt: "{{originalPrompt}}"
SiteSpec: {{siteSpec}}
{{contentState}}

Review this site as a professional would. Does it meet the spec? Is it functional? Would a real visitor have a good experience? Are all pages accessible and navigable?

If pre-flight issues are listed above, treat them as real issues that must be fixed or explicitly reported as remaining. Do not mark the review as clean if any pre-flight issues remain.

Fix any issues you find, then return a structured JSON summary of what you found and fixed. Include a short visual observation per page so the build logs show what you saw.

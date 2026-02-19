Use the site-reviewer skill to review and fix this WordPress site.

You are a senior web designer reviewing a live site. Screenshots of these pages are attached: {{pageList}}.
Review cycle: {{cycle}}/{{maxCycles}}.
Creativeness: {{creativeness}} (1-5). Higher values may apply bolder fixes within safety limits.

{{contentState}}

Perform a multi-perspective review across design, content, and structure.
Use visual inspection and structural analysis findings from wp-cli data above.

Fix any issues you find, then return a structured JSON summary of what you found and fixed.
Include a short visual observation per page so the logs show what you saw.

Return ONLY JSON:
{
"status": "reviewed",
"issuesFound": 0,
"issuesFixed": 0,
"remainingIssues": ["..."],
"pagesReviewed": ["home"],
"observations": [{"page": "home", "summary": "..."}],
"actions": [{"page": "home", "issue": "...", "fix": "..."}],
"findings": {
"design": ["..."],
"content": ["..."],
"structure": ["..."]
}
}

## Context

Build currently accepts a prompt and/or SiteSpec JSON, but has no structured way to accept visual inspiration. The change introduces optional image inputs, passed via CLI flags, that are supplied to vision-capable agents during generation. This must fit existing Node/TS + Sisu orchestration, preserve the sandbox model, and keep file access limited to local, allowlisted paths.

Component diagram (text):

CLI (linopress build --images)
-> Input resolver (prompt, SiteSpec, images)
-> Build orchestration
-> Agent API (Sisu skills)
-> Vision-capable model
-> File tool (image read)
-> Report/manifest writer (BuildReport)

Data models (existing, referenced by this change):

SiteSpec

- id: string
- stackName: string
- baseUrl: string
- wpContentPath: string
- status: "running" | "stopped"

BuildReport

- siteId: string
- startedAt: string
- completedAt?: string
- status: "success" | "partial" | "failed"
- steps: { id: string, status: string, summary?: string }[]
- issues: { id: string, severity: string, message: string }[]
- improvements: { id: string, summary: string, applied: boolean }[]
- artifacts: { id: string, path: string }[]

## Goals / Non-Goals

**Goals:**

- Accept one or more local image paths (files or directories) in the CLI build command.
- Validate and normalize image inputs into a build request payload for the agent.
- Ensure vision-capable agents can access the images without expanding tool permissions.
- Record image inputs in build reports/manifests for traceability.

**Non-Goals:**

- Remote URL image fetching or external browsing.
- Changes to the sandbox model or file system access scope beyond specific image paths.
- Defining UI or API upload flows (future work).

## Decisions

1. CLI flag design for images

- Decision: Add a repeatable `--images` flag that accepts a file path or directory path; directories are expanded to supported image files.
- Rationale: Simple CLI UX that scales to multiple inputs.
- Alternatives: JSON array flag or `--image` per file (rejected for verbosity).

2. Input validation and normalization

- Decision: At CLI boundary, resolve image inputs to a canonical list of local files (png/jpg/jpeg/webp), de-duplicate, and fail fast on unreadable paths.
- Rationale: Deterministic behavior and clear errors before any agent work.
- Alternatives: Lazy validation inside the agent (rejected due to unclear failure modes).

3. Passing images into agent context

- Decision: Extend the build request payload to include `inspirationImages` as file references that the agent can read using existing file tool permissions.
- Rationale: Keeps agent context explicit and auditable.
- Alternatives: Embedding base64 in prompt (rejected for token cost and logging risk).

4. Tool and URL allowlists

- Decision: Keep tool allowlist unchanged; allow file-tool access only to the explicit image file list (or a temporary staging directory created by the CLI). Keep URL allowlist unchanged (local WordPress only).
- Rationale: Avoids expanding security posture.
- Alternatives: Global filesystem access (rejected).

5. Self-healing loop and fallback policy

- Decision: Self-healing loop remains unchanged; image inputs are guidance only. If image inputs are invalid or missing, fall back to prompt/SiteSpec only and record the condition in the report.
- Rationale: Prevents builds from failing when image inputs are optional.

## Risks / Trade-offs

- [Risk] Large image sets increase token or processing cost → Mitigation: set a max count and size limit, and warn when trimming.
- [Risk] Images contain sensitive content → Mitigation: keep images local, avoid logging raw image data, and include only paths in reports.
- [Risk] Directory globbing could pick up non-images → Mitigation: strict extension filter and explicit validation.

## Migration Plan

- Add CLI flags and input resolver updates.
- Update build request schema and agent orchestration to pass image references.
- Update report/manifest to include inspiration image metadata (paths or hashes).
- Rollback: remove the CLI flag and ignore image fields in the request payload.

## Open Questions

- Should we cap images by count, total size, or both, and what are the defaults?
- Do we need to copy images into a temp workspace to enforce access boundaries?

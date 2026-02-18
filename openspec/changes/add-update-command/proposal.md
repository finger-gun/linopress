## Why

The build CLI produces a one-shot site, but users cannot iterate when they want changes. Adding an update flow enables fast refinement without restarting from scratch.

## What Changes

- Goals: enable iterative site edits after an initial build using natural-language change prompts while preserving deterministic, reproducible outputs.
- Non-goals: real-time collaborative editing, unrestricted external browsing, or hosting/multisite management.
- Introduce a new CLI command (name TBD, e.g., `linopress update`) that targets an existing build and applies a user-specified change request.
- Support changes like layout tweaks, color updates, navigation adjustments, and adding new pages/content through the update flow.
- Capture and report update outcomes similarly to build results so users can trust and reproduce changes.
- Execute updates via explicit phases (analyze → plan → apply → review) to avoid no-op runs.
- Require at least one write during apply or surface a structured no-change failure.

## Capabilities

### New Capabilities

- `update-command`: CLI-driven, iterative modification workflow for an existing site build, applying user prompts to update design and content.

### Modified Capabilities

## Impact

- Affected systems: CLI interface, build/update orchestration, skill invocation for content/theme changes, and BuildReport output.
- New control-flow middleware in the agent runtime to enforce update phases and review loops.
- Security constraints: tool-allowlisted execution only, no external navigation, and no secrets in logs or outputs.
- Sandbox model: one site per isolated sandbox; updates run inside the existing site stack and may only touch its mounted wp-content and DB.
- Success criteria (demo): run `linopress build --prompt "Create a yoga studio site"`, then run the update command with "Change the background to white and center the navigation" and see the updated site validated via CLI + browser smoke test with an updated report.

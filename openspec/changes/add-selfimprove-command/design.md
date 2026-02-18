## Context

Build already runs a validation + self-healing loop, including agent-browser feedback and improvement attempts, but that flow is only reachable through `linopress build`. We are introducing `linopress selfimprove` as a standalone CLI entry point that reuses the same pipeline with an optionally more aggressive improvement mode. The change must respect existing sandbox and allowlist rules and fit the current Node/TypeScript + Sisu runtime model.

Component diagram (text):

CLI (linopress selfimprove)
-> Site selector (stack discovery, --site gate)
-> SelfImprove orchestrator (build reuse)
-> Agent API (Sisu skills)
-> Browser tool (agent-browser)
-> WP tool/file tool (wp-cli + filesystem)
-> Report writer (BuildReport)

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

- Provide `linopress selfimprove` as a standalone CLI command that runs the existing validation + self-improvement loop.
- Enforce site selection rules: auto-select when exactly one stack exists; require `--site` when multiple exist.
- Allow a more aggressive mode without expanding safety boundaries or tool permissions.
- Produce the same style of report output as build for traceability.

**Non-Goals:**

- Changing the default behavior of `linopress build`.
- Expanding browser or tool allowlists beyond current build rules.
- Adding multi-site management, scheduling, or hosting features.

## Decisions

1. Reuse build pipeline with a new entry point

- Decision: Implement `selfimprove` as a CLI command that calls the same orchestrator used during build, with a mode flag (e.g., `mode: "selfimprove"`) and optional aggressiveness toggle.
- Rationale: Minimizes duplication and ensures behavior parity with build.
- Alternatives: Implement an independent pipeline (rejected due to drift and maintenance cost).

2. Site selection guardrails at CLI boundary

- Decision: Resolve the target site before starting any improvement steps. If multiple stacks are found, require `--site` and exit with a clear error.
- Rationale: Avoids accidental modification of the wrong site.
- Alternatives: Prompt interactively (rejected for deterministic CLI behavior).

3. Aggressive mode as configuration, not new tools

- Decision: Aggressiveness adjusts existing loop parameters (e.g., stricter score threshold or an additional improvement attempt) while retaining max cycle limits.
- Rationale: Keeps safety constraints intact and avoids new risk surface.
- Alternatives: Adding new tools or external browsing (rejected due to security constraints).

4. Preserve sandbox and allowlists

- Decision: Keep the same tool allowlist and URL allowlist as build.
- Tool allowlist: wp-cli, file-tool (wp-content scoped), browser-tool (agent-browser), build/report utilities.
- URL allowlist: only the local WordPress base URL for the selected stack.
- Rationale: Maintains existing security posture and deterministic execution.

5. Self-healing loop and fallback policy

- Decision: Use the same self-healing loop as build with <=2 cycles, stop on no-op, and always emit a report.
- Fallback policy: if an improvement step fails validation or crashes the agent, halt and keep the last known good state; do not attempt broader changes such as theme regeneration beyond existing policies (including blank->parent fallback where already used in build flows).
- Rationale: Consistent behavior and predictable failure modes.

## Risks / Trade-offs

- [Risk] More aggressive settings could overfit to agent feedback and create churn → Mitigation: cap cycles, stop on no-op, and require validation pass before applying changes.
- [Risk] Ambiguous site selection in multi-stack environments → Mitigation: require `--site` and show the available site ids.
- [Risk] Reusing build pipeline could surface build-only assumptions → Mitigation: add an explicit mode flag and branch only where necessary.

## Migration Plan

- Add the new CLI command and wire it to the existing orchestrator with a selfimprove mode.
- Release with no data migrations; existing stacks remain unchanged unless the command is run.
- Rollback: remove the CLI command entry and disable the selfimprove mode flag.

## Open Questions

- What should the default aggressiveness be (same as build, or one additional cycle)?
- Should `selfimprove` accept a `--report <path>` override or reuse build defaults only?

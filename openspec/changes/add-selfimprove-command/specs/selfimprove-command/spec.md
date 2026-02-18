## ADDED Requirements

### Requirement: Provide a selfimprove CLI command

The system SHALL expose a `linopress selfimprove` command that runs the self-review and improvement loop against an existing site stack.

#### Scenario: Selfimprove command executes

- **WHEN** the user runs `linopress selfimprove` with a valid target site
- **THEN** the system runs the review and improvement loop and emits a report

### Requirement: Enforce deterministic site selection

The system SHALL resolve the target site using the following rules: if exactly one site stack exists, it MUST auto-select that site; if more than one site stack exists, it MUST require `--site <id>` and exit with an error when missing.

#### Scenario: Single site auto-selected

- **WHEN** exactly one site stack exists and the user runs `linopress selfimprove` without `--site`
- **THEN** the system selects that site and proceeds

#### Scenario: Multiple sites require flag

- **WHEN** more than one site stack exists and the user runs `linopress selfimprove` without `--site`
- **THEN** the system exits with an error instructing the user to supply `--site <id>`

### Requirement: Support an aggressive improvement mode

The system SHALL allow a more aggressive improvement mode that increases the strictness of the loop (for example by tightening acceptance thresholds or adding one additional improvement cycle) without exceeding existing safety limits.

#### Scenario: Aggressive mode enabled

- **WHEN** the user enables aggressive mode for `linopress selfimprove`
- **THEN** the system applies the stricter improvement configuration while keeping the same safety caps

### Requirement: Preserve existing safety boundaries

The system MUST keep the same tool allowlist and URL allowlist as the build flow for selfimprove execution.

#### Scenario: External navigation not allowed

- **WHEN** selfimprove attempts to access a URL outside the local WordPress base URL
- **THEN** the system blocks the navigation and records the failure in the report

### Requirement: Always produce a selfimprove report

The system SHALL emit a report that summarizes review findings, attempted improvements, and their outcomes for each selfimprove run.

#### Scenario: Report on completion

- **WHEN** the selfimprove loop completes
- **THEN** the system outputs a report that includes findings and applied improvements

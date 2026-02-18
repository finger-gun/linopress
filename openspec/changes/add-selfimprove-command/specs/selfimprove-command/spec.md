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

### Requirement: Support creativeness control

The system SHALL accept a `--creativeness <1-5>` setting for `linopress selfimprove` where higher values allow the agent to take more liberties in its improvement attempts and may increase improvement cycles or adjust acceptance thresholds, without exceeding existing safety limits. The default creativeness MUST be 4 and more aggressive than the build flow default.

#### Scenario: Creativeness provided

- **WHEN** the user runs `linopress selfimprove --creativeness 5`
- **THEN** the system allows the agent to apply the most creative improvements allowed by safety caps

#### Scenario: Creativeness default

- **WHEN** the user runs `linopress selfimprove` without `--creativeness`
- **THEN** the system applies a default creativeness of 4, which is more aggressive than the build flow

### Requirement: Perform multi-perspective review before improvements

The system SHALL perform a review pass that assesses the site from design, content, and structure perspectives, using both visual inspection and structural analysis (e.g., via wp-cli), and produce a list of candidate improvements.

#### Scenario: Review pass generates findings

- **WHEN** the selfimprove loop begins
- **THEN** the system produces categorized findings for design, content, and structure

### Requirement: Execute improvements based on findings

The system SHALL pass the review findings to the improvement phase so that the agent applies fixes that address the identified issues.

#### Scenario: Improvement phase targets findings

- **WHEN** the review pass completes
- **THEN** the improvement phase attempts fixes that map to the listed findings

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

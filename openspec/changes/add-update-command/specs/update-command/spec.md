## ADDED Requirements

### Requirement: Update command interface

The system SHALL provide a CLI command to apply a change prompt to an existing site build.

#### Scenario: Update via CLI prompt

- **WHEN** the user runs `linopress update --prompt "Change the background to white"` and only one site stack exists
- **THEN** the system defaults to that site and begins the update pipeline

#### Scenario: Update with explicit site selection

- **WHEN** the user runs `linopress update --site <site-id> --prompt "Change the background to white"`
- **THEN** the system targets the specified site and begins the update pipeline

### Requirement: Update request validation

The system SHALL validate update inputs before any changes are applied.

#### Scenario: Missing site identifier with multiple stacks

- **WHEN** the user runs the update command without a site identifier and multiple site stacks exist
- **THEN** the system rejects the request with a structured validation error and performs no changes

### Requirement: Scoped update execution

The system SHALL run updates within the existing site sandbox and only modify its mounted WordPress content and database.

#### Scenario: Update stays within sandbox

- **WHEN** an update is executed for a site
- **THEN** changes are limited to the target site's containers, wp-content volume, and database

### Requirement: Tool allowlist enforcement

The system MUST restrict update execution to allowlisted tools and skills only.

#### Scenario: Disallowed tool usage

- **WHEN** an update attempt tries to invoke a non-allowlisted tool
- **THEN** the system blocks the invocation and fails the update with a report entry

### Requirement: Update orchestration and validation

The system SHALL orchestrate an update pipeline that applies the change prompt, then runs CLI validation and browser smoke tests.

#### Scenario: Successful update validation

- **WHEN** the update prompt is applied and both validation steps pass
- **THEN** the system marks the update successful and produces a report

### Requirement: Update self-healing loop

The system SHALL attempt self-healing for failed validations up to two cycles during update.

#### Scenario: Update validation fails, healing succeeds

- **WHEN** update validation fails
- **THEN** the system runs self-healing (max two cycles) and re-validates after each cycle

### Requirement: Update reporting and export

The system SHALL generate a BuildReport for update runs and MAY create a new export bundle upon success.

#### Scenario: Successful update report

- **WHEN** an update completes
- **THEN** the system emits a report that includes status, steps, validations, and any healing cycles

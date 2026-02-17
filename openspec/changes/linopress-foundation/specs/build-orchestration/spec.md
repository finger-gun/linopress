# Build Orchestration Specification

## ADDED Requirements

### Requirement: Build Pipeline Orchestration

The system SHALL execute a deterministic build pipeline given a validated SiteSpec, invoking skills in the correct sequence with proper dependency ordering.

#### Scenario: Full successful build

- **WHEN** a valid SiteSpec is submitted
- **THEN** the system executes the following steps in order: provision stack, install WordPress, install plugins, generate theme, create pages/content, validate (CLI + browser), and export bundle

#### Scenario: Build with healing

- **WHEN** validation fails after initial build
- **THEN** the system invokes self-healing (up to 2 cycles), re-validates after each cycle, and proceeds to export if validation passes

#### Scenario: Build fails after max healing cycles

- **WHEN** validation still fails after 2 healing cycles
- **THEN** the system halts the build and produces a failure BuildReport with all error details, screenshots, and healing cycle logs

### Requirement: SiteSpec Validation

The system SHALL validate SiteSpec input against the Zod schema before starting the build pipeline.

#### Scenario: Valid SiteSpec

- **WHEN** a well-formed SiteSpec is submitted with required fields (prompt, siteId, themeMode)
- **THEN** the system accepts the spec and begins the build pipeline

#### Scenario: Invalid SiteSpec

- **WHEN** a SiteSpec is missing required fields or has invalid types
- **THEN** the system rejects the spec with a structured validation error before provisioning any resources

### Requirement: Build Step Sequencing

The system SHALL enforce correct ordering of build steps based on skill dependencies.

#### Scenario: WordPress must be installed before plugins

- **WHEN** the build pipeline reaches the plugin installation step
- **THEN** WordPress core installation has already completed successfully

#### Scenario: Theme must be generated before content

- **WHEN** the build pipeline reaches the page creation step
- **THEN** the theme has been generated and activated

#### Scenario: Validation runs after all content is created

- **WHEN** all pages, menus, and content have been created
- **THEN** the system runs CLI validation followed by browser smoke tests

### Requirement: Validation and Healing Loop

The system SHALL integrate the validation and self-healing loop as a core build phase, not an optional step.

#### Scenario: Validation passes on first attempt

- **WHEN** both CLI validation and browser smoke tests pass
- **THEN** the system proceeds directly to export without invoking self-healing

#### Scenario: Validation fails, healing succeeds

- **WHEN** validation fails and self-healing resolves all issues within 2 cycles
- **THEN** the system proceeds to export with the healing cycles recorded in the BuildReport

#### Scenario: Partial validation failure

- **WHEN** only non-critical validation checks fail (warnings, not errors)
- **THEN** the system proceeds to export with status 'partial' and warnings in the BuildReport

### Requirement: Export Triggering

The system SHALL automatically trigger the export bundle skill upon successful validation.

#### Scenario: Automatic export after validation

- **WHEN** validation passes (or passes after healing)
- **THEN** the system invokes the export-bundle skill to create a portable bundle

#### Scenario: No export on critical failure

- **WHEN** the build fails validation completely and healing is exhausted
- **THEN** no export bundle is created, but the BuildReport is still generated

### Requirement: BuildReport Generation

The system SHALL produce a complete BuildReport at the end of every build, regardless of outcome.

#### Scenario: Successful build report

- **WHEN** a build completes successfully
- **THEN** the BuildReport includes status 'success', all build steps, validation results, screenshots, export bundle path, and metadata

#### Scenario: Failed build report

- **WHEN** a build fails
- **THEN** the BuildReport includes status 'failed', all completed steps, error logs, healing cycle details, and any partial screenshots

#### Scenario: Build report timing

- **WHEN** a BuildReport is generated
- **THEN** it includes accurate startTime, endTime, and duration metadata

### Requirement: Build Progress Tracking

The system SHALL track and report progress during the build pipeline for observability.

#### Scenario: Step completion logging

- **WHEN** a build step completes (success or failure)
- **THEN** the system logs the step name, status, and duration

#### Scenario: Real-time progress

- **WHEN** a long-running build is in progress
- **THEN** the system provides current step information and overall progress

### Requirement: Build Timeout

The system SHALL enforce a maximum total build timeout to prevent runaway builds.

#### Scenario: Build completes within timeout

- **WHEN** a build completes in 15 minutes
- **THEN** the result is returned normally

#### Scenario: Build exceeds timeout

- **WHEN** a build exceeds the configured timeout (e.g., 30 minutes)
- **THEN** the system terminates the build, generates a failure BuildReport, and cleans up resources

### Requirement: CLI Interface

The system SHALL provide a CLI command to initiate site creation from a SiteSpec.

#### Scenario: Create site from CLI

- **WHEN** the user runs `linopress build --spec site-spec.json`
- **THEN** the system reads the SiteSpec, validates it, and begins the build pipeline

#### Scenario: Create site from prompt

- **WHEN** the user runs `linopress build --prompt "Create a yoga studio website"`
- **THEN** the system invokes the SiteSpec extractor to produce a SiteSpec, then begins the build pipeline

#### Scenario: Build output to console

- **WHEN** a build is in progress
- **THEN** the CLI displays progress updates, step completions, and the final result summary

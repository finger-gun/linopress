# Export Bundle Skill Specification

## ADDED Requirements

### Requirement: Export Process Orchestration

The skill SHALL orchestrate the complete export process by invoking the export tool and coordinating all export components.

#### Scenario: Initiate export process

- **WHEN** the skill is invoked after successful site build
- **THEN** it coordinates wp-content archival, database dump, and manifest generation

#### Scenario: Export on partial success

- **WHEN** a site build partially succeeds but validation passes
- **THEN** the skill proceeds with export to capture the partial site state

#### Scenario: Skip export on critical failure

- **WHEN** site build fails validation completely
- **THEN** the skill does not create an export bundle

### Requirement: Export Bundle Validation

The skill SHALL validate the completeness of export bundles before marking export as successful.

#### Scenario: Validate bundle contents

- **WHEN** an export bundle is created
- **THEN** the skill verifies it contains wp-content/, database.sql, and manifest.json

#### Scenario: Validate file integrity

- **WHEN** validating bundle
- **THEN** the skill checks the tar.gz archive can be extracted without errors

#### Scenario: Validate database dump

- **WHEN** validating bundle
- **THEN** the skill confirms database.sql has valid SQL syntax and required tables

### Requirement: Manifest Generation with Build Report

The skill SHALL generate manifest.json including the complete BuildReport and site metadata.

#### Scenario: Include build report in manifest

- **WHEN** generating the manifest
- **THEN** the skill embeds the full BuildReport object with validation results, screenshots, and healing cycles

#### Scenario: Include site configuration

- **WHEN** generating the manifest
- **THEN** it includes siteId, prompt, theme mode, style seed, and plugin list

#### Scenario: Include version information

- **WHEN** generating the manifest
- **THEN** it records WordPress version, PHP version, Linopress version, and dependency versions

### Requirement: Export Location Management

The skill SHALL write export bundles to the configured output directory with proper naming.

#### Scenario: Write to configured export directory

- **WHEN** an export is created
- **THEN** the bundle is written to ./exports/{siteId}/site-{siteId}\_{timestamp}.tar.gz

#### Scenario: Create export directory structure

- **WHEN** the export directory does not exist
- **THEN** the skill creates the directory hierarchy before writing

#### Scenario: Handle filesystem errors

- **WHEN** the export directory is not writable
- **THEN** the skill raises an error with actionable instructions

### Requirement: Screenshot Inclusion

The skill SHALL include all captured screenshots in the export bundle.

#### Scenario: Include browser screenshots

- **WHEN** browser smoke tests captured screenshots
- **THEN** the export bundle includes a screenshots/ directory with all images

#### Scenario: Reference screenshots in manifest

- **WHEN** screenshots are included
- **THEN** the manifest.json lists all screenshot filenames and their associated pages

### Requirement: Export Size Reporting

The skill SHALL report the final export bundle size and warn if it exceeds recommended limits.

#### Scenario: Report bundle size

- **WHEN** export completes
- **THEN** the skill logs the bundle size in MB

#### Scenario: Warn on large bundles

- **WHEN** the bundle exceeds 500MB
- **THEN** the skill logs a warning about deployment considerations

### Requirement: Secret Scanning

The skill SHALL scan the database dump for potential secrets before finalizing the export.

#### Scenario: Detect API key patterns

- **WHEN** the database contains strings matching API key patterns (e.g., sk*live*...)
- **THEN** the skill warns about potential secret exposure

#### Scenario: Detect plaintext passwords

- **WHEN** the database contains suspicious password-like fields
- **THEN** the skill logs a warning

#### Scenario: Allow export with secrets

- **WHEN** secrets are detected
- **THEN** the skill warns but does not block the export (user responsibility)

### Requirement: Export Metadata

The skill SHALL record export metadata including timestamps, duration, and export status.

#### Scenario: Record export timestamp

- **WHEN** an export is created
- **THEN** the manifest includes exportedAt with ISO 8601 timestamp

#### Scenario: Record export duration

- **WHEN** export completes
- **THEN** the manifest includes exportDuration in seconds

#### Scenario: Record export status

- **WHEN** export completes
- **THEN** the manifest includes exportStatus: "success" or "partial"

### Requirement: Export Verification

The skill SHALL verify the export bundle can be used for site restoration.

#### Scenario: Test extract archive

- **WHEN** verifying an export
- **THEN** the skill extracts the bundle to a temp directory and confirms all files are present

#### Scenario: Test database import simulation

- **WHEN** verifying an export
- **THEN** the skill validates the database.sql can be parsed (without actually importing)

### Requirement: Export Cleanup

The skill SHALL clean up intermediate files after successful export creation.

#### Scenario: Remove temporary SQL dump

- **WHEN** database.sql is added to the bundle
- **THEN** the temporary dump file in /tmp is deleted

#### Scenario: Remove temporary wp-content archive

- **WHEN** wp-content is added to the final bundle
- **THEN** intermediate tar files are deleted

#### Scenario: Retain temp files on error

- **WHEN** export fails
- **THEN** temporary files are retained for debugging

### Requirement: Export Completion Notification

The skill SHALL return export completion status with bundle path and metadata.

#### Scenario: Return success result

- **WHEN** export succeeds
- **THEN** the skill returns {status: "success", bundlePath: "/path/to/bundle.tar.gz", sizeBytes: 12345, manifest}

#### Scenario: Return failure result

- **WHEN** export fails
- **THEN** the skill returns {status: "failed", error: "reason", partialFiles: [...]}

### Requirement: Portable URL Handling

The skill SHALL ensure database URLs are localhost references for portability.

#### Scenario: Verify localhost URLs in database

- **WHEN** creating the database dump
- **THEN** the skill confirms all site URLs are localhost references

#### Scenario: Document base URL in manifest

- **WHEN** generating the manifest
- **THEN** it includes originalBaseUrl so users know what to search-replace on deployment

### Requirement: Export Atomicity

The skill SHALL perform exports atomically to prevent incomplete bundles.

#### Scenario: Write to temporary location first

- **WHEN** creating an export bundle
- **THEN** the skill writes to a .tmp file first

#### Scenario: Atomic rename on completion

- **WHEN** the bundle is fully written and validated
- **THEN** the skill atomically renames it to the final filename

#### Scenario: Cleanup failed export

- **WHEN** export fails partway through
- **THEN** the .tmp file is deleted and no incomplete bundle remains

# Export Tool Specification

## Purpose

Define the low-level export tool that archives wp-content, dumps the database, generates manifests, assembles tar.gz bundles, and validates bundle integrity with secret scanning.

## Requirements

### Requirement: wp-content Archive Creation

The system SHALL create a compressed archive of the /var/www/html/wp-content directory including all themes, plugins, and uploads.

#### Scenario: Archive wp-content directory

- **WHEN** the export tool is invoked
- **THEN** it creates a tar.gz archive containing the entire wp-content directory

#### Scenario: Preserve file permissions in archive

- **WHEN** wp-content is archived
- **THEN** all file permissions and ownership metadata are preserved

#### Scenario: Exclude cache and temp files

- **WHEN** wp-content is archived
- **THEN** cache directories and temporary files are excluded from the archive

### Requirement: Database Dump Generation

The system SHALL generate a SQL dump of the WordPress database using wp-cli db export or mysqldump.

#### Scenario: Export database to SQL file

- **WHEN** the export tool generates a database dump
- **THEN** it creates a database.sql file containing all WordPress tables

#### Scenario: Include database structure and data

- **WHEN** the database is dumped
- **THEN** the SQL file includes both CREATE TABLE statements and INSERT statements with data

#### Scenario: Handle large databases

- **WHEN** the database exceeds 100MB
- **THEN** the export tool uses streaming to avoid memory exhaustion

### Requirement: Manifest Generation

The system SHALL generate a manifest.json file containing site metadata, build report, and version information.

#### Scenario: Generate complete manifest

- **WHEN** the export tool creates the manifest
- **THEN** it includes siteId, WordPress version, PHP version, theme details, plugin list, and build report

#### Scenario: Manifest includes build timestamp

- **WHEN** the manifest is generated
- **THEN** it includes ISO 8601 timestamps for creation and last modification

#### Scenario: Manifest includes tool versions

- **WHEN** the manifest is generated
- **THEN** it records the versions of Linopress, Sisu, and other key dependencies

### Requirement: Bundle Archive Creation

The system SHALL combine wp-content archive, database dump, and manifest into a single .tar.gz bundle.

#### Scenario: Create export bundle

- **WHEN** all export components are ready
- **THEN** the tool creates a site-{siteId}.tar.gz file containing wp-content/, database.sql, and manifest.json

#### Scenario: Bundle file naming

- **WHEN** a bundle is created
- **THEN** it is named with format: site-{siteId}\_{timestamp}.tar.gz

### Requirement: Export Bundle Validation

The system SHALL validate the completeness and integrity of export bundles before marking the export as successful.

#### Scenario: Validate bundle contents

- **WHEN** an export bundle is created
- **THEN** the tool verifies it contains wp-content/, database.sql, and manifest.json

#### Scenario: Validate archive integrity

- **WHEN** a bundle is validated
- **THEN** the tool checks the tar.gz archive is not corrupted

#### Scenario: Validate database dump syntax

- **WHEN** the database dump is validated
- **THEN** the tool verifies the SQL file has valid syntax and required tables

### Requirement: Portable URL References

The system SHALL preserve database URLs as localhost references to ensure portability across deployment environments.

#### Scenario: Database contains localhost URLs

- **WHEN** the database is dumped
- **THEN** all site URLs reference http://localhost:8080 (or configured dev URL)

#### Scenario: Manifest documents base URL

- **WHEN** the manifest is generated
- **THEN** it records the original base URL so users know what to search-replace on deployment

### Requirement: Export Location

The system SHALL write export bundles to a configured output directory accessible to the host machine.

#### Scenario: Export to host filesystem

- **WHEN** an export bundle is created
- **THEN** it is written to the configured export directory (e.g., ./exports/{siteId}/)

#### Scenario: Create export directory if missing

- **WHEN** the export directory does not exist
- **THEN** the tool creates it before writing the bundle

### Requirement: Export Cleanup

The system SHALL clean up temporary files created during the export process.

#### Scenario: Remove temporary SQL dump

- **WHEN** the export bundle is successfully created
- **THEN** the tool deletes the intermediate database.sql file from the temp directory

#### Scenario: Retain temporary files on failure

- **WHEN** the export process fails
- **THEN** the tool retains temporary files for debugging

### Requirement: Export Progress Reporting

The system SHALL report progress during long-running export operations.

#### Scenario: Report database dump progress

- **WHEN** a large database is being dumped
- **THEN** the tool emits progress updates (e.g., "Exported 50MB of 200MB")

#### Scenario: Report archive compression progress

- **WHEN** wp-content is being compressed
- **THEN** the tool emits progress updates (e.g., "Compressed 1000 of 5000 files")

### Requirement: Secret Detection

The system SHALL scan the database dump for common secret patterns and warn if detected.

#### Scenario: Detect API keys in database

- **WHEN** the database dump contains strings matching API key patterns
- **THEN** the tool logs a warning about potential secret exposure

#### Scenario: Detect passwords in plaintext

- **WHEN** the database contains plaintext passwords in non-standard locations
- **THEN** the tool warns the user before including them in the export

### Requirement: Export Size Limits

The system SHALL enforce optional size limits on export bundles to prevent resource exhaustion.

#### Scenario: Export within size limit

- **WHEN** an export bundle is under the configured limit (e.g., 500MB)
- **THEN** the export succeeds normally

#### Scenario: Export exceeds size limit

- **WHEN** an export bundle would exceed the configured limit
- **THEN** the tool raises a warning and optionally fails the export

### Requirement: Metadata in Manifest

The system SHALL include comprehensive metadata in manifest.json to support restore operations.

#### Scenario: Theme metadata in manifest

- **WHEN** the manifest is generated
- **THEN** it includes theme name, parent theme (if applicable), version, and mode (parent/blank/user-selected)

#### Scenario: Plugin metadata in manifest

- **WHEN** the manifest is generated
- **THEN** it includes an array of installed plugins with names, versions, and active status

#### Scenario: Build report in manifest

- **WHEN** the manifest is generated
- **THEN** it includes the complete BuildReport object with validation results, screenshots, and healing cycles

### Requirement: Export Atomicity

The system SHALL perform exports atomically, ensuring incomplete exports are not left in the output directory.

#### Scenario: Atomic export write

- **WHEN** an export is in progress
- **THEN** the tool writes to a temporary file and atomically renames it on completion

#### Scenario: Failed export cleanup

- **WHEN** an export fails partway through
- **THEN** the incomplete bundle is deleted from the output directory

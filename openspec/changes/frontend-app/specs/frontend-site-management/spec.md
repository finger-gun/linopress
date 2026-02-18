# Spec: frontend-site-management

## ADDED Requirements

### Requirement: Site details page
The system SHALL provide site details page at `/sites/[id]` displaying build results and metadata.

#### Scenario: Completed build display
- **WHEN** user navigates to site details for completed build
- **THEN** system SHALL display site name, completion status, build duration, and download section

#### Scenario: Failed build display
- **WHEN** user views site details for failed build
- **THEN** system SHALL display error message, failed step name, and troubleshooting suggestions

### Requirement: Screenshots carousel
The system SHALL display screenshots captured during browser validation in carousel format.

#### Scenario: Multiple screenshots navigation
- **WHEN** build has 4 screenshots
- **THEN** system SHALL display carousel with previous/next arrows and current position indicator (e.g., "2 / 4")

#### Scenario: No screenshots available
- **WHEN** build completed without browser validation
- **THEN** system SHALL hide screenshots section or show placeholder message

#### Scenario: Screenshot zoom
- **WHEN** user clicks screenshot image
- **THEN** system SHALL display full-size overlay with close button

### Requirement: Site metadata display
The system SHALL display metadata grid showing pages created, theme, plugins, and technical details.

#### Scenario: Metadata grid rendering
- **WHEN** viewing site details
- **THEN** system SHALL display cards for: Pages (list with slugs), Theme (name + mode), Plugins (installed list), Technical (WP version, PHP version, build time)

#### Scenario: Empty metadata handling
- **WHEN** metadata field is missing from BuildReport
- **THEN** system SHALL display "N/A" or hide that metadata card

### Requirement: Bundle download button
The system SHALL provide prominent download button for .tar.gz bundle.

#### Scenario: Download initiation
- **WHEN** user clicks "Download bundle" button
- **THEN** system SHALL trigger download via `/api/builds/[id]/download` with progress indication

#### Scenario: Large file download progress
- **WHEN** downloading bundle > 50MB
- **THEN** system SHALL show download progress bar if browser supports it

#### Scenario: Download error handling
- **WHEN** download fails (network error, file missing)
- **THEN** system SHALL display error toast and allow retry

### Requirement: Bundle information display
The system SHALL display bundle size, contents list, and export timestamp.

#### Scenario: Bundle contents display
- **WHEN** viewing site details
- **THEN** system SHALL list: "Contains: wp-content/, database.sql, manifest.json, screenshots/ (if present)"

#### Scenario: Size formatting
- **WHEN** bundle is 284726348 bytes
- **THEN** system SHALL display "284 MB" with appropriate unit (KB, MB, GB)

### Requirement: Build another site action
The system SHALL provide navigation to create new site from site details page.

#### Scenario: New build navigation
- **WHEN** user clicks "Build another site" button
- **THEN** system SHALL navigate to `/new` route

### Requirement: Site list persistence
The system SHALL display list of recent builds on dashboard (future: for now, single-site view only).

#### Scenario: Recent builds list (future)
- **WHEN** user navigates to `/dashboard`
- **THEN** system SHALL display grid of recent builds with status, timestamp, and quick actions

#### Scenario: Direct link sharing
- **WHEN** user shares `/sites/[id]` URL
- **THEN** recipient SHALL access site details without authentication (v1 trust-based)

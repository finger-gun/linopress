# Spec: frontend-api-layer

## ADDED Requirements

### Requirement: Create build endpoint
The system SHALL provide POST `/api/builds/create` endpoint to spawn new builds.

#### Scenario: Valid build request
- **WHEN** client POSTs valid BuildRequest JSON
- **THEN** system SHALL generate unique buildId, spawn CLI process, and return `{ buildId, status: "queued" }`

#### Scenario: Missing prompt field
- **WHEN** client POSTs request without prompt field
- **THEN** system SHALL return 400 status with validation error message

#### Scenario: CLI spawn failure
- **WHEN** spawning CLI process fails
- **THEN** system SHALL return 500 status and log error details

### Requirement: Build status endpoint
The system SHALL provide GET `/api/builds/[id]/status` endpoint returning build state.

#### Scenario: Active build status
- **WHEN** client GETs status for running build
- **THEN** system SHALL return JSON with id, status, steps array, and elapsed time

#### Scenario: Completed build status
- **WHEN** client GETs status for completed build
- **THEN** system SHALL include bundlePath, screenshots array, and completion timestamp

#### Scenario: Missing build
- **WHEN** client GETs status for non-existent buildId
- **THEN** system SHALL return 404 status

### Requirement: Progress streaming endpoint
The system SHALL provide GET `/api/builds/[id]/stream` endpoint using Server-Sent Events.

#### Scenario: SSE connection established
- **WHEN** client connects to stream endpoint
- **THEN** system SHALL set headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`

#### Scenario: Progress event emission
- **WHEN** build state changes
- **THEN** system SHALL send SSE event with format `data: {JSON}\n\n`

#### Scenario: Build completion event
- **WHEN** build reaches complete or failed status
- **THEN** system SHALL send final event and close SSE connection

#### Scenario: Client disconnect
- **WHEN** client drops SSE connection
- **THEN** system SHALL clean up server-side resources without affecting build

### Requirement: Bundle download endpoint
The system SHALL provide GET `/api/builds/[id]/download` endpoint serving .tar.gz files.

#### Scenario: Successful download
- **WHEN** client requests download for completed build
- **THEN** system SHALL stream .tar.gz file with headers `Content-Type: application/gzip`, `Content-Disposition: attachment`

#### Scenario: Bundle not ready
- **WHEN** client requests download for incomplete build
- **THEN** system SHALL return 404 status with message "Bundle not ready"

#### Scenario: Large file streaming
- **WHEN** downloading bundle > 100MB
- **THEN** system SHALL use streaming response to avoid memory exhaustion

### Requirement: Build state management
The system SHALL maintain in-memory Map of build states indexed by buildId.

#### Scenario: State initialization on creation
- **WHEN** new build is created
- **THEN** system SHALL store Build object with initial status "queued" and empty steps array

#### Scenario: State updates from filesystem polling
- **WHEN** polling `.linopress/exports/[id]/` directory
- **THEN** system SHALL update `bundlePath` and `screenshots` fields based on discovered files

#### Scenario: State reconstruction on server restart
- **WHEN** server starts
- **THEN** system SHALL scan `.linopress/exports/` and reconstruct Build map for recent builds

### Requirement: CLI process management
The system SHALL spawn detached CLI processes that continue after API response.

#### Scenario: Detached process spawn
- **WHEN** creating new build
- **THEN** system SHALL use `spawn('node', ['../dist/cli.js', ...], { detached: true, stdio: 'ignore' })` and call `child.unref()`

#### Scenario: Random port assignment
- **WHEN** spawning CLI for new build
- **THEN** system SHALL assign random port between 8000-9000 to avoid conflicts

#### Scenario: Process cleanup on cancellation
- **WHEN** build is cancelled
- **THEN** system SHALL send SIGTERM to CLI process and mark build as "cancelled"

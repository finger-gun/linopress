# Spec: frontend-build-progress

## ADDED Requirements

### Requirement: Real-time step visualization
The system SHALL display the 11-step build pipeline with real-time status updates via Server-Sent Events.

#### Scenario: Initial build start
- **WHEN** user navigates to `/builds/[id]` page
- **THEN** system SHALL establish SSE connection and display all steps in pending state

#### Scenario: Step activation
- **WHEN** CLI begins a new build step
- **THEN** system SHALL update step icon to spinning indicator and status to "active"

#### Scenario: Step completion
- **WHEN** CLI completes a build step
- **THEN** system SHALL update step icon to checkmark, show duration, and mark status as "complete"

#### Scenario: Step failure
- **WHEN** CLI reports step error
- **THEN** system SHALL update step icon to error symbol, show error message, and mark status as "failed"

### Requirement: Progress bar calculation
The system SHALL display a visual progress bar calculated from completed steps divided by total steps.

#### Scenario: Progress bar update
- **WHEN** 4 of 8 steps are complete
- **THEN** system SHALL display progress bar at 50% width with smooth animation

#### Scenario: Build completion
- **WHEN** all steps reach "complete" status
- **THEN** system SHALL show 100% progress and redirect to site details page after 2 seconds

### Requirement: Elapsed time tracking
The system SHALL display elapsed build time updated every second.

#### Scenario: Time display
- **WHEN** build has been running for 45 seconds
- **THEN** system SHALL display "45s elapsed" or "0:45" format

#### Scenario: Estimated remaining time
- **WHEN** build is 50% complete
- **THEN** system SHALL display estimated remaining time based on average step duration

### Requirement: Build logs viewer
The system SHALL provide collapsible log viewer showing CLI output.

#### Scenario: Log expansion
- **WHEN** user clicks "View logs" toggle
- **THEN** system SHALL reveal scrollable log area with CLI stdout/stderr

#### Scenario: Auto-scroll on new logs
- **WHEN** new log lines are received
- **THEN** system SHALL auto-scroll to bottom unless user has manually scrolled up

### Requirement: Build cancellation
The system SHALL allow users to cancel in-progress builds.

#### Scenario: Cancel build request
- **WHEN** user clicks "Cancel build" button
- **THEN** system SHALL prompt for confirmation before sending cancel request

#### Scenario: Build termination
- **WHEN** cancel is confirmed
- **THEN** system SHALL terminate CLI process and mark build as "cancelled"

### Requirement: SSE connection resilience
The system SHALL handle SSE disconnections and reconnect automatically.

#### Scenario: Connection drop
- **WHEN** SSE connection is lost
- **THEN** system SHALL attempt reconnection every 5 seconds with exponential backoff

#### Scenario: Build already complete
- **WHEN** reconnecting to completed build
- **THEN** system SHALL fetch final status via REST API and redirect to site details

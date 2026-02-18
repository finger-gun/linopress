# Spec: frontend-service-contracts

## ADDED Requirements

### Requirement: Build service contract
The system SHALL define a frontend build service interface that abstracts build lifecycle operations from transport implementation.

#### Scenario: Interface shape
- **WHEN** frontend initializes build integrations
- **THEN** system SHALL expose typed methods for `createBuild`, `getBuild`, `subscribe`, and `cancelBuild`

#### Scenario: Transport swap safety
- **WHEN** backend integration is introduced later
- **THEN** UI components SHALL continue to work without contract changes by swapping adapter implementation only

### Requirement: Frontend request validation
The system SHALL validate build requests at the service boundary in the UI-only phase.

#### Scenario: Missing prompt field
- **WHEN** user submits request without prompt content
- **THEN** system SHALL return a validation error state and SHALL NOT create a mock build

#### Scenario: Prompt length out of bounds
- **WHEN** prompt length is outside accepted range
- **THEN** system SHALL reject submission and expose field-level error messaging

### Requirement: Mock lifecycle adapter
The system SHALL provide a deterministic mock adapter that simulates build lifecycle updates for UI development.

#### Scenario: Build creation simulation
- **WHEN** `createBuild` is called with valid input
- **THEN** system SHALL create `BuildState` with initial status `queued` and return a generated `buildId`

#### Scenario: Progress transition simulation
- **WHEN** mock lifecycle runs
- **THEN** system SHALL transition build through queued/running/terminal states with step-by-step updates

#### Scenario: Failure fixture simulation
- **WHEN** failure fixture is active
- **THEN** system SHALL emit failed step, error details, and terminal failed status

### Requirement: Subscription-based progress updates
The system SHALL provide a subscription API for live progress updates independent of SSE transport.

#### Scenario: Subscriber receives updates
- **WHEN** build state changes in mock adapter
- **THEN** subscribed listeners SHALL receive updated `BuildState` payloads

#### Scenario: Unsubscribe cleanup
- **WHEN** consumer unsubscribes from build updates
- **THEN** system SHALL release timers/listeners for that subscription without mutating build state

### Requirement: Mock bundle metadata for download UI
The system SHALL expose bundle metadata in build state for rendering non-functional download UI shells.

#### Scenario: Completed build bundle metadata
- **WHEN** mock build reaches complete status
- **THEN** system SHALL include bundle file name, size, readiness flag, and timestamp metadata in state

#### Scenario: Download action before readiness
- **WHEN** user invokes download action for non-ready build
- **THEN** system SHALL present non-blocking UI feedback indicating backend download is not implemented in this phase

### Requirement: Not-found and reset handling
The system SHALL provide consistent behavior for unknown IDs and refreshed sessions in UI-only mode.

#### Scenario: Unknown build ID
- **WHEN** `getBuild` is called with non-existent `buildId`
- **THEN** system SHALL return `null` and allow the UI to render a not-found state

#### Scenario: Session reset
- **WHEN** user reloads and transient state is lost
- **THEN** system SHALL degrade gracefully using empty/not-found states without runtime errors

### Requirement: Backend handoff compatibility
The system SHALL document explicit mapping from service contract methods/events to future API endpoints and SSE event payloads.

#### Scenario: Handoff checklist
- **WHEN** backend phase starts
- **THEN** developers SHALL have a method/event mapping document to implement API transport without altering component contracts

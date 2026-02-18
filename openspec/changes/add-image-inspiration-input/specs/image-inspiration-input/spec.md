## ADDED Requirements

### Requirement: Accept local image inputs for builds

The system SHALL allow build requests to include one or more local image paths as inspiration inputs.

#### Scenario: Multiple image paths provided

- **WHEN** the user passes multiple image paths for a build
- **THEN** the system records all valid image inputs and proceeds

### Requirement: Support directories for image discovery

The system SHALL accept directory paths for image inputs and expand them to include supported image files.

#### Scenario: Directory expansion

- **WHEN** the user passes a directory that contains supported image files
- **THEN** the system expands the directory into a list of image file paths

### Requirement: Validate image inputs deterministically

The system MUST validate that image inputs exist, are readable, and have supported extensions before starting the build.

#### Scenario: Invalid image path

- **WHEN** the user provides an image path that does not exist or is unreadable
- **THEN** the system fails the build request with a clear error

### Requirement: Pass image inputs to vision-capable agents

The system SHALL include the resolved image input list in the build request payload for use by vision-capable agents.

#### Scenario: Agent receives images

- **WHEN** a build starts with image inputs
- **THEN** the agent context includes the image references for inspection

### Requirement: Preserve sandbox and allowlists

The system MUST keep existing tool allowlists and URL allowlists unchanged, limiting file access to the explicitly provided image paths.

#### Scenario: Access outside provided images

- **WHEN** the agent attempts to read a file outside the allowed image paths
- **THEN** the file access is denied and logged

### Requirement: Record inspiration inputs in reports

The system SHALL record image inspiration inputs in the build report/manifest for traceability.

#### Scenario: Report includes images

- **WHEN** a build with image inputs completes
- **THEN** the report includes the list of image inputs used

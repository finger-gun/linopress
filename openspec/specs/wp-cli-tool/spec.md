# WP-CLI Tool Specification

## Purpose

TBD.

## Requirements

### Requirement: Command Allowlist Enforcement

The system SHALL maintain a strict allowlist of wp-cli commands and reject any command not explicitly permitted.

#### Scenario: Execute allowlisted command

- **WHEN** a skill invokes wp-cli with 'wp core version'
- **THEN** the tool executes the command successfully

#### Scenario: Reject non-allowlisted command

- **WHEN** a skill attempts to invoke 'wp eval-file arbitrary.php'
- **THEN** the tool rejects the command and raises a security violation error

### Requirement: Command Execution Context

The system SHALL execute all wp-cli commands within the wordpress container via docker exec, using the www-data user context.

#### Scenario: Execute command in wordpress container

- **WHEN** the tool runs 'wp core install'
- **THEN** it executes as 'docker exec -u www-data <wordpress-container> wp core install'

#### Scenario: Command inherits container environment

- **WHEN** a wp-cli command needs to access the WordPress installation
- **THEN** it runs with the correct WP_HOME, DB_HOST, and other WordPress environment variables from the container

### Requirement: Root-Scoped Filesystem Access

The system SHALL allow wp-cli commands to access the entire WordPress installation directory but not escape the container filesystem.

#### Scenario: Install plugin to wp-content

- **WHEN** 'wp plugin install contact-form-7' is executed
- **THEN** the plugin is installed to /var/www/html/wp-content/plugins/ within the container

#### Scenario: Cannot access host filesystem

- **WHEN** a wp-cli command attempts to access /host/files
- **THEN** the container isolation prevents access to host paths

### Requirement: Parameter Sanitization

The system SHALL sanitize all parameters passed to wp-cli commands to prevent command injection attacks.

#### Scenario: Sanitize special characters

- **WHEN** a skill passes a plugin name containing shell metacharacters (e.g., "plugin; rm -rf /")
- **THEN** the tool escapes or rejects the input before executing the command

#### Scenario: Validate parameter types

- **WHEN** a command expects a numeric parameter but receives a string
- **THEN** the tool validates and rejects the input with a type error

### Requirement: Command Output Capture

The system SHALL capture stdout, stderr, and exit codes from all wp-cli command executions.

#### Scenario: Successful command output

- **WHEN** 'wp plugin list --format=json' completes successfully
- **THEN** the tool returns the JSON output, exit code 0, and empty stderr

#### Scenario: Failed command error capture

- **WHEN** 'wp plugin activate nonexistent-plugin' fails
- **THEN** the tool returns the error message from stderr, non-zero exit code, and empty stdout

### Requirement: Structured Result Parsing

The system SHALL parse structured wp-cli output (JSON, CSV) and return typed data to skills.

#### Scenario: Parse JSON plugin list

- **WHEN** the tool executes 'wp plugin list --format=json'
- **THEN** it parses the JSON response and returns an array of plugin objects

#### Scenario: Handle malformed JSON output

- **WHEN** wp-cli returns invalid JSON
- **THEN** the tool raises a parsing error with the raw output included

### Requirement: Command Timeout

The system SHALL enforce a timeout on wp-cli command executions to prevent hung processes.

#### Scenario: Command completes within timeout

- **WHEN** 'wp core version' completes in 2 seconds
- **THEN** the result is returned normally

#### Scenario: Command exceeds timeout

- **WHEN** 'wp plugin install' takes longer than the configured timeout (e.g., 60 seconds)
- **THEN** the tool terminates the process and raises a timeout error

### Requirement: Idempotent Command Support

The system SHALL provide idempotent wrappers for non-idempotent wp-cli commands where appropriate.

#### Scenario: Idempotent plugin activation

- **WHEN** 'wp plugin activate contact-form-7' is called on an already-active plugin
- **THEN** the tool detects the plugin is active and returns success without error

#### Scenario: Idempotent core installation check

- **WHEN** 'wp core install' is called on an already-installed WordPress instance
- **THEN** the tool detects existing installation and skips re-installation

### Requirement: WordPress Installation Detection

The system SHALL verify WordPress is installed before executing commands that require a functioning WordPress installation.

#### Scenario: Execute command on installed WordPress

- **WHEN** 'wp plugin list' is executed and WordPress is installed
- **THEN** the command runs successfully

#### Scenario: Prevent command on uninitialized WordPress

- **WHEN** 'wp plugin list' is executed before 'wp core install'
- **THEN** the tool detects WordPress is not installed and raises a precondition error

### Requirement: Database Connection Validation

The system SHALL validate database connectivity before executing commands that interact with the WordPress database.

#### Scenario: Command with healthy database

- **WHEN** 'wp option get blogname' is executed and the database is reachable
- **THEN** the command retrieves the option value successfully

#### Scenario: Command with unreachable database

- **WHEN** 'wp post list' is executed but the db container is down
- **THEN** the tool detects the database connection failure and raises a connectivity error

### Requirement: Allowlisted Commands

The system SHALL support the following wp-cli commands in the allowlist:

- `wp core install` - Install WordPress
- `wp core version` - Check WordPress version
- `wp plugin install <plugin>` - Install plugins
- `wp plugin activate <plugin>` - Activate plugins
- `wp plugin list` - List installed plugins
- `wp theme install <theme>` - Install themes
- `wp theme activate <theme>` - Activate themes
- `wp theme list` - List installed themes
- `wp post create` - Create posts
- `wp post list` - List posts
- `wp menu create <name>` - Create menus
- `wp menu item add-*` - Add menu items
- `wp option get <key>` - Get options
- `wp option update <key> <value>` - Update options
- `wp db export` - Export database
- `wp db check` - Check database integrity
- `wp doctor check` - Run WordPress health checks

#### Scenario: Core installation command

- **WHEN** 'wp core install --url=http://localhost --title=MySite --admin_user=admin --admin_password=pass --admin_email=admin@example.com' is executed
- **THEN** WordPress is installed with the specified configuration

#### Scenario: Plugin list with format option

- **WHEN** 'wp plugin list --format=json' is executed
- **THEN** the tool returns structured JSON with plugin data

### Requirement: Error Code Interpretation

The system SHALL interpret wp-cli exit codes and map them to meaningful error types for skill consumption.

#### Scenario: Success exit code

- **WHEN** a wp-cli command exits with code 0
- **THEN** the tool returns a success result

#### Scenario: General error exit code

- **WHEN** a wp-cli command exits with code 1
- **THEN** the tool raises a general execution error

#### Scenario: Command not found exit code

- **WHEN** a wp-cli command exits with code 127
- **THEN** the tool raises a command-not-found error

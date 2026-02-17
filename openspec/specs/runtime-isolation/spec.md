# Runtime Isolation Specification

## Purpose

TBD.

## Requirements

### Requirement: Per-Site Docker Compose Stack

The system SHALL provision an isolated Docker Compose stack for each WordPress site, consisting of wordpress, database, and agent-api containers.

#### Scenario: Successful site stack provisioning

- **WHEN** a new site is requested
- **THEN** the system creates a unique Docker Compose stack with wordpress (nginx + php-fpm), db (MariaDB), and agent-api (Node.js) containers

#### Scenario: Stack isolation verification

- **WHEN** multiple sites are provisioned
- **THEN** each stack operates in isolation with no cross-site resource sharing except host filesystem volumes

### Requirement: Shared wp-content Volume

The system SHALL mount a shared wp-content volume accessible to both the wordpress and agent-api containers with read-write permissions.

#### Scenario: Agent writes theme file to wp-content

- **WHEN** the agent-api container writes a file to /var/www/html/wp-content/themes/
- **THEN** the wordpress container can immediately read and serve the file

#### Scenario: WordPress writes upload to wp-content

- **WHEN** WordPress writes a media upload to /var/www/html/wp-content/uploads/
- **THEN** the agent-api container can access the file for export operations

### Requirement: Persistent Database Volume

The system SHALL mount a persistent volume for the MariaDB database to preserve data across container restarts.

#### Scenario: Database persistence after container restart

- **WHEN** the db container is stopped and restarted
- **THEN** all WordPress data (posts, options, users) remains intact

### Requirement: Site Lifecycle Management

The system SHALL provide commands to provision, start, stop, destroy, and export site stacks.

#### Scenario: Provision new site

- **WHEN** the provision command is executed with a unique site ID
- **THEN** a new Docker Compose stack is created and started with all containers running

#### Scenario: Destroy site stack

- **WHEN** the destroy command is executed for a site
- **THEN** all containers are stopped, removed, and volumes are deleted

#### Scenario: Stop and restart existing site

- **WHEN** a site stack is stopped and later restarted
- **THEN** all containers resume with preserved state from persistent volumes

### Requirement: Container Networking

The system SHALL configure internal Docker networking to allow wordpress, db, and agent-api containers to communicate, while exposing only the wordpress HTTP port to the host.

#### Scenario: Agent-api accesses WordPress via internal network

- **WHEN** agent-api needs to validate WordPress installation
- **THEN** it can reach the wordpress container using the service name 'wordpress' on port 80

#### Scenario: WordPress connects to database

- **WHEN** WordPress needs to query the database
- **THEN** it can connect to the db container using the service name 'db' on port 3306

#### Scenario: External access to WordPress

- **WHEN** a browser requests the site from the host machine
- **THEN** the wordpress container is accessible on the configured host port (e.g., 8080)

### Requirement: Optional Browser Container

The system SHALL support an optional headless browser container for automated testing, provisioned on-demand per site.

#### Scenario: Provision site with browser container

- **WHEN** a site is provisioned with browser testing enabled
- **THEN** a browserless/chrome container is added to the stack and accessible via Chrome DevTools Protocol on port 3000

#### Scenario: Provision site without browser container

- **WHEN** a site is provisioned without browser testing
- **THEN** no browser container is created and resources are conserved

### Requirement: Environment Configuration

The system SHALL configure environment variables for each container including database credentials, WordPress URLs, and security keys.

#### Scenario: Database credentials consistency

- **WHEN** a site stack is provisioned
- **THEN** the db container receives MYSQL_ROOT_PASSWORD and MYSQL_DATABASE environment variables that match the values configured in the wordpress container's DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD

#### Scenario: WordPress base URL configuration

- **WHEN** a wordpress container is started
- **THEN** the WP_HOME and WP_SITEURL environment variables are set to the correct host-accessible URL (e.g., http://localhost:8080)

### Requirement: Stack Resource Constraints

The system SHALL apply resource limits to containers to prevent runaway resource consumption on the host.

#### Scenario: Memory limit enforcement

- **WHEN** a container attempts to exceed its configured memory limit
- **THEN** Docker enforces the limit and prevents the container from consuming additional memory

#### Scenario: CPU share allocation

- **WHEN** multiple site stacks compete for CPU resources
- **THEN** each stack receives a fair share of CPU time based on configured weights

### Requirement: Container Health Checks

The system SHALL configure health checks for wordpress and db containers to detect and report service failures.

#### Scenario: Database health check success

- **WHEN** the db container is running and accepting connections
- **THEN** the health check reports healthy status

#### Scenario: WordPress health check failure detection

- **WHEN** the wordpress container's web server crashes
- **THEN** the health check reports unhealthy status and the system can trigger recovery

### Requirement: Volume Backup and Restore

The system SHALL support backing up and restoring wp-content and database volumes for disaster recovery.

#### Scenario: Backup site volumes

- **WHEN** a backup command is executed for a site
- **THEN** the wp-content directory and database volume are archived to a timestamped backup file

#### Scenario: Restore site from backup

- **WHEN** a restore command is executed with a backup file
- **THEN** the wp-content directory and database volume are restored to their backed-up state

### Requirement: Stack Name Uniqueness

The system SHALL ensure each site stack has a unique name derived from the site ID to prevent naming conflicts.

#### Scenario: Concurrent site provisioning

- **WHEN** two sites are provisioned simultaneously with different site IDs
- **THEN** each receives a unique Docker Compose project name with no conflicts

#### Scenario: Attempt to provision duplicate site ID

- **WHEN** a site is provisioned with an existing site ID
- **THEN** the system rejects the request with an error indicating the site already exists

### Requirement: Container Logging

The system SHALL capture and store container logs for debugging and audit purposes.

#### Scenario: Access wordpress container logs

- **WHEN** debugging a site issue
- **THEN** the system provides access to wordpress container logs showing PHP errors and web server access logs

#### Scenario: Access agent-api logs

- **WHEN** troubleshooting skill execution failures
- **THEN** the system provides access to agent-api container logs showing skill invocations and tool executions

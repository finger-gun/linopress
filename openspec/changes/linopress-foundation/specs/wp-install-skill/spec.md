# WordPress Install Skill Specification

## ADDED Requirements

### Requirement: Core WordPress Installation
The skill SHALL install WordPress core using wp-cli with admin user creation and database configuration.

#### Scenario: Fresh WordPress installation
- **WHEN** the skill is invoked with site parameters (URL, title, admin credentials)
- **THEN** it executes 'wp core install' and creates a functioning WordPress installation

#### Scenario: Installation with custom admin user
- **WHEN** the skill installs WordPress with admin_user="siteadmin"
- **THEN** WordPress is installed with a user account named "siteadmin"

### Requirement: Database Setup Verification
The skill SHALL verify database connectivity and schema before attempting WordPress installation.

#### Scenario: Database ready before install
- **WHEN** the skill checks database status
- **THEN** it waits for the MariaDB container to be ready before proceeding

#### Scenario: Database connection failure
- **WHEN** the database is unreachable
- **THEN** the skill raises an error and does not attempt installation

### Requirement: Admin User Configuration
The skill SHALL create a WordPress admin user with secure credentials and specified email address.

#### Scenario: Admin user with email
- **WHEN** WordPress is installed with admin_email="admin@example.com"
- **THEN** the admin user account uses that email address

#### Scenario: Secure password generation
- **WHEN** no admin password is provided
- **THEN** the skill generates a strong random password (16+ chars, mixed case, numbers, symbols)

### Requirement: Site URL Configuration
The skill SHALL configure WordPress site URL and home URL to match the container's accessible endpoint.

#### Scenario: Set site URL to localhost
- **WHEN** WordPress is installed for a site accessible on localhost:8080
- **THEN** WP_HOME and WP_SITEURL are set to http://localhost:8080

#### Scenario: URL consistency check
- **WHEN** WordPress installation completes
- **THEN** the skill verifies the configured URLs match the installation parameters

### Requirement: Baseline Security Settings
The skill SHALL apply baseline security settings including disallowing file edits and setting appropriate permissions.

#### Scenario: Disable file editing in admin
- **WHEN** WordPress is installed
- **THEN** the skill sets DISALLOW_FILE_EDIT to true in wp-config.php

#### Scenario: Set secure file permissions
- **WHEN** WordPress is installed
- **THEN** wp-config.php is set to 600 permissions (owner read-write only)

### Requirement: Permalink Structure
The skill SHALL configure a SEO-friendly permalink structure by default.

#### Scenario: Set post name permalinks
- **WHEN** WordPress is installed
- **THEN** the skill configures permalinks to /%postname%/ format

#### Scenario: Flush rewrite rules
- **WHEN** permalink structure is set
- **THEN** the skill flushes rewrite rules to ensure .htaccess is updated

### Requirement: Timezone Configuration
The skill SHALL set the WordPress timezone to a sensible default or user-specified value.

#### Scenario: Set default timezone
- **WHEN** no timezone is specified
- **THEN** WordPress is configured to UTC timezone

#### Scenario: Set custom timezone
- **WHEN** the skill is invoked with timezone="America/New_York"
- **THEN** WordPress uses that timezone for date/time display

### Requirement: Default Content Cleanup
The skill SHALL optionally remove default WordPress content (sample post, page, comment).

#### Scenario: Remove Hello World post
- **WHEN** the skill is configured to clean default content
- **THEN** it deletes the "Hello World" post

#### Scenario: Remove sample page
- **WHEN** the skill is configured to clean default content
- **THEN** it deletes the default "Sample Page"

#### Scenario: Retain default content
- **WHEN** the skill is configured to retain defaults
- **THEN** sample post, page, and comment remain in the installation

### Requirement: Site Language Configuration
The skill SHALL configure WordPress site language if specified.

#### Scenario: English language default
- **WHEN** no language is specified
- **THEN** WordPress is installed with English (US) as the site language

#### Scenario: Custom language installation
- **WHEN** the skill is invoked with language="es_ES"
- **THEN** WordPress downloads and activates the Spanish language pack

### Requirement: Installation Verification
The skill SHALL verify WordPress installation succeeded by checking core version and database connectivity.

#### Scenario: Verify WordPress version
- **WHEN** installation completes
- **THEN** the skill runs 'wp core version' and confirms a version number is returned

#### Scenario: Verify database tables exist
- **WHEN** installation completes
- **THEN** the skill confirms required WordPress tables (wp_posts, wp_options, etc.) exist

#### Scenario: Verify admin login
- **WHEN** installation completes
- **THEN** the skill optionally tests admin login using the created credentials

### Requirement: Idempotent Installation
The skill SHALL detect existing WordPress installations and skip re-installation.

#### Scenario: Skip installation if WordPress exists
- **WHEN** the skill runs on a container with existing WordPress
- **THEN** it detects the installation and returns success without re-running 'wp core install'

#### Scenario: Force reinstall option
- **WHEN** the skill is invoked with force_reinstall=true
- **THEN** it drops existing database tables and reinstalls WordPress from scratch

### Requirement: Installation Error Handling
The skill SHALL handle common installation errors and provide actionable error messages.

#### Scenario: Database name mismatch error
- **WHEN** wp-cli reports a database name error
- **THEN** the skill raises an error with instructions to check database configuration

#### Scenario: Filesystem permission error
- **WHEN** wp-cli cannot write wp-config.php
- **THEN** the skill raises an error indicating filesystem permission issues

### Requirement: Multi-Site Installation Support
The skill SHALL optionally support WordPress multisite installation for future use cases.

#### Scenario: Single-site installation (default)
- **WHEN** no multisite flag is provided
- **THEN** WordPress is installed as a single site

#### Scenario: Multisite installation
- **WHEN** the skill is invoked with multisite=true
- **THEN** WordPress is installed with multisite enabled and network configured

### Requirement: WordPress Core Version Selection
The skill SHALL support installing specific WordPress versions if needed for compatibility.

#### Scenario: Install latest WordPress version
- **WHEN** no version is specified
- **THEN** the skill installs the latest stable WordPress release

#### Scenario: Install specific WordPress version
- **WHEN** the skill is invoked with version="6.4.2"
- **THEN** WordPress version 6.4.2 is installed

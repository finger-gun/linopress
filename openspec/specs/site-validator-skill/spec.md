# Site Validator Skill Specification

## Purpose

Define the skill that performs comprehensive CLI-based site health validation including database integrity, filesystem permissions, plugin conflicts, content verification, and structured severity-classified reporting.

## Requirements

### Requirement: Database Integrity Check
The skill SHALL run wp-cli database checks to verify table structure and data integrity.

#### Scenario: Check database tables
- **WHEN** the validator runs database checks
- **THEN** it executes 'wp db check' and reports any table corruption

#### Scenario: Verify required tables exist
- **WHEN** validating database integrity
- **THEN** the skill confirms all core WordPress tables (wp_posts, wp_users, wp_options, etc.) exist

#### Scenario: Detect database connection issues
- **WHEN** the database is unreachable
- **THEN** the skill reports a connectivity error in validation results

### Requirement: Filesystem Permissions Check
The skill SHALL verify wp-content directory has correct permissions for WordPress operation.

#### Scenario: Check wp-content is writable
- **WHEN** the validator checks filesystem permissions
- **THEN** it verifies /var/www/html/wp-content is writable by the web server user

#### Scenario: Check uploads directory permissions
- **WHEN** validating filesystem
- **THEN** it confirms wp-content/uploads has 755 permissions

#### Scenario: Detect permission errors
- **WHEN** critical directories lack write permissions
- **THEN** the skill reports filesystem permission errors

### Requirement: WordPress Health Check
The skill SHALL run WordPress's built-in health checks using wp-cli doctor or wp doctor check.

#### Scenario: Run health check command
- **WHEN** the validator runs health checks
- **THEN** it executes 'wp doctor check' and parses the results

#### Scenario: Detect critical health issues
- **WHEN** WordPress health check reports critical issues
- **THEN** the skill includes them in validation results as failures

#### Scenario: Ignore recommended improvements
- **WHEN** health check reports non-critical recommendations
- **THEN** the skill logs them as warnings but does not fail validation

### Requirement: Plugin Conflict Detection
The skill SHALL detect plugin conflicts by checking for PHP errors in WordPress logs.

#### Scenario: Detect plugin PHP errors
- **WHEN** a plugin generates PHP errors
- **THEN** the skill parses error logs and reports the problematic plugin

#### Scenario: No plugin conflicts
- **WHEN** all plugins load without errors
- **THEN** the skill reports plugin validation as passed

### Requirement: Theme Validation
The skill SHALL verify the active theme loads without errors.

#### Scenario: Check active theme exists
- **WHEN** validating the theme
- **THEN** the skill confirms the active theme directory exists in wp-content/themes

#### Scenario: Detect theme errors
- **WHEN** the theme has PHP errors or missing required files
- **THEN** the skill reports theme validation failures

### Requirement: Content Validation
The skill SHALL verify expected pages and posts exist and are published.

#### Scenario: Check required pages exist
- **WHEN** validating content against a site spec
- **THEN** the skill confirms all specified pages were created

#### Scenario: Check page publication status
- **WHEN** validating content
- **THEN** the skill verifies pages are published (not draft or pending)

#### Scenario: Detect missing content
- **WHEN** expected pages or posts are missing
- **THEN** the skill reports content validation failures

### Requirement: URL Accessibility Check
The skill SHALL verify key URLs return 200 OK responses.

#### Scenario: Check homepage accessible
- **WHEN** validating site accessibility
- **THEN** the skill makes an HTTP request to the homepage and confirms 200 status

#### Scenario: Check key pages accessible
- **WHEN** validating a site with About, Services, Contact pages
- **THEN** the skill confirms each page URL returns 200 OK

#### Scenario: Detect 404 errors
- **WHEN** a page URL returns 404
- **THEN** the skill reports the URL as inaccessible

### Requirement: Permalink Validation
The skill SHALL verify permalink structure is configured correctly.

#### Scenario: Check permalink structure
- **WHEN** validating permalinks
- **THEN** the skill confirms the permalink structure matches expectations (e.g., /%postname%/)

#### Scenario: Check rewrite rules flushed
- **WHEN** validating permalinks
- **THEN** the skill verifies rewrite rules are not stale (no 404s on valid posts)

### Requirement: Admin User Verification
The skill SHALL verify the admin user account exists and is accessible.

#### Scenario: Check admin user exists
- **WHEN** validating user accounts
- **THEN** the skill confirms an admin user was created

#### Scenario: Verify admin role
- **WHEN** checking admin user
- **THEN** the skill confirms the user has administrator role

### Requirement: Validation Reporting
The skill SHALL return structured validation results with pass/fail status for each check.

#### Scenario: Return structured validation results
- **WHEN** validation completes
- **THEN** the skill returns a ValidationResult object with cli.databaseOk, cli.filesystemOk, cli.healthCheckOk

#### Scenario: Include error details
- **WHEN** validation failures occur
- **THEN** the result includes specific error messages for each failed check

### Requirement: Validation Timeout
The skill SHALL enforce a timeout on validation operations to prevent hanging.

#### Scenario: Validation completes within timeout
- **WHEN** all checks complete in under 2 minutes
- **THEN** the skill returns results normally

#### Scenario: Validation exceeds timeout
- **WHEN** validation takes longer than the configured timeout
- **THEN** the skill aborts and reports a timeout error

### Requirement: Incremental Validation
The skill SHALL support running individual validation checks independently.

#### Scenario: Run database check only
- **WHEN** the skill is invoked with check="database"
- **THEN** it runs only the database integrity check

#### Scenario: Run all checks
- **WHEN** no specific check is requested
- **THEN** the skill runs all validation checks (database, filesystem, health, content, etc.)

### Requirement: Validation Severity Levels
The skill SHALL classify validation issues as critical, warning, or info based on impact.

#### Scenario: Critical error fails validation
- **WHEN** a critical issue is detected (e.g., database corruption)
- **THEN** the overall validation status is "failed"

#### Scenario: Warning does not fail validation
- **WHEN** only warnings are detected (e.g., recommended plugin update)
- **THEN** the overall validation status is "passed" with warnings

### Requirement: Baseline Validation Profile
The skill SHALL define a baseline validation profile for MVP sites.

#### Scenario: MVP validation requirements
- **WHEN** running baseline validation
- **THEN** the skill checks: database integrity, filesystem permissions, homepage accessibility, admin user exists

#### Scenario: Skip advanced checks in baseline
- **WHEN** running baseline validation
- **THEN** advanced checks (performance, SEO) are skipped

### Requirement: Custom Validation Rules
The skill SHALL optionally support custom validation rules defined in site specs.

#### Scenario: Validate custom page exists
- **WHEN** a site spec requires a specific page "Pricing"
- **THEN** the skill includes a check for that page in validation

#### Scenario: Validate custom plugin activated
- **WHEN** a site spec requires "contact-form-7" plugin
- **THEN** the skill verifies the plugin is installed and active

# Self-Healing Skill Specification

## Purpose

TBD.

## Requirements

### Requirement: Error Analysis

The skill SHALL analyze validation errors to determine appropriate healing strategies.

#### Scenario: Analyze database error

- **WHEN** validation reports a database integrity error
- **THEN** the skill identifies the error type and selects database repair strategy

#### Scenario: Analyze plugin conflict

- **WHEN** validation detects PHP errors from a specific plugin
- **THEN** the skill identifies the problematic plugin for deactivation

#### Scenario: Analyze multiple error types

- **WHEN** validation reports both filesystem and theme errors
- **THEN** the skill prioritizes errors and plans healing sequence

### Requirement: Bounded Healing Cycles

The skill SHALL limit healing attempts to a maximum of 2 cycles to prevent runaway operations.

#### Scenario: First healing cycle

- **WHEN** validation fails and healing is invoked
- **THEN** the skill attempts targeted fixes and re-validates

#### Scenario: Second healing cycle

- **WHEN** first healing cycle fails to resolve all issues
- **THEN** the skill attempts more aggressive fixes and re-validates

#### Scenario: Fail after two cycles

- **WHEN** validation still fails after 2 healing cycles
- **THEN** the skill reports failure with full BuildReport and does not attempt further healing

### Requirement: Database Repair Strategy

The skill SHALL repair database issues using wp-cli db repair and admin user regeneration.

#### Scenario: Run database repair

- **WHEN** database corruption is detected
- **THEN** the skill executes 'wp db repair' to fix table issues

#### Scenario: Regenerate admin user

- **WHEN** admin user is missing or corrupted
- **THEN** the skill creates a new admin user with secure credentials

#### Scenario: Verify database repair success

- **WHEN** database repair completes
- **THEN** the skill re-runs 'wp db check' to confirm issues are resolved

### Requirement: Filesystem Permission Repair

The skill SHALL reset wp-content directory permissions to standard values (755 for directories, 644 for files).

#### Scenario: Fix wp-content permissions

- **WHEN** wp-content lacks write permissions
- **THEN** the skill sets directory to 755 and files to 644

#### Scenario: Fix uploads directory permissions

- **WHEN** wp-content/uploads is not writable
- **THEN** the skill recursively sets correct permissions

### Requirement: Plugin Conflict Resolution

The skill SHALL deactivate all plugins and selectively re-activate to isolate conflicts.

#### Scenario: Deactivate all plugins

- **WHEN** plugin conflicts are suspected
- **THEN** the skill executes 'wp plugin deactivate --all'

#### Scenario: Re-activate plugins one by one

- **WHEN** plugins are deactivated for conflict resolution
- **THEN** the skill re-activates each plugin and tests for errors

#### Scenario: Identify conflicting plugin

- **WHEN** a specific plugin causes errors on activation
- **THEN** the skill leaves it deactivated and logs the conflict

### Requirement: Theme Fallback Strategy

The skill SHALL fallback to a safe theme (blank block theme or default theme) when theme errors occur.

#### Scenario: Fallback to blank block theme

- **WHEN** the generated theme has fatal errors
- **THEN** the skill generates a minimal blank block theme and activates it

#### Scenario: Fallback to default WordPress theme

- **WHEN** blank block theme generation also fails
- **THEN** the skill activates Twenty Twenty-Four or the latest default theme

### Requirement: Page Regeneration

The skill SHALL regenerate missing or broken pages identified during validation.

#### Scenario: Recreate missing page

- **WHEN** a required page is missing
- **THEN** the skill invokes pageBuilderSkill to recreate it

#### Scenario: Flush rewrite rules

- **WHEN** pages return 404 errors despite existing in database
- **THEN** the skill executes 'wp rewrite flush' to regenerate permalink rules

### Requirement: Healing Action Logging

The skill SHALL log all healing actions taken during each cycle for BuildReport inclusion.

#### Scenario: Log database repair action

- **WHEN** database repair is performed
- **THEN** the skill logs {action: "database_repair", timestamp, result}

#### Scenario: Log plugin deactivation

- **WHEN** a plugin is deactivated for healing
- **THEN** the skill logs {action: "plugin_deactivate", plugin: "plugin-name", reason}

#### Scenario: Include healing log in BuildReport

- **WHEN** healing completes
- **THEN** all logged actions are included in BuildReport.healingCycles

### Requirement: Targeted vs. Aggressive Fixes

The skill SHALL use targeted fixes in cycle 1 and more aggressive fixes in cycle 2.

#### Scenario: Cycle 1 targeted fix

- **WHEN** first healing cycle runs
- **THEN** the skill applies minimal changes (e.g., flush rewrite rules, repair specific table)

#### Scenario: Cycle 2 aggressive fix

- **WHEN** second healing cycle runs
- **THEN** the skill applies broader changes (e.g., deactivate all plugins, regenerate all pages)

### Requirement: Re-validation After Healing

The skill SHALL invoke siteValidatorSkill and browserSmokeTestSkill after each healing cycle.

#### Scenario: Re-validate after healing

- **WHEN** healing actions complete
- **THEN** the skill runs full validation (CLI + browser) to check if issues are resolved

#### Scenario: Exit on successful healing

- **WHEN** re-validation passes after healing
- **THEN** the skill stops healing and returns success

### Requirement: Partial Success Handling

The skill SHALL report partial success when some but not all issues are resolved.

#### Scenario: Some errors resolved

- **WHEN** healing resolves database errors but theme errors persist
- **THEN** the skill reports partial success and attempts cycle 2

#### Scenario: No progress made

- **WHEN** healing makes no improvement to validation results
- **THEN** the skill skips further cycles and reports failure

### Requirement: Failure Report Generation

The skill SHALL generate a comprehensive failure report when healing is exhausted.

#### Scenario: Include unresolved errors

- **WHEN** healing fails to resolve all issues
- **THEN** the report includes all remaining validation errors with details

#### Scenario: Include healing history

- **WHEN** healing fails
- **THEN** the report includes all attempted healing actions and their outcomes

#### Scenario: Include screenshots

- **WHEN** healing fails
- **THEN** the report includes screenshots captured during final validation

### Requirement: Healing Timeout

The skill SHALL enforce a total healing timeout (e.g., 10 minutes) across all cycles.

#### Scenario: Healing completes within timeout

- **WHEN** all healing cycles complete in 8 minutes
- **THEN** the skill proceeds normally

#### Scenario: Healing exceeds timeout

- **WHEN** healing operations exceed 10 minutes
- **THEN** the skill aborts and reports timeout failure

### Requirement: Resource Cleanup on Healing Failure

The skill SHALL clean up temporary resources even when healing fails.

#### Scenario: Remove temp files on failure

- **WHEN** healing fails after 2 cycles
- **THEN** the skill deletes temporary files created during healing attempts

#### Scenario: Preserve debugging artifacts

- **WHEN** healing fails
- **THEN** the skill retains logs, screenshots, and error dumps for debugging

### Requirement: Healing Strategy Selection

The skill SHALL select healing strategies based on error types detected in validation.

#### Scenario: Database error triggers database healing

- **WHEN** only database errors are present
- **THEN** the skill runs database repair without touching plugins or themes

#### Scenario: Multiple error types trigger comprehensive healing

- **WHEN** database, plugin, and theme errors are present
- **THEN** the skill applies healing strategies for all error types in priority order

### Requirement: Rollback on Healing Failure

The skill SHALL optionally rollback healing changes if subsequent validation worsens.

#### Scenario: Detect validation worsening

- **WHEN** healing introduces new errors
- **THEN** the skill detects the regression via validation comparison

#### Scenario: Rollback healing changes

- **WHEN** healing makes validation worse
- **THEN** the skill restores the pre-healing state before attempting cycle 2

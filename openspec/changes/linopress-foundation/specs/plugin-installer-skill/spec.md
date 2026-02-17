# Plugin Installer Skill Specification

## ADDED Requirements

### Requirement: Plugin Discovery

The skill SHALL search for WordPress plugins using wp-cli or a curated plugin registry.

#### Scenario: Search WordPress.org repository

- **WHEN** the skill searches for "contact form"
- **THEN** it returns a list of matching plugins from WordPress.org

#### Scenario: Use curated registry

- **WHEN** the skill is configured to use a curated allowlist
- **THEN** it only returns plugins from the approved registry

### Requirement: Plugin Installation

The skill SHALL install plugins from the WordPress.org repository using wp-cli.

#### Scenario: Install plugin by slug

- **WHEN** the skill installs plugin "contact-form-7"
- **THEN** it executes 'wp plugin install contact-form-7' and downloads the plugin

#### Scenario: Install specific plugin version

- **WHEN** the skill installs "woocommerce" version "8.5.0"
- **THEN** it executes 'wp plugin install woocommerce --version=8.5.0'

#### Scenario: Install multiple plugins in parallel

- **WHEN** the skill is given a list of 5 plugins to install
- **THEN** it installs them concurrently to reduce total installation time

### Requirement: Plugin Activation

The skill SHALL activate installed plugins and verify they load without errors.

#### Scenario: Activate single plugin

- **WHEN** the skill activates "contact-form-7"
- **THEN** it executes 'wp plugin activate contact-form-7' and the plugin becomes active

#### Scenario: Activate all installed plugins

- **WHEN** the skill is configured to auto-activate
- **THEN** it activates all newly installed plugins

#### Scenario: Detect activation errors

- **WHEN** a plugin fails to activate due to PHP errors
- **THEN** the skill captures the error message and raises an activation failure

### Requirement: Dependency Resolution

The skill SHALL detect plugin dependencies and install required plugins first.

#### Scenario: Install plugin with dependencies

- **WHEN** a plugin requires another plugin (e.g., WooCommerce addon requires WooCommerce)
- **THEN** the skill installs the dependency first, then the dependent plugin

#### Scenario: Circular dependency detection

- **WHEN** two plugins depend on each other
- **THEN** the skill detects the circular dependency and raises an error

### Requirement: Curated Plugin Registry

The skill SHALL maintain a curated registry of recommended, tested plugins for common use cases.

#### Scenario: Retrieve contact form recommendations

- **WHEN** the LLM requests contact form plugins
- **THEN** the skill returns curated options like Contact Form 7, WPForms Lite, Gravity Forms

#### Scenario: Retrieve SEO plugin recommendations

- **WHEN** the LLM requests SEO plugins
- **THEN** the skill returns curated options like Yoast SEO, Rank Math, All in One SEO

#### Scenario: Block non-curated plugins

- **WHEN** a plugin is requested that is not in the curated registry
- **THEN** the skill rejects the installation and raises a security warning

### Requirement: Plugin Configuration

The skill SHALL apply default configuration settings to installed plugins where applicable.

#### Scenario: Configure contact form plugin

- **WHEN** Contact Form 7 is installed
- **THEN** the skill creates a default contact form with standard fields (name, email, message)

#### Scenario: Configure SEO plugin

- **WHEN** Yoast SEO is installed
- **THEN** the skill sets basic SEO settings (sitemap enabled, social meta tags enabled)

### Requirement: Plugin Update Checks

The skill SHALL optionally check for plugin updates and install the latest stable versions.

#### Scenario: Install latest plugin version

- **WHEN** the skill installs a plugin without version specification
- **THEN** it installs the latest stable version available

#### Scenario: Update outdated plugins

- **WHEN** the skill detects installed plugins have updates
- **THEN** it optionally updates them to the latest stable versions

### Requirement: Plugin Compatibility Validation

The skill SHALL verify plugin compatibility with the installed WordPress version.

#### Scenario: Compatible plugin installation

- **WHEN** a plugin supports the current WordPress version
- **THEN** the installation proceeds normally

#### Scenario: Incompatible plugin warning

- **WHEN** a plugin declares incompatibility with the current WordPress version
- **THEN** the skill logs a warning and optionally skips installation

### Requirement: Plugin Deactivation

The skill SHALL support deactivating plugins when needed for troubleshooting or conflict resolution.

#### Scenario: Deactivate single plugin

- **WHEN** the skill deactivates "problematic-plugin"
- **THEN** it executes 'wp plugin deactivate problematic-plugin'

#### Scenario: Deactivate all plugins

- **WHEN** troubleshooting a plugin conflict
- **THEN** the skill deactivates all plugins at once

### Requirement: Plugin Removal

The skill SHALL support uninstalling plugins and cleaning up their database tables.

#### Scenario: Uninstall plugin completely

- **WHEN** the skill uninstalls "old-plugin"
- **THEN** it executes 'wp plugin uninstall old-plugin --deactivate' and removes database tables

#### Scenario: Deactivate before uninstall

- **WHEN** a plugin is active during uninstall
- **THEN** the skill deactivates it first, then uninstalls

### Requirement: Plugin List Retrieval

The skill SHALL retrieve the list of installed plugins with their status and version information.

#### Scenario: List installed plugins

- **WHEN** the skill queries installed plugins
- **THEN** it returns an array of plugin objects with name, version, status (active/inactive)

#### Scenario: Filter active plugins

- **WHEN** the skill queries for active plugins only
- **THEN** it returns only plugins with status "active"

### Requirement: Plugin Installation Verification

The skill SHALL verify plugins are installed correctly by checking their presence in wp-content/plugins.

#### Scenario: Verify plugin files exist

- **WHEN** a plugin installation completes
- **THEN** the skill confirms the plugin directory exists in wp-content/plugins/

#### Scenario: Verify plugin registered with WordPress

- **WHEN** a plugin is installed
- **THEN** the skill confirms it appears in 'wp plugin list' output

### Requirement: Custom Plugin Upload

The skill SHALL optionally support installing plugins from uploaded ZIP files for custom/premium plugins.

#### Scenario: Install plugin from ZIP

- **WHEN** the skill receives a plugin ZIP file path
- **THEN** it executes 'wp plugin install /path/to/plugin.zip'

#### Scenario: Validate ZIP before installation

- **WHEN** a ZIP file is provided
- **THEN** the skill verifies it contains valid plugin metadata before installing

### Requirement: Plugin Installation Rollback

The skill SHALL support rolling back plugin installations if activation fails.

#### Scenario: Rollback failed plugin

- **WHEN** a plugin installs successfully but fails activation
- **THEN** the skill uninstalls the plugin to restore the prior state

#### Scenario: Retain plugin on soft failure

- **WHEN** a plugin activates with warnings but no fatal errors
- **THEN** the skill retains the installation and logs the warnings

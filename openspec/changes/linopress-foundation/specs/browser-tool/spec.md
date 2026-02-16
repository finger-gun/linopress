# Browser Tool Specification

## ADDED Requirements

### Requirement: Agent-Browser Integration
The system SHALL integrate vercel-labs/agent-browser for headless Chrome automation via CLI commands.

#### Scenario: Initialize browser session
- **WHEN** a skill requests browser automation
- **THEN** the tool launches a headless Chrome instance and returns a session identifier

#### Scenario: Terminate browser session
- **WHEN** browser testing completes
- **THEN** the tool closes the Chrome instance and cleans up resources

### Requirement: URL Allowlist Enforcement
The system SHALL restrict browser navigation to local WordPress URLs only, rejecting external navigation attempts.

#### Scenario: Navigate to local WordPress
- **WHEN** a skill navigates to http://localhost:8080/
- **THEN** the browser loads the page successfully

#### Scenario: Navigate to Docker internal URL
- **WHEN** a skill navigates to http://wordpress:80/
- **THEN** the browser loads the page successfully

#### Scenario: Reject external URL navigation
- **WHEN** a skill attempts to navigate to https://malicious-site.com
- **THEN** the tool rejects the navigation and raises a security violation error

### Requirement: Page Navigation
The system SHALL provide navigation operations to load pages and wait for complete rendering.

#### Scenario: Navigate to homepage
- **WHEN** a skill navigates to http://localhost:8080/
- **THEN** the browser loads the page and waits for the DOMContentLoaded event

#### Scenario: Navigate with timeout
- **WHEN** a page load exceeds the configured timeout (e.g., 30 seconds)
- **THEN** the tool raises a timeout error

#### Scenario: Handle 404 errors
- **WHEN** a skill navigates to a nonexistent page
- **THEN** the tool detects the 404 status and returns an error result

### Requirement: Screenshot Capture
The system SHALL provide screenshot capture of rendered pages for verification and debugging.

#### Scenario: Capture full-page screenshot
- **WHEN** a skill requests a screenshot of http://localhost:8080/about
- **THEN** the tool captures the entire page and saves it as a PNG file

#### Scenario: Capture viewport screenshot
- **WHEN** a skill requests a viewport-only screenshot
- **THEN** the tool captures only the visible area without scrolling

#### Scenario: Screenshot file naming
- **WHEN** screenshots are captured
- **THEN** files are named with format: {site-id}_{page-slug}_{timestamp}.png

### Requirement: Console Error Detection
The system SHALL monitor browser console output and detect JavaScript errors during page loads.

#### Scenario: Detect console errors
- **WHEN** a page loads and JavaScript errors occur
- **THEN** the tool captures console error messages, stack traces, and source locations

#### Scenario: Ignore console warnings
- **WHEN** a page logs console warnings but no errors
- **THEN** the tool treats the page as error-free

#### Scenario: Console error reporting
- **WHEN** console errors are detected
- **THEN** the tool includes them in the result with message, type, and line number

### Requirement: Page Element Inspection
The system SHALL provide operations to inspect page elements for validation purposes.

#### Scenario: Check element exists
- **WHEN** a skill checks for a navigation menu element
- **THEN** the tool queries the DOM and returns true if found

#### Scenario: Extract element text content
- **WHEN** a skill retrieves the text of an h1 element
- **THEN** the tool returns the element's inner text

#### Scenario: Count elements matching selector
- **WHEN** a skill counts all blog post items
- **THEN** the tool returns the number of matching elements

### Requirement: Page Load Performance Metrics
The system SHALL capture page load performance metrics for quality assessment.

#### Scenario: Measure page load time
- **WHEN** a page loads successfully
- **THEN** the tool reports the total load time in milliseconds

#### Scenario: Detect slow loading pages
- **WHEN** a page takes longer than a threshold (e.g., 5 seconds) to load
- **THEN** the tool flags the page as slow-loading in the result

### Requirement: Viewport Configuration
The system SHALL support configurable viewport sizes for responsive design testing.

#### Scenario: Desktop viewport
- **WHEN** a skill sets viewport to 1920x1080
- **THEN** the browser renders pages at desktop resolution

#### Scenario: Mobile viewport
- **WHEN** a skill sets viewport to 375x667 (iPhone SE)
- **THEN** the browser renders pages at mobile resolution

### Requirement: Cookie and Session Handling
The system SHALL support basic cookie operations for testing authenticated pages.

#### Scenario: Set authentication cookie
- **WHEN** a skill sets a WordPress authentication cookie
- **THEN** subsequent page loads include the cookie and access authenticated content

#### Scenario: Clear cookies
- **WHEN** a skill clears browser cookies
- **THEN** subsequent page loads are unauthenticated

### Requirement: Network Request Monitoring
The system SHALL optionally monitor network requests to detect failed asset loads.

#### Scenario: Detect failed image loads
- **WHEN** a page references a missing image
- **THEN** the tool captures the 404 network error for the image request

#### Scenario: Detect failed stylesheet loads
- **WHEN** a page references a nonexistent CSS file
- **THEN** the tool captures the network failure

### Requirement: JavaScript Execution
The system SHALL provide operations to execute custom JavaScript in the page context for advanced validation.

#### Scenario: Execute JavaScript to check page state
- **WHEN** a skill executes JavaScript: document.querySelectorAll('article').length
- **THEN** the tool returns the result from the page context

#### Scenario: Inject JavaScript for validation
- **WHEN** a skill injects a script to check accessibility attributes
- **THEN** the script runs in the page context and returns results

### Requirement: Browser Container Lifecycle
The system SHALL manage the optional browser container lifecycle, starting it on-demand and stopping it when idle.

#### Scenario: Start browser container on first use
- **WHEN** a skill first requests browser automation
- **THEN** the system starts the browserless/chrome container if not already running

#### Scenario: Stop browser container after timeout
- **WHEN** no browser operations occur for a configured idle timeout (e.g., 5 minutes)
- **THEN** the system stops the browser container to free resources

### Requirement: Chrome DevTools Protocol Access
The system SHALL communicate with Chrome via DevTools Protocol (CDP) exposed on port 3000.

#### Scenario: Connect to CDP endpoint
- **WHEN** the browser tool initializes
- **THEN** it connects to ws://browser:3000 (or configured CDP endpoint)

#### Scenario: Handle CDP connection failure
- **WHEN** the browser container is unreachable
- **THEN** the tool raises a connection error with diagnostic information

### Requirement: Page Accessibility Checks
The system SHALL optionally run basic accessibility checks using browser-based validation.

#### Scenario: Check for missing alt text
- **WHEN** a skill runs accessibility validation
- **THEN** the tool detects images without alt attributes

#### Scenario: Check for heading hierarchy
- **WHEN** a skill validates page structure
- **THEN** the tool detects missing h1 or skipped heading levels

### Requirement: Error Screenshot Capture
The system SHALL automatically capture screenshots when page errors are detected.

#### Scenario: Auto-capture on console error
- **WHEN** a page load encounters JavaScript errors
- **THEN** the tool automatically captures a screenshot for debugging

#### Scenario: Auto-capture on navigation failure
- **WHEN** a page navigation fails with a network error
- **THEN** the tool captures a screenshot showing the error state

# Browser Smoke Test Skill Specification

## Purpose

TBD.

## Requirements

### Requirement: Critical Page Testing

The skill SHALL test critical pages (homepage, key landing pages) using headless browser automation.

#### Scenario: Test homepage loads

- **WHEN** the skill runs browser smoke tests
- **THEN** it navigates to the homepage and verifies successful load

#### Scenario: Test all primary navigation pages

- **WHEN** smoke testing a site with About, Services, Contact pages
- **THEN** the skill navigates to each page and verifies successful load

### Requirement: Screenshot Capture

The skill SHALL capture screenshots of tested pages for visual verification.

#### Scenario: Capture homepage screenshot

- **WHEN** the homepage test runs
- **THEN** a full-page screenshot is saved as {siteId}_homepage_{timestamp}.png

#### Scenario: Capture all page screenshots

- **WHEN** smoke testing multiple pages
- **THEN** screenshots are captured for each successfully loaded page

#### Scenario: Screenshot on error

- **WHEN** a page fails to load or has errors
- **THEN** a screenshot is captured showing the error state

### Requirement: Console Error Detection

The skill SHALL monitor browser console for JavaScript errors during page loads.

#### Scenario: Detect JavaScript errors

- **WHEN** a page loads with JavaScript errors
- **THEN** the skill captures error messages, stack traces, and reports them

#### Scenario: Pass test with no console errors

- **WHEN** a page loads without console errors
- **THEN** the browser test passes for that page

#### Scenario: Ignore console warnings

- **WHEN** a page logs console warnings (not errors)
- **THEN** the skill does not fail the test

### Requirement: Page Load Performance

The skill SHALL measure page load times and flag slow-loading pages.

#### Scenario: Measure homepage load time

- **WHEN** the homepage is tested
- **THEN** the skill reports the time from navigation to DOMContentLoaded

#### Scenario: Flag slow pages

- **WHEN** a page takes longer than 5 seconds to load
- **THEN** the skill marks it as slow-loading in the test results

### Requirement: Visual Regression Detection

The skill SHALL optionally detect visual regressions by comparing screenshots to baseline images.

#### Scenario: First test creates baseline

- **WHEN** browser tests run for the first time
- **THEN** screenshots are saved as baseline images

#### Scenario: Subsequent tests compare to baseline

- **WHEN** browser tests run again
- **THEN** the skill compares new screenshots to baseline and flags significant differences

### Requirement: Accessibility Smoke Tests

The skill SHALL run basic accessibility checks on tested pages.

#### Scenario: Check for missing alt text

- **WHEN** a page is tested
- **THEN** the skill detects images without alt attributes

#### Scenario: Check for heading hierarchy

- **WHEN** a page is tested
- **THEN** the skill verifies proper heading structure (h1 present, no skipped levels)

#### Scenario: Check for form labels

- **WHEN** a page contains form fields
- **THEN** the skill verifies each input has an associated label

### Requirement: Mobile Viewport Testing

The skill SHALL optionally test pages in mobile viewport sizes.

#### Scenario: Test in desktop viewport

- **WHEN** no viewport is specified
- **THEN** tests run at 1920x1080 (desktop)

#### Scenario: Test in mobile viewport

- **WHEN** mobile testing is enabled
- **THEN** tests run at 375x667 (iPhone SE) and capture mobile screenshots

### Requirement: Network Error Detection

The skill SHALL detect failed network requests for assets (images, CSS, JS).

#### Scenario: Detect missing image

- **WHEN** a page references a nonexistent image
- **THEN** the skill reports the 404 error for the image URL

#### Scenario: Detect missing stylesheet

- **WHEN** a page references a missing CSS file
- **THEN** the skill reports the failed stylesheet load

#### Scenario: Pass test with no network errors

- **WHEN** all page resources load successfully
- **THEN** the network check passes

### Requirement: Test Result Aggregation

The skill SHALL aggregate results from all page tests into a single browser validation result.

#### Scenario: All pages pass

- **WHEN** all tested pages load without errors
- **THEN** the skill returns browser.pagesLoaded with all page URLs and browser.consoleErrors as empty

#### Scenario: Some pages fail

- **WHEN** 2 of 5 tested pages have errors
- **THEN** the result includes successful pages in pagesLoaded and errors in consoleErrors

### Requirement: Test Timeout

The skill SHALL enforce timeouts on page load operations to prevent hanging tests.

#### Scenario: Page loads within timeout

- **WHEN** a page loads in 10 seconds
- **THEN** the test continues normally

#### Scenario: Page exceeds timeout

- **WHEN** a page takes longer than 30 seconds to load
- **THEN** the skill aborts the test and reports a timeout error

### Requirement: Custom Test Scripts

The skill SHALL optionally execute custom JavaScript validation scripts on pages.

#### Scenario: Run custom validation script

- **WHEN** a custom test script is provided
- **THEN** the skill injects it into the page and captures the result

#### Scenario: Validate contact form exists

- **WHEN** testing a contact page
- **THEN** a custom script checks for the presence of a form element

### Requirement: Screenshot Comparison

The skill SHALL support comparing screenshots to detect layout breaks.

#### Scenario: Compare screenshot pixel-by-pixel

- **WHEN** comparing new screenshot to baseline
- **THEN** the skill calculates pixel difference percentage

#### Scenario: Flag significant visual changes

- **WHEN** screenshot difference exceeds threshold (e.g., 5%)
- **THEN** the skill reports a potential visual regression

### Requirement: Test Retry Logic

The skill SHALL retry failed page tests to handle transient issues.

#### Scenario: Retry on transient error

- **WHEN** a page fails to load due to a network timeout
- **THEN** the skill retries up to 2 times before reporting failure

#### Scenario: Succeed on retry

- **WHEN** a page fails initially but succeeds on retry
- **THEN** the test passes and the retry is logged

### Requirement: Browser Cache Handling

The skill SHALL clear browser cache between tests to ensure clean page loads.

#### Scenario: Clear cache before each test

- **WHEN** testing a new page
- **THEN** the skill clears browser cache and cookies first

#### Scenario: Test with cache disabled

- **WHEN** tests run
- **THEN** browser caching is disabled to ensure fresh resource loads

### Requirement: Interactive Element Testing

The skill SHALL optionally test interactive elements like buttons and links.

#### Scenario: Click primary CTA button

- **WHEN** testing a homepage with a CTA
- **THEN** the skill clicks the button and verifies the expected navigation

#### Scenario: Verify menu links work

- **WHEN** testing navigation
- **THEN** the skill clicks each menu item and confirms the target page loads

## ADDED Requirements

### Requirement: Mobile navigation MUST switch to a toggle pattern at small viewport widths
The frontend SHALL hide inline top-bar navigation links and present a hamburger toggle control when the viewport width is at or below the configured mobile breakpoint.

#### Scenario: Toggle control appears on mobile viewport
- **WHEN** the page is rendered at or below the mobile breakpoint
- **THEN** the top bar displays a hamburger toggle button instead of inline navigation links

#### Scenario: Inline navigation remains on desktop viewport
- **WHEN** the page is rendered above the mobile breakpoint
- **THEN** the top bar displays inline navigation links and no hamburger toggle button

### Requirement: Mobile menu MUST animate in and out when toggled
The frontend SHALL animate mobile menu visibility transitions with smooth enter and exit motion, and SHALL animate the toggle icon between closed and open states.

#### Scenario: Menu opens with animation
- **WHEN** the user activates the hamburger toggle while the menu is closed
- **THEN** the mobile menu becomes visible using an enter animation and the toggle icon transitions to an open-state visual

#### Scenario: Menu closes with animation
- **WHEN** the user activates the hamburger toggle while the menu is open
- **THEN** the mobile menu becomes hidden using an exit animation and the toggle icon transitions back to a closed-state visual

### Requirement: Mobile menu toggle MUST be accessible and keyboard operable
The frontend SHALL expose a semantic button control for the mobile menu with accurate expanded/collapsed state attributes and SHALL support keyboard activation.

#### Scenario: Toggle state is announced for assistive technology
- **WHEN** the menu is closed and then opened by user interaction
- **THEN** the toggle button updates `aria-expanded` from `false` to `true` and references its controlled menu element via `aria-controls`

#### Scenario: Keyboard user can open and close menu
- **WHEN** focus is on the toggle button and the user presses Enter or Space
- **THEN** the menu opens or closes accordingly with the same behavior as pointer activation

### Requirement: Mobile menu MUST close predictably after navigation selection
The frontend SHALL close the open mobile menu when a user activates a navigation link from that menu.

#### Scenario: Menu closes on link activation
- **WHEN** the mobile menu is open and the user selects a navigation link
- **THEN** the navigation action proceeds and the mobile menu returns to the closed state

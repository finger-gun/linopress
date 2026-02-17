## ADDED Requirements

### Requirement: Hero prompt examples SHALL rotate through a deterministic list
The landing page hero prompt example component MUST cycle through a predefined ordered list of example prompts sourced from static code/content in the landing page implementation.

#### Scenario: Initial prompt is shown before any rotation
- **WHEN** the landing page is first rendered
- **THEN** one valid example prompt from the configured list is visible in the hero prompt example area

#### Scenario: Prompt advances on schedule
- **WHEN** the configured rotation interval elapses while the page remains active
- **THEN** the next prompt in the predefined list replaces the current prompt

#### Scenario: Rotation wraps to start after last prompt
- **WHEN** the currently displayed prompt is the final entry in the predefined list and the next interval elapses
- **THEN** the first prompt in the list is displayed next

### Requirement: Prompt transitions SHALL preserve readability and accessibility
The rotating prompt behavior MUST avoid disruptive motion, maintain legibility during transitions, and respect user reduced-motion preferences.

#### Scenario: Reduced motion preference is honored
- **WHEN** the user has an active `prefers-reduced-motion: reduce` setting
- **THEN** the prompt example is shown without animated transition effects or with minimal motion fallback

#### Scenario: Prompt remains legible during transition
- **WHEN** the component transitions from one prompt to another
- **THEN** text remains readable and does not disappear for a prolonged interval

### Requirement: Rotation SHALL degrade gracefully when scripting is unavailable
The landing page MUST provide a static prompt example fallback in markup so the hero area remains meaningful if client-side JavaScript fails or is disabled.

#### Scenario: JavaScript unavailable
- **WHEN** page scripts do not execute
- **THEN** a static example prompt remains visible in the hero prompt area

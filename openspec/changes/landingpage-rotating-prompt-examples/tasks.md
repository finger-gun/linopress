## 1. Prompt Rotation Implementation

- [x] 1.1 Add a deterministic array of curated prompt examples in the landing page script/context.
- [x] 1.2 Implement timer-based rotation logic that advances through prompts in order and wraps to the first entry after the last.
- [x] 1.3 Ensure initial fallback prompt is present in HTML so content remains meaningful if scripts do not run.

## 2. Presentation and Accessibility

- [x] 2.1 Add/update transition styling so prompt changes are smooth and readable without disruptive motion.
- [x] 2.2 Implement reduced-motion behavior using `prefers-reduced-motion` to disable or minimize animation.
- [x] 2.3 Stabilize layout for variable prompt lengths to avoid jarring visual shifts during rotation.

## 3. Verification

- [x] 3.1 Manually verify rotation cadence, ordering, and wraparound behavior in the browser.
- [x] 3.2 Validate reduced-motion and no-script fallback behavior to ensure accessibility and graceful degradation.
- [x] 3.3 Confirm no external network dependency is introduced for prompt content and document final prompt list in code comments.

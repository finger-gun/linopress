## 1. Project Setup

- [ ] 1.1 Create `app/` directory with Next.js 14 scaffolding using `npx create-next-app@latest`
- [ ] 1.2 Configure `app/package.json` with dependencies: Next.js, React, TypeScript, Node types
- [ ] 1.3 Set up `app/tsconfig.json` with strict mode and path aliases
- [ ] 1.4 Create `.env.local` with `LINOPRESS_CLI_PATH`, `EXPORT_DIR`, `MAX_CONCURRENT_BUILDS`
- [ ] 1.5 Add `app/.gitignore` excluding `node_modules`, `.next`, `.env.local`

## 2. CSS Design System

- [ ] 2.1 Extract CSS custom properties from `landingpage/styles.css` into `app/styles/tokens.css`
- [ ] 2.2 Create `app/styles/globals.css` with reset and base styles
- [ ] 2.3 Copy grain texture, glow, and electric border animations to `globals.css`
- [ ] 2.4 Create component-specific stylesheets: `prompt-panel.css`, `build-progress.css`, `site-preview.css`
- [ ] 2.5 Import Google Fonts (Outfit, JetBrains Mono) in root layout

## 3. Landing Page Port

- [ ] 3.1 Create `app/src/app/page.tsx` as root landing page
- [ ] 3.2 Port hero section HTML from `landingpage/index.html` to React JSX
- [ ] 3.3 Port features, flow, trust, and CTA sections to React components
- [ ] 3.4 Implement rotating prompt examples animation with React hooks
- [ ] 3.5 Verify visual fidelity matches `landingpage/index.html` exactly
- [ ] 3.6 Copy logo SVG files to `app/public/assets/`

## 4. Frontend Data Contracts & Mock Store

- [ ] 4.1 Create `app/src/lib/build-service.ts` with frontend service interface (`createBuild`, `subscribe`, `getBuild`, `cancelBuild`)
- [ ] 4.2 Define TypeScript types: `BuildState`, `BuildStep`, `BuildRequest`, `BuildStatus`, `BuildLogEntry`
- [ ] 4.3 Implement deterministic frontend buildId generator suitable for mock runtime
- [ ] 4.4 Create `app/src/lib/mock-build-service.ts` with in-memory state and fixture-driven transitions
- [ ] 4.5 Add helper functions for fixture selection, status transitions, and simulated timing controls

## 5. Mock Build Creation Flow (UI-facing)

- [ ] 5.1 Wire prompt submission to `buildService.createBuild()` instead of API routes
- [ ] 5.2 Validate `BuildRequest` in frontend service boundary (prompt required, max 2000 chars)
- [ ] 5.3 Initialize mock build state with status `queued` and seeded pipeline steps
- [ ] 5.4 Simulate transition from `queued` to `running` with deterministic timer behavior
- [ ] 5.5 Return `{ buildId, status: "queued", estimatedDuration }` from mock service
- [ ] 5.6 Add error-path fixtures for failed build start and validation rejection

## 6. Mock Status Retrieval Flow

- [ ] 6.1 Implement `buildService.getBuild(buildId)` for details and reload-safe fallback behavior
- [ ] 6.2 Return full `BuildState` including steps, timestamps, mock bundle metadata, and screenshots
- [ ] 6.3 Handle unknown buildId with frontend-friendly not-found state
- [ ] 6.4 Add fixture variants for completed, failed, and cancelled builds

## 7. Mock Progress Subscription Flow

- [ ] 7.1 Implement `buildService.subscribe(buildId, onUpdate)` event subscription contract
- [ ] 7.2 Emit state updates at fixed intervals to simulate live progress
- [ ] 7.3 Stop updates and cleanup timers when build reaches terminal state
- [ ] 7.4 Support unsubscribe behavior on route unmount/navigation
- [ ] 7.5 Simulate disconnect/reconnect UX states for progress page resilience testing

## 8. Download Action Shell (Non-functional)

- [ ] 8.1 Create `Download bundle` UI action wired to mock handler
- [ ] 8.2 Show phase-1 message indicating backend download is not yet implemented
- [ ] 8.3 Render mock bundle metadata (name, size, timestamp, contents list)
- [ ] 8.4 Add disabled/loading/error visual states for future integration

## 9. Prompt Composer UI

- [ ] 9.1 Create `app/src/app/new/page.tsx` route for prompt composer
- [ ] 9.2 Create `app/src/components/PromptPanel.tsx` component with controlled textarea
- [ ] 9.3 Implement style seed picker (3 buttons: bold, elegant, minimalist)
- [ ] 9.4 Create collapsible advanced options section with plugin checkboxes, language/timezone selectors
- [ ] 9.5 Add prompt validation (20-2000 chars) with error messages
- [ ] 9.6 Implement "Generate site" button calling POST `/api/builds/create`
- [ ] 9.7 Redirect to `/builds/[id]` on successful submission
- [ ] 9.8 Apply electric border animation CSS from landing page

## 10. Build Progress UI

- [ ] 10.1 Create `app/src/app/builds/[id]/page.tsx` route
- [ ] 10.2 Create `app/src/components/BuildProgress.tsx` component
- [ ] 10.3 Connect component to `buildService.subscribe()` updates
- [ ] 10.4 Render 11 build steps with icons: ✓ (complete), ⏳ (active), ⏸ (pending), ✗ (failed)
- [ ] 10.5 Update step states on service events
- [ ] 10.6 Calculate and display progress bar (completed / total * 100%)
- [ ] 10.7 Show elapsed time with `setInterval` updating every second
- [ ] 10.8 Display estimated remaining time (optional for v1)
- [ ] 10.9 Redirect to `/sites/[id]` when build completes

## 11. Build Progress - Logs Viewer

- [ ] 11.1 Add collapsible "View logs" section in build progress page
- [ ] 11.2 Implement mock log streaming from fixture timeline events
- [ ] 11.3 Render logs in monospace font with auto-scroll behavior
- [ ] 11.4 Disable auto-scroll when user manually scrolls up

## 12. Build Progress - Cancellation

- [ ] 12.1 Add "Cancel build" button in build progress UI
- [ ] 12.2 Show confirmation dialog before cancellation
- [ ] 12.3 Implement cancel logic via `buildService.cancelBuild(buildId)` in mock runtime
- [ ] 12.4 Update build status to "cancelled" in queue
- [ ] 12.5 Close mock subscription on cancellation

## 13. Site Details UI

- [ ] 13.1 Create `app/src/app/sites/[id]/page.tsx` route
- [ ] 13.2 Fetch build details via `buildService.getBuild(buildId)`
- [  ] 13.3 Create `app/src/components/SitePreview.tsx` component
- [ ] 13.4 Display site name, completion status, build duration
- [ ] 13.5 Implement screenshots carousel with prev/next navigation
- [ ] 13.6 Display metadata cards: Pages, Theme, Plugins, Technical details
- [ ] 13.7 Show bundle information: size, contents list, timestamp
- [ ] 13.8 Add "Download bundle" button with mock/placeholder integration copy
- [ ] 13.9 Add "Build another site" button navigating to `/new`

## 14. Error Handling

- [ ] 14.1 Create `app/src/app/error.tsx` error boundary component
- [ ] 14.2 Add error states for failed builds in site details page
- [ ] 14.3 Implement mock subscription reconnection UX with exponential backoff simulation
- [ ] 14.4 Add toast notifications for API errors (optional: use Sonner or custom)
- [ ] 14.5 Handle 404 for missing builds gracefully

## 15. Responsive Design

- [ ] 15.1 Test prompt panel on mobile (<768px) and adjust to single column layout
- [ ] 15.2 Make build progress steps responsive (collapse step numbers on small screens)
- [ ] 15.3 Ensure screenshots carousel works on touch devices
- [ ] 15.4 Test and fix any overflow issues in navigation

## 16. Testing & Validation

- [ ] 16.1 Test full UI flow: prompt → mock build progress → site details on development server
- [ ] 16.2 Verify CSS matches landing page aesthetic (electric border, grain, colors)
- [ ] 16.3 Test subscription disconnection and reconnection scenarios
- [ ] 16.4 Test build cancellation and timer/resource cleanup
- [ ] 16.5 Verify download action shell states and placeholder messaging
- [ ] 16.6 Check accessibility: keyboard navigation, ARIA labels, color contrast

## 17. Documentation

- [ ] 17.1 Create `app/README.md` with setup instructions
- [ ] 17.2 Document environment variables in README
- [ ] 17.3 Add development server commands (`npm run dev`, `npm run build`)
- [ ] 17.4 Document phase-1 limitation: frontend UI only, backend integration deferred
- [ ] 17.5 Update root `README.md` linking to frontend app

## 18. Production Readiness

- [ ] 18.1 Add backend handoff checklist mapping each mock service method to future API endpoint
- [ ] 18.2 Define event contract for future SSE transport compatibility
- [ ] 18.3 Add technical debt notes for replacing mock download with streamed bundle endpoint
- [ ] 18.4 Document acceptance criteria for starting backend phase
- [ ] 18.5 Optimize Next.js build output (minimize bundle size)

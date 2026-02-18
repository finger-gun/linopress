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

## 4. API Layer - Build Queue

- [ ] 4.1 Create `app/src/lib/build-queue.ts` with in-memory `Map<buildId, Build>` state
- [ ] 4.2 Define TypeScript types: `Build`, `BuildStep`, `BuildRequest`, `BuildStatus`
- [ ] 4.3 Implement `generateBuildId()` using `crypto.randomBytes(12).toString('hex')`
- [ ] 4.4 Implement `reconstructBuildsFromExports()` function to scan `.linopress/exports/` on startup
- [ ] 4.5 Add build queue helper functions: `getBuild()`, `updateBuild()`, `deleteBuild()`

## 5. API Layer - Create Build Endpoint

- [ ] 5.1 Create `app/src/app/api/builds/create/route.ts`
- [ ] 5.2 Implement POST handler validating `BuildRequest` schema (prompt required, max 2000 chars)
- [ ] 5.3 Implement CLI spawn logic: `spawn('node', ['../dist/cli.js', 'build', buildId, '--prompt', ...], { detached: true })`
- [ ] 5.4 Assign random port (8000-9000 offset) for WordPress stack
- [ ] 5.5 Store initial build state in queue with status "queued"
- [ ] 5.6 Return `{ buildId, status: "queued", estimatedDuration: 90 }` JSON response
- [ ] 5.7 Add error handling for CLI spawn failures (return 500)

## 6. API Layer - Status Endpoint

- [ ] 6.1 Create `app/src/app/api/builds/[id]/status/route.ts`
- [ ] 6.2 Implement GET handler fetching build from queue by ID
- [ ] 6.3 Return full `Build` object with steps, timestamps, bundlePath if complete
- [ ] 6.4 Return 404 if buildId not found
- [ ] 6.5 Poll `.linopress/exports/[id]/` directory to update bundle path and screenshots

## 7. API Layer - SSE Streaming Endpoint

- [ ] 7.1 Create `app/src/app/api/builds/[id]/stream/route.ts`
- [ ] 7.2 Implement GET handler returning `ReadableStream` with SSE headers
- [ ] 7.3 Set up polling interval (1000ms) to read build state and emit events
- [ ] 7.4 Emit `data: ${JSON.stringify(build)}\n\n` format for each update
- [ ] 7.5 Close stream when build reaches "complete" or "failed" status
- [ ] 7.6 Handle client disconnections and clean up intervals

## 8. API Layer - Download Endpoint

- [ ] 8.1 Create `app/src/app/api/builds/[id]/download/route.ts`
- [ ] 8.2 Implement GET handler locating bundle file in `.linopress/exports/[id]/`
- [ ] 8.3 Return 404 if bundle file doesn't exist
- [ ] 8.4 Stream .tar.gz file with headers: `Content-Type: application/gzip`, `Content-Disposition: attachment`
- [ ] 8.5 Use `fs.createReadStream()` to avoid loading large files into memory

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
- [ ] 10.3 Implement SSE client using EventSource API connecting to `/api/builds/[id]/stream`
- [ ] 10.4 Render 11 build steps with icons: ✓ (complete), ⏳ (active), ⏸ (pending), ✗ (failed)
- [ ] 10.5 Update step states on SSE messages
- [ ] 10.6 Calculate and display progress bar (completed / total * 100%)
- [ ] 10.7 Show elapsed time with `setInterval` updating every second
- [ ] 10.8 Display estimated remaining time (optional for v1)
- [ ] 10.9 Redirect to `/sites/[id]` when build completes

## 11. Build Progress - Logs Viewer

- [ ] 11.1 Add collapsible "View logs" section in build progress page
- [ ] 11.2 Implement log streaming from CLI stdout/stderr (store in build queue)
- [ ] 11.3 Render logs in monospace font with auto-scroll behavior
- [ ] 11.4 Disable auto-scroll when user manually scrolls up

## 12. Build Progress - Cancellation

- [ ] 12.1 Add "Cancel build" button in build progress UI
- [ ] 12.2 Show confirmation dialog before cancellation
- [ ] 12.3 Implement cancel logic: find CLI process PID and send SIGTERM
- [ ] 12.4 Update build status to "cancelled" in queue
- [ ] 12.5 Close SSE connection on cancellation

## 13. Site Details UI

- [ ] 13.1 Create `app/src/app/sites/[id]/page.tsx` route
- [ ] 13.2 Fetch build details using `/api/builds/[id]/status`
- [  ] 13.3 Create `app/src/components/SitePreview.tsx` component
- [ ] 13.4 Display site name, completion status, build duration
- [ ] 13.5 Implement screenshots carousel with prev/next navigation
- [ ] 13.6 Display metadata cards: Pages, Theme, Plugins, Technical details
- [ ] 13.7 Show bundle information: size, contents list, timestamp
- [ ] 13.8 Add "Download bundle" button linking to `/api/builds/[id]/download`
- [ ] 13.9 Add "Build another site" button navigating to `/new`

## 14. Error Handling

- [ ] 14.1 Create `app/src/app/error.tsx` error boundary component
- [ ] 14.2 Add error states for failed builds in site details page
- [ ] 14.3 Implement SSE reconnection logic with exponential backoff
- [ ] 14.4 Add toast notifications for API errors (optional: use Sonner or custom)
- [ ] 14.5 Handle 404 for missing builds gracefully

## 15. Responsive Design

- [ ] 15.1 Test prompt panel on mobile (<768px) and adjust to single column layout
- [ ] 15.2 Make build progress steps responsive (collapse step numbers on small screens)
- [ ] 15.3 Ensure screenshots carousel works on touch devices
- [ ] 15.4 Test and fix any overflow issues in navigation

## 16. Testing & Validation

- [ ] 16.1 Test full flow: prompt → build → progress → download on development server
- [ ] 16.2 Verify CSS matches landing page aesthetic (electric border, grain, colors)
- [ ] 16.3 Test SSE disconnection and reconnection scenarios
- [ ] 16.4 Test build cancellation and process cleanup
- [ ] 16.5 Verify .tar.gz downloads work for files >100MB
- [ ] 16.6 Check accessibility: keyboard navigation, ARIA labels, color contrast

## 17. Documentation

- [ ] 17.1 Create `app/README.md` with setup instructions
- [ ] 17.2 Document environment variables in README
- [ ] 17.3 Add development server commands (`npm run dev`, `npm run build`)
- [ ] 17.4 Document deployment options (Vercel, self-hosted)
- [ ] 17.5 Update root `README.md` linking to frontend app

## 18. Production Readiness

- [ ] 18.1 Add rate limiting middleware (429 if > `MAX_CONCURRENT_BUILDS`)
- [ ] 18.2 Implement graceful shutdown handlers for active SSE connections
- [ ] 18.3 Add logging for build creation, errors, and completions
- [ ] 18.4 Test server restart with in-progress builds (verify reconstruction)
- [ ] 18.5 Optimize Next.js build output (minimize bundle size)

## Context

Linopress has a mature CLI-based build pipeline but lacks a web interface. The frontend must:
- Maintain the existing CLI as the build engine (no rewrite)
- Provide real-time feedback during 90-120 second builds
- Match the landing page's dark editorial aesthetic with plain CSS
- Support standalone deployment separate from CLI

Current constraints:
- Builds run in isolated Docker stacks (cannot be migrated mid-run)
- No database for persistence yet (v1 uses in-memory state)
- Must work with existing `.linopress/` directory structure

## Goals / Non-Goals

**Goals:**
- Standalone Next.js app in `app/` directory (independent deployment)
- REST API + SSE for build orchestration and progress streaming
- Reuse landing page CSS design system (no Tailwind, no component libraries)
- Simple build queue (spawn CLI via child_process)
- Downloadable .tar.gz bundles from web UI

**Non-Goals:**
- User authentication (v1 is anonymous/trust-based)
- Database persistence (in-memory queue acceptable for MVP)
- Live site previews (export-only workflow)
- Concurrent build limits (manual resource management)
- Modification of existing CLI code

## Decisions

### 1. Frontend Architecture: Next.js 14 App Router

**Decision**: Use Next.js with App Router, TypeScript, plain CSS  
**Rationale**: 
- Server-side rendering for landing page SEO
- API routes colocated with frontend
- SSE support via Response streams
- Zero additional build tooling (no Vite/Webpack config)

**Alternatives considered**:
- SvelteKit: Less mature SSE support, smaller ecosystem
- Vite + Express: Two separate processes to manage
- Plain Node + React SPA: More complex SSE implementation

### 2. Build Execution: CLI via child_process

**Decision**: Spawn `node dist/cli.js build <id> ...` per build request  
**Rationale**:
- Zero changes to existing CLI
- Process isolation (crash-safe)
- Leverage all CLI features (validation, self-healing, export)

**Alternatives considered**:
- Import CLI as library: Would require refactoring CLI for programmatic use
- Queue system (Bull/BullMQ): Over-engineered for v1 scale

**Implementation**:
```typescript
// POST /api/builds/create
const buildId = randomBytes(12).toString('hex');
const child = spawn('node', [
  '../dist/cli.js', 'build', buildId,
  '--prompt', prompt,
  '--port', String(8000 + portOffset),
  '--browser'
], { detached: true, stdio: 'ignore' });
child.unref(); // Don't wait for completion
```

### 3. Progress Streaming: Server-Sent Events (SSE)

**Decision**: SSE over WebSocket for progress updates  
**Rationale**:
- One-way: server → client (no need for bidirectional)
- Built-in reconnection
- Standard HTTP (firewall-friendly)
- Simpler than socket.io dependency

**Alternatives considered**:
- WebSocket: Overkill for one-way streaming
- Polling: Wasteful, delays in feedback

**Implementation**:
```typescript
// GET /api/builds/[id]/stream
export async function GET(req, { params }) {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        const build = buildqueue.get(params.id);
        if (!build) {
          controller.close();
          clearInterval(interval);
          return;
        }
        controller.enqueue(
          `data: ${JSON.stringify(build)}\n\n`
        );
      }, 1000);
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
```

### 4. State Management: In-Memory Map

**Decision**: `Map<buildId, Build>` for v1  
**Rationale**:
- Simple, no DB setup required
- Sufficient for single-server deployment
- Read build artifacts from `.linopress/exports/` for persistence

**Alternatives considered**:
- Redis: Requires separate service
- PostgreSQL: Over-engineered for key-value state
- Filesystem JSON: Race conditions, slow

**Trade-off**: State lost on server restart (acceptable for MVP)

### 5. CSS Architecture: Plain CSS with Design Tokens

**Decision**: Reuse `landingpage/styles.css` tokens, component-specific stylesheets  
**Rationale**:
- Perfect aesthetic continuity
- No framework lock-in
- Electric border animation, grain texture preserved

**File structure**:
```
app/styles/
├── globals.css              # Reset + base
├── tokens.css               # CSS custom properties from landing page
└── components/
    ├── prompt-panel.css
    ├── build-progress.css
    └── site-preview.css
```

**Alternatives considered**:
- Tailwind: Conflicts with custom animations, verbose class names
- CSS-in-JS: Performance overhead, harder to port landing page styles

### 6. Directory Structure: Standalone `app/`

**Decision**: New top-level `app/` directory, not monorepo package  
**Rationale**:
- Simpler deployment (one Git subtree)
- Clear separation from CLI code
- Independent versioning

**Structure**:
```
app/
├── package.json          # Next.js deps
├── src/app/              # Next.js App Router
│   ├── page.tsx                # Landing
│   ├── new/page.tsx            # Prompt composer
│   ├── builds/[id]/page.tsx    # Progress
│   └── api/builds/             # API routes
└── styles/               # Plain CSS
```

## Risks / Trade-offs

### Risk: Stale build state after server restart

**Mitigation**: Read `.linopress/exports/<buildId>/` on app start to reconstruct build map

### Risk: No concurrency limits → resource exhaustion

**Mitigation**:
- Document recommended max (3-5 concurrent builds)
- Add `MAX_CONCURRENT_BUILDS` env var as soft limit (return 429 if exceeded)
- Future: Proper queue system

### Risk: Long-polling SSE connections drain resources

**Mitigation**:
- Close SSE after build completion
- Client reconnects if dropped
- Nginx proxy timeout (120s)

### Risk: CSS drift between landing page and app

**Mitigation**:
- Extract `tokens.css` from `landingpage/styles.css` as single source of truth
- Use same font CDN links
- Add visual regression tests (future)

### Risk: Build ID collision (random bytes)

**Mitigation**: 12-byte hex = 281 trillion combinations (negligible collision chance)

### Trade-off: No authentication → abuse potential

**Decision**: Accept for MVP. Add rate limiting + IP-based quotas in v2.

### Trade-off: In-memory state → builds lost on crash

**Decision**: Accept. Users can restart builds. Add persistence in v2.

## Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  - React components (prompt, progress, preview)              │
│  - EventSource for SSE connection                            │
│  - Fetch API for REST calls                                  │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                Next.js Server (app/)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ API Routes                                          │   │
│  │  - POST /api/builds/create    (spawn CLI)          │   │
│  │  - GET  /api/builds/[id]/status  (read state)      │   │
│  │  - GET  /api/builds/[id]/stream  (SSE)             │   │
│  │  - GET  /api/builds/[id]/download (serve .tar.gz)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Build Queue (in-memory)                             │   │
│  │  Map<buildId, { status, steps, startTime, ... }>   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              │ child_process.spawn           │
│                              ↓                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ exec
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                 Linopress CLI (dist/cli.js)                  │
│  - Unchanged build orchestrator                              │
│  - Docker provisioning                                       │
│  - Agent runtime + skills                                    │
│  - Writes to .linopress/exports/<buildId>/                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ docker exec
                              ↓
┌──────────────────────────────────────────────────────────────┐
│         Docker Containers (per build)                        │
│  - wordpress + db + agent-api + browser                      │
└──────────────────────────────────────────────────────────────┘
```

## Data Models

### BuildRequest (POST /api/builds/create)
```typescript
{
  prompt: string;                    // Required
  styleSeed?: 'bold' | 'elegant' | 'minimalist';
  plugins?: string[];                // WP plugin slugs
  language?: string;                 // WP locale (default: en_US)
  timezone?: string;                 // IANA (default: UTC)
}
```

### Build (in-memory state)
```typescript
{
  id: string;                        // 12-byte hex
  status: 'queued' | 'running' | 'complete' | 'failed';
  prompt: string;
  startedAt: Date;
  completedAt?: Date;
  steps: BuildStep[];
  bundlePath?: string;               // Relative to .linopress/exports/
  screenshots?: string[];            // Paths to PNGs
  error?: string;
}
```

### BuildStep
```typescript
{
  name: string;                      // 'Install WordPress', etc.
  status: 'pending' | 'active' | 'complete' | 'failed';
  duration?: number;                 // Seconds
}
```

## Migration Plan

### Phase 1: Foundation (Week 1)
- Create `app/` directory with Next.js scaffolding
- Port landing page to `/` route
- Set up CSS token system

### Phase 2: API Layer (Week 2)
- Implement POST `/api/builds/create` (spawn CLI)
- Add in-memory build queue
- Test CLI spawning and process cleanup

### Phase 3: Progress Streaming (Week 3)
- Implement GET `/api/builds/[id]/stream` (SSE)
- Poll `.linopress/` for build state updates
- Build React progress component

### Phase 4: Downloads (Week 4)
- Implement GET `/api/builds/[id]/download`
- Add site preview page with screenshots
- Handle error states

### Phase 5: Polish (Week 5)
- Responsive design
- Loading states
- Error boundaries
- Accessibility audit

### Rollback Strategy
- `app/` is standalone - delete directory to rollback
- No changes to CLI - seamless fallback
- No database migrations

## Open Questions

1. **Port assignment strategy**: Random port 8000-9000 or sequential? (Decision: Random for v1)
2. **Screenshot storage**: Keep in `.linopress/` or copy to `app/public/`? (Decision: Serve from .linopress/)
3. **Build retention policy**: Auto-delete after N days? (Decision: Manual cleanup for v1)
4. **Error logging**: stdout/stderr to file or just in-memory? (Decision: In-memory for v1)

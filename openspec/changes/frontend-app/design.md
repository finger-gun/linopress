## Context

Linopress has a mature CLI-based build pipeline but lacks a web interface. The frontend must:
- Deliver the complete product UI shell before backend integration
- Provide realistic interactive flows using frontend-managed mock state
- Match the landing page's dark editorial aesthetic with plain CSS
- Support standalone deployment separate from CLI

Current constraints:
- Builds run in isolated Docker stacks (cannot be migrated mid-run)
- Backend contracts are still evolving and should not block UI delivery
- v1 frontend scope must avoid server/runtime side-effects

## Goals / Non-Goals

**Goals:**
- Standalone Next.js app in `app/` directory (independent deployment)
- UI routes and components for end-to-end user journey (landing → compose → progress → site details)
- Frontend service interfaces and mock adapters that model future API behavior
- Reuse landing page CSS design system (no Tailwind, no component libraries)
- Interactive progress, logs, and site details states rendered in UI

**Non-Goals:**
- User authentication (v1 is anonymous/trust-based)
- Database persistence (in-memory queue acceptable for MVP)
- Live site previews (export-only workflow)
- Concurrent build limits (manual resource management)
- Modification of existing CLI code
- Backend API routes, process spawning, SSE, and real bundle streaming in this phase

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

### 2. Build Execution Simulation: Frontend Mock Adapter

**Decision**: Use a mock build adapter in the frontend that simulates lifecycle transitions (`queued` → `running` → `complete|failed`) and emits deterministic step updates.  
**Rationale**:
- Enables shipping and validating UX without backend coupling
- Preserves future integration shape via typed contracts
- Reduces rework by stabilizing UI behavior and states first

**Alternatives considered**:
- Building API routes now: would split focus and increase implementation risk
- Static-only UI with no simulated behavior: insufficient for validating user journey

**Implementation**:
```typescript
// client-side adapter interface
interface BuildService {
  createBuild(request: BuildRequest): Promise<{ buildId: string }>;
  subscribe(buildId: string, onUpdate: (state: BuildState) => void): () => void;
  getBuild(buildId: string): Promise<BuildState | null>;
}

// mock implementation drives UI transitions with timers
```

### 3. Progress Updates: Client-Side Subscription Interface

**Decision**: Implement progress updates through a frontend subscription contract that can later be backed by SSE without changing UI components.  
**Rationale**:
- Keeps component contracts stable across mocked and real backends
- Allows testing loading, error, and reconnect UX states now
- Defers transport-level decisions to backend phase

**Alternatives considered**:
- Hard-coding timers inside UI components: poor separation of concerns
- Delaying progress page until backend exists: blocks UI validation

**Implementation**:
```typescript
const unsubscribe = buildService.subscribe(buildId, nextState => {
  setBuildState(nextState);
});
```

### 4. State Management: Frontend Store + Fixture Profiles

**Decision**: Use a frontend-local store for transient runtime state plus deterministic fixture profiles for previewing success/failure variants.  
**Rationale**:
- Fast UI iteration with reliable demo states
- No server lifecycle concerns
- Improves testability for visual and interaction states

**Alternatives considered**:
- Using only static JSON snapshots: cannot validate transition UX

**Trade-off**: State resets on page reload (acceptable for UI-only phase)

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
│   └── sites/[id]/page.tsx      # Site details
├── src/lib/
│   ├── build-service.ts         # Service contracts
│   └── mock-build-service.ts    # Mock adapter
└── styles/               # Plain CSS
```

## Risks / Trade-offs

### Risk: Divergence between mock behavior and future backend behavior

**Mitigation**:
- Define strict TypeScript contracts for request/response models
- Keep fixtures aligned with OpenSpec scenarios
- Add explicit integration tasks in follow-up backend change

### Risk: Stakeholders may interpret UI actions as production-ready backend flows

**Mitigation**:
- Add clear documentation that build/download actions are mocked
- Include placeholder copy in UI where appropriate

### Risk: CSS drift between landing page and app

**Mitigation**:
- Extract `tokens.css` from `landingpage/styles.css` as single source of truth
- Use same font CDN links
- Add visual regression tests (future)

### Trade-off: No authentication → abuse potential

**Decision**: Accept for MVP. Add rate limiting + IP-based quotas in v2.

### Trade-off: Frontend-local state → progress resets on refresh

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
│                Next.js Runtime (app/)                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ UI Routes + Components                              │   │
│  │  - /                  (landing)                     │   │
│  │  - /new               (prompt composer)             │   │
│  │  - /builds/[id]       (progress UI)                │   │
│  │  - /sites/[id]        (site details UI)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Build Service Interface                             │   │
│  │  - createBuild()                                    │   │
│  │  - subscribe()                                      │   │
│  │  - getBuild()                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              │ Adapter boundary              │
│                              ↓                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ mocked implementation (phase 1)
                              ↓
┌──────────────────────────────────────────────────────────────┐
│               Future Backend Integration (phase 2)           │
│  - API routes + process orchestration                        │
│  - SSE/stream transport                                      │
│  - Export file serving                                       │
└──────────────────────────────────────────────────────────────┘
```

## Data Models

### BuildRequest (frontend service contract)
```typescript
{
  prompt: string;                    // Required
  styleSeed?: 'bold' | 'elegant' | 'minimalist';
  plugins?: string[];                // WP plugin slugs
  language?: string;                 // WP locale (default: en_US)
  timezone?: string;                 // IANA (default: UTC)
}
```

### BuildState (frontend runtime state)
```typescript
{
  id: string;                        // 12-byte hex
  status: 'queued' | 'running' | 'complete' | 'failed';
  prompt: string;
  startedAt: Date;
  completedAt?: Date;
  steps: BuildStep[];
  bundle?: {
    fileName: string;
    sizeBytes: number;
    ready: boolean;
  };
  screenshots?: string[];            // Mock/static asset URLs in phase 1
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

### Phase 2: Prompt + Progress UI (Week 2)
- Implement prompt composer route and validation
- Implement build progress route with mock state transitions
- Add logs panel and cancellation UX states (frontend only)

### Phase 3: Site Details UI (Week 3)
- Implement site details route and metadata cards
- Add screenshot carousel and bundle information block
- Wire download action to placeholder/mock handler

### Phase 4: Interaction Hardening (Week 4)
- Empty/error/loading states across all pages
- Responsive and accessibility polish
- Contract tests for mock service behaviors

### Phase 5: Polish (Week 5)
- Documentation of phase boundaries and backend handoff notes

### Rollback Strategy
- `app/` is standalone - delete directory to rollback
- No changes to CLI - seamless fallback
- No database migrations

## Open Questions

1. **Mock realism level**: Should mock durations mirror observed CLI timings or be fast for UX development? (Decision: Use realistic defaults with dev override)
2. **Fixture source**: Keep fixtures in TS modules or JSON files under `app/src/fixtures/`? (Decision: JSON fixtures with typed adapters)
3. **Backend handoff boundary**: Which UI actions remain disabled vs enabled-with-placeholder copy? (Decision: Keep actions enabled with explicit phase-1 messaging)
4. **Integration sequencing**: Should backend phase start with create/status APIs or full end-to-end path first? (Decision: create/status first)

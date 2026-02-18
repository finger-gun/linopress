## Why

Linopress currently requires technical users to run CLI commands directly, limiting its reach to command-line comfortable audiences. A browser-based frontend service will make WordPress site generation accessible to non-technical users while maintaining the deterministic, tool-driven build pipeline. This unlocks the product for small business owners, bloggers, and creators who need professional WordPress sites without CLI knowledge.

## What Changes

- Add standalone Next.js 14 frontend application in `app/` directory with plain CSS design system
- Implement prompt composer UI as the primary interface for site creation
- Add frontend-only mocked state flows for build progress and site details pages (no backend integration in this phase)
- Port existing landing page (`landingpage/`) to Next.js with exact visual fidelity
- Add reusable client-side service interfaces that define future backend integration points without implementing server logic

## Capabilities

### New Capabilities
- `frontend-prompt-composer`: Web-based prompt interface with style seed selection, advanced options (plugins, language, timezone), and validation
- `frontend-build-progress`: UI visualization of 11-step build pipeline with simulated progress states and transition behaviors
- `frontend-service-contracts`: Frontend-side typed interfaces and mock adapters that define future backend integration boundaries
- `frontend-site-management`: Site details UI with screenshots carousel, metadata grid, and download action shell (non-functional in this phase)

### Modified Capabilities
<!-- No existing capabilities are being modified at the requirement level -->

## Impact

**New Code**:
- `app/` - Frontend-only Next.js application (routes + components)
- `app/styles/` - CSS design system derived from `landingpage/styles.css`
- `app/src/components/` - React components for prompt panel, build progress, site preview
- `app/src/lib/` - Frontend service interfaces and mock data adapters

**Dependencies**:
- Next.js 14+ (App Router)
- React 18+
- Node.js 20+ (already required)

**Integration Points**:
- Backend integration intentionally deferred to a follow-up OpenSpec change
- Frontend provides typed request/response contracts to reduce future integration risk

**No Breaking Changes**:
- CLI remains fully functional
- All existing Docker configurations unchanged
- Build pipeline steps unmodified

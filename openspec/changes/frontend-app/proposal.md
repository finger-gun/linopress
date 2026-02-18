## Why

Linopress currently requires technical users to run CLI commands directly, limiting its reach to command-line comfortable audiences. A browser-based frontend service will make WordPress site generation accessible to non-technical users while maintaining the deterministic, tool-driven build pipeline. This unlocks the product for small business owners, bloggers, and creators who need professional WordPress sites without CLI knowledge.

## What Changes

- Add standalone Next.js 14 frontend application in `app/` directory with plain CSS design system
- Implement prompt composer UI as the primary interface for site creation
- Create REST API endpoints (`/api/builds/create`, `/api/builds/[id]/status`, `/api/builds/[id]/download`) that bridge frontend to CLI
- Add real-time build progress visualization using Server-Sent Events (SSE)
- Port existing landing page (`landingpage/`) to Next.js with exact visual fidelity
- Provide downloadable site bundles (.tar.gz) through web interface
- Maintain CLI as unchanged backend (no breaking changes to existing CLI interface)

## Capabilities

### New Capabilities
- `frontend-prompt-composer`: Web-based prompt interface with style seed selection, advanced options (plugins, language, timezone), and validation
- `frontend-build-progress`: Real-time visualization of 11-step build pipeline with SSE streaming, progress indicators, and log viewing
- `frontend-api-layer`: Next.js API routes that spawn CLI builds, track state, stream progress events, and serve bundles
- `frontend-site-management`: Site details display with screenshots carousel, metadata grid, and bundle download functionality

### Modified Capabilities
<!-- No existing capabilities are being modified at the requirement level -->

## Impact

**New Code**:
- `app/` - Complete Next.js application (frontend + API routes)
- `app/styles/` - CSS design system derived from `landingpage/styles.css`
- `app/src/components/` - React components for prompt panel, build progress, site preview
- `app/src/lib/` - API client utilities and SSE handling

**Dependencies**:
- Next.js 14+ (App Router)
- React 18+
- Node.js 20+ (already required)
- Docker (already required for CLI)

**Integration Points**:
- API routes spawn existing CLI via `child_process.spawn`
- Frontend reads build artifacts from `.linopress/exports/`
- Reuses existing Docker orchestration, no changes to container architecture

**No Breaking Changes**:
- CLI remains fully functional
- All existing Docker configurations unchanged
- Build pipeline steps unmodified

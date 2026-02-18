# Frontend Service for Linopress — Architecture Exploration

**Date**: 2026-02-18  
**Status**: Exploration  
**Goal**: Design a browser-based frontend service for Linopress that reuses landing page aesthetics with plain CSS and Next.js

---

## Current State

Linopress is currently a **CLI-only tool**:

```bash
node dist/cli.js build yoga-studio \
  --prompt "Create a modern yoga studio website..." \
  --port 8080 --browser
```

**Build Pipeline**: 11 steps, ~90-120 seconds
- Prompt → SiteSpec extraction
- Docker provisioning
- WordPress installation
- Theme + content generation
- Validation + self-healing
- Export bundle (.tar.gz)

---

## Vision: Browser-Based Service

### High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                   │
│                  Standalone /app directory             │
│                     Plain CSS only                     │
└────────────────────────────────────────────────────────┘
                          │
                          │ REST + SSE
                          ↓
┌────────────────────────────────────────────────────────┐
│              Backend (Next.js API Routes)              │
│         Spawns builds via child_process                │
└────────────────────────────────────────────────────────┘
                          │
                          │ Exec
                          ↓
┌────────────────────────────────────────────────────────┐
│          Existing Linopress CLI (unchanged)            │
│              Docker + Agent orchestration              │
└────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
linopress/
├── docs/                    # Existing docs
├── src/                     # Existing CLI source
├── landingpage/            # Existing marketing page
├── skills/                 # Existing agent skills
├── docker/                 # Existing Docker configs
├── .linopress/             # Build artifacts
│
└── app/                    # 🆕 NEW: Frontend service
    ├── package.json        # Next.js 14 + TypeScript
    ├── tsconfig.json
    ├── next.config.js
    │
    ├── public/
    │   ├── assets/         # Copy from ../assets/
    │   └── fonts/          # Outfit + JetBrains Mono
    │
    ├── styles/
    │   ├── globals.css     # Base from landingpage/styles.css
    │   ├── tokens.css      # CSS custom properties
    │   └── components/     # Component-specific styles
    │       ├── prompt-panel.css
    │       ├── build-progress.css
    │       └── site-preview.css
    │
    ├── src/
    │   ├── app/            # Next.js 14 App Router
    │   │   ├── page.tsx                # Landing (port from landingpage/)
    │   │   ├── layout.tsx              # Root layout + global styles
    │   │   ├── new/
    │   │   │   └── page.tsx            # ✨ Prompt composer
    │   │   ├── builds/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx        # Build progress
    │   │   ├── sites/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx        # Site details + download
    │   │   └── api/
    │   │       └── builds/
    │   │           ├── create/
    │   │           │   └── route.ts    # POST: start build
    │   │           ├── [id]/
    │   │           │   ├── status/
    │   │           │   │   └── route.ts    # GET: build status
    │   │           │   ├── stream/
    │   │           │   │   └── route.ts    # GET: SSE progress
    │   │           │   └── download/
    │   │           │       └── route.ts    # GET: .tar.gz
    │   │
    │   ├── components/
    │   │   ├── PromptPanel.tsx
    │   │   ├── StyleSeedPicker.tsx
    │   │   ├── BuildProgress.tsx
    │   │   ├── BuildStepIndicator.tsx
    │   │   ├── SitePreview.tsx
    │   │   └── ExportButton.tsx
    │   │
    │   ├── lib/
    │   │   ├── build-client.ts         # API client
    │   │   ├── sse-client.ts           # SSE utilities
    │   │   └── types.ts                # Shared types
    │   │
    │   └── utils/
    │       ├── format-duration.ts
    │       └── validate-prompt.ts
    │
    └── .env.local          # Environment config
```

---

## Design System (Pure CSS)

### Reusing Landing Page Tokens

The landing page already defines a complete design system. We'll **extend** it, not replace it.

**`app/styles/tokens.css`** (extracted from `landingpage/styles.css`):

```css
:root {
  /* Colors */
  --color-bg: #050505;
  --color-bg-elevated: #0c0c0c;
  --color-surface: rgba(255, 255, 255, 0.03);
  --color-surface-hover: rgba(255, 255, 255, 0.06);
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.15);

  --color-text: #fafafa;
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-text-tertiary: rgba(255, 255, 255, 0.4);

  --color-accent: #00d9ff;
  --color-accent-soft: rgba(0, 217, 255, 0.15);
  --color-accent-glow: rgba(0, 217, 255, 0.4);

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Gradient */
  --gradient-text: linear-gradient(135deg, #00d9ff 0%, #7c3aed 50%, #f472b6 100%);
  --gradient-glow-1: radial-gradient(ellipse at 30% 0%, rgba(0, 217, 255, 0.12) 0%, transparent 50%);
  --gradient-glow-2: radial-gradient(ellipse at 70% 20%, rgba(124, 58, 237, 0.2) 0%, transparent 55%);

  /* Typography */
  --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.75rem;
  --text-5xl: 3.5rem;
  --text-6xl: 4.5rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

**Additional tokens for app-specific components**:

```css
:root {
  /* Build progress colors */
  --color-step-pending: rgba(255, 255, 255, 0.2);
  --color-step-active: var(--color-accent);
  --color-step-complete: var(--color-success);
  --color-step-failed: var(--color-error);

  /* Z-indices */
  --z-base: 1;
  --z-overlay: 10;
  --z-modal: 100;
  --z-tooltip: 200;
  --z-toast: 300;
}
```

---

## Key Pages & Flows

### 1. Landing Page (`/`)

**Purpose**: Marketing, conversion, "Request early access" → `/new`

**Implementation**: Port existing `landingpage/index.html` to React component but keep **exact same** CSS.

```tsx
// app/src/app/page.tsx
import '../styles/landing.css';

export default function Home() {
  return (
    <>
      <div className="grain"></div>
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>

      <header className="site-header">
        <div className="nav-shell">
          <a className="brand" href="/">
            <img src="/assets/linopress-logotype-white.svg" alt="Linopress" />
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          {/* Exact port of landing page hero */}
        </section>
        {/* ... features, flow, trust, cta ... */}
      </main>
    </>
  );
}
```

---

### 2. Prompt Composer (`/new`)

**Purpose**: Primary interface for creating a new WordPress site

**Layout**: Full-height centered prompt panel (hero element)

**Components**:
- `<PromptPanel />` — The star of the show
- `<StyleSeedPicker />` — Visual preset selector (optional, collapsed by default)
- `<AdvancedOptions />` — Plugins, language, timezone (collapsed)

**Flow**:
```
User types prompt → Validation → "Generate site" → POST /api/builds/create → Redirect to /builds/{id}
```

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  ←  Linopress                                        [Docs]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│   ┌────────────────────────────────────────────────────┐   │
│   │ ● ● ●  New WordPress Site                         │   │
│   ├────────────────────────────────────────────────────┤   │
│   │  SITE BRIEF                                        │   │
│   │  ┌──────────────────────────────────────────────┐ │   │
│   │  │ Describe your WordPress site...              │ │   │
│   │  │                                              │ │   │
│   │  │ Build a premium yoga studio website with    │ │   │
│   │  │ class schedules, instructor bios, and       │ │   │
│   │  │ online booking. Modern, calming design.     │ │   │
│   │  │                                              │ │   │
│   │  │                                              │ │   │
│   │  └──────────────────────────────────────────────┘ │   │
│   │                                                    │   │
│   │  Style preset:  [Bold] [Elegant] [Minimal]        │   │
│   │                                                    │   │
│   │  Advanced options ▼                                │   │
│   │                                                    │   │
│   │                    [Preview plan] [Generate site] │   │
│   └────────────────────────────────────────────────────┘   │
│                                                              │
│   💡 Tip: Be specific about pages, features, and style.     │
│      Example: "yoga studio with pricing, testimonials"      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Component: `<PromptPanel />`

```tsx
// app/src/components/PromptPanel.tsx
'use client';

import { useState } from 'react';
import '../styles/components/prompt-panel.css';

export default function PromptPanel() {
  const [prompt, setPrompt] = useState('');
  const [styleSeed, setStyleSeed] = useState<'bold' | 'elegant' | 'minimalist'>('elegant');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    const res = await fetch('/api/builds/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, styleSeed })
    });
    const { buildId } = await res.json();
    window.location.href = `/builds/${buildId}`;
  };

  return (
    <div className="prompt-panel" aria-label="WordPress site prompt composer">
      <div className="prompt-bar">
        <span className="prompt-dot"></span>
        <span className="prompt-dot"></span>
        <span className="prompt-dot"></span>
        <span className="prompt-url">New WordPress Site</span>
      </div>

      <div className="prompt-body">
        <label className="prompt-label">Site brief</label>
        
        <textarea
          className="prompt-textarea"
          placeholder="Describe your WordPress site..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
        />

        <div className="style-seed-picker">
          <span className="prompt-label">Style preset</span>
          <div className="style-seeds">
            {(['bold', 'elegant', 'minimalist'] as const).map((seed) => (
              <button
                key={seed}
                className={`style-seed ${styleSeed === seed ? 'active' : ''}`}
                onClick={() => setStyleSeed(seed)}
              >
                {seed}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced options {showAdvanced ? '▲' : '▼'}
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            {/* Plugin checkboxes, language selector, etc. */}
          </div>
        )}

        <div className="prompt-actions">
          <button className="btn btn-ghost">Preview plan</button>
          <button 
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
          >
            Generate site
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Build Progress (`/builds/[id]`)

**Purpose**: Real-time build progress visualization (90-120 seconds)

**Data source**: Server-sent events (SSE) from `/api/builds/[id]/stream`

**Layout**: Vertical step progress + log viewer + tips sidebar

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Building your site...                        ⏱ 45s elapsed │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────┐  ┌──────────────────┐ │
│  │ Build Progress                  │  │ Did you know?    │ │
│  │                                 │  │                  │ │
│  │ ✓ Extract specification    8s  │  │ Linopress uses   │ │
│  │ ✓ Provision stack          6s  │  │ deterministic    │ │
│  │ ✓ Install WordPress       18s  │  │ builds: same     │ │
│  │ ⏳ Install plugins         ...  │  │ prompt = same    │ │
│  │ ⏸ Generate theme               │  │ output, always.  │ │
│  │ ⏸ Create content               │  │                  │ │
│  │ ⏸ Validate site                │  │ [Learn more]     │ │
│  │ ⏸ Export bundle                │  │                  │ │
│  │                                 │  └──────────────────┘ │
│  │ ━━━━━━━━━━━━━━━━━━━━  45%     │                        │
│  │                                 │                        │
│  │ 55 seconds remaining            │                        │
│  │                                 │                        │
│  │ [View logs ▼]                   │                        │
│  └─────────────────────────────────┘                        │
│                                                              │
│  [Cancel build]                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Component: `<BuildProgress />`

```tsx
// app/src/components/BuildProgress.tsx
'use client';

import { useEffect, useState } from 'react';
import '../styles/components/build-progress.css';

interface BuildStep {
  name: string;
  status: 'pending' | 'active' | 'complete' | 'failed';
  duration?: number;
}

interface BuildProgressProps {
  buildId: string;
}

export default function BuildProgress({ buildId }: BuildProgressProps) {
  const [steps, setSteps] = useState<BuildStep[]>([
    { name: 'Extract specification', status: 'pending' },
    { name: 'Provision stack', status: 'pending' },
    { name: 'Install WordPress', status: 'pending' },
    { name: 'Install plugins', status: 'pending' },
    { name: 'Generate theme', status: 'pending' },
    { name: 'Create content', status: 'pending' },
    { name: 'Validate site', status: 'pending' },
    { name: 'Export bundle', status: 'pending' }
  ]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/builds/${buildId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'step_start') {
        setSteps(prev => prev.map((step, i) => 
          i === data.stepIndex 
            ? { ...step, status: 'active' } 
            : step
        ));
      } else if (data.type === 'step_complete') {
        setSteps(prev => prev.map((step, i) => 
          i === data.stepIndex 
            ? { ...step, status: 'complete', duration: data.duration } 
            : step
        ));
      }
    };

    return () => eventSource.close();
  }, [buildId]);

  const progress = (steps.filter(s => s.status === 'complete').length / steps.length) * 100;

  return (
    <div className="build-progress">
      <div className="progress-steps">
        {steps.map((step, i) => (
          <div key={i} className={`progress-step status-${step.status}`}>
            <div className="step-icon">
              {step.status === 'complete' && '✓'}
              {step.status === 'active' && '⏳'}
              {step.status === 'pending' && '⏸'}
              {step.status === 'failed' && '✗'}
            </div>
            <div className="step-content">
              <div className="step-name">{step.name}</div>
              {step.duration && (
                <div className="step-duration">{step.duration}s</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

---

### 4. Site Details & Download (`/sites/[id]`)

**Purpose**: Show completed build, screenshots, metadata, download button

**Layout**: Screenshots carousel + metadata grid + export button

#### Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  ✓ Site built successfully                             [⚙] │
├──────────────────────────────────────────────────────────────┘
│
│  Screenshots
│  ┌────────────────────────────────────────────────────────┐
│  │                                                        │
│  │         [Screenshot: Homepage preview]                │
│  │                                                        │
│  │  ◀  1 / 4  ▶                                          │
│  └────────────────────────────────────────────────────────┘
│
│  Site Details
│  ┌─────────────────────┐  ┌─────────────────────┐
│  │ Pages               │  │ Theme               │
│  │ • Home              │  │ twentytwentyfour    │
│  │ • Classes           │  │ + child theme       │
│  │ • Instructors       │  │                     │
│  │ • Contact           │  │ Plugins             │
│  │                     │  │ • contact-form-7    │
│  └─────────────────────┘  └─────────────────────┘
│
│  Export
│  ┌────────────────────────────────────────────────────────┐
│  │  site-yoga-studio_2026-02-18.tar.gz                   │
│  │  284 MB                                                │
│  │                                                        │
│  │  Contains: wp-content/, database.sql, manifest.json   │
│  │                                                        │
│  │               [Download bundle ↓]                      │
│  └────────────────────────────────────────────────────────┘
│
│  [Build another site]
│
└────────────────────────────────────────────────────────────────
```

---

## Backend API Design

### API Routes

#### 1. Create Build (`POST /api/builds/create`)

**Request**:
```json
{
  "prompt": "Create a modern yoga studio website...",
  "styleSeed": "elegant",
  "plugins": ["contact-form-7"],
  "language": "en_US",
  "timezone": "UTC"
}
```

**Response**:
```json
{
  "buildId": "abc123def456",
  "status": "queued",
  "estimatedDuration": 90
}
```

**Implementation**:
```ts
// app/src/app/api/builds/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const buildId = randomBytes(12).toString('hex');

  // Spawn CLI process
  const child = spawn('node', [
    '../dist/cli.js',
    'build',
    buildId,
    '--prompt', body.prompt,
    '--port', String(8000 + Math.floor(Math.random() * 1000)),
    '--browser'
  ], {
    detached: true,
    stdio: 'ignore'
  });

  child.unref();

  // Store build metadata (in-memory or DB)
  builds.set(buildId, {
    id: buildId,
    status: 'running',
    startedAt: new Date(),
    prompt: body.prompt
  });

  return NextResponse.json({ buildId, status: 'queued' });
}
```

---

#### 2. Stream Progress (`GET /api/builds/[id]/stream`)

**Server-Sent Events (SSE)** stream

**Event types**:
```
event: step_start
data: {"stepIndex": 2, "stepName": "Install WordPress"}

event: step_complete
data: {"stepIndex": 2, "duration": 18}

event: progress
data: {"percent": 45, "message": "Installing plugins..."}

event: complete
data: {"status": "success", "bundlePath": "..."}
```

**Implementation**:
```ts
// app/src/app/api/builds/[id]/stream/route.ts
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Poll build state and send events
      const interval = setInterval(() => {
        const build = builds.get(params.id);
        
        if (!build) {
          controller.close();
          clearInterval(interval);
          return;
        }

        const data = `data: ${JSON.stringify(build)}\n\n`;
        controller.enqueue(encoder.encode(data));

        if (build.status === 'complete' || build.status === 'failed') {
          controller.close();
          clearInterval(interval);
        }
      }, 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

#### 3. Get Status (`GET /api/builds/[id]/status`)

**Response**:
```json
{
  "id": "abc123def456",
  "status": "complete",
  "startedAt": "2026-02-18T08:00:00.000Z",
  "completedAt": "2026-02-18T08:01:45.000Z",
  "duration": 105,
  "steps": [...],
  "bundlePath": "/exports/abc123def456/site-abc123def456.tar.gz",
  "screenshots": [...]
}
```

---

#### 4. Download Bundle (`GET /api/builds/[id]/download`)

**Implementation**:
```ts
// app/src/app/api/builds/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const bundlePath = join('..', '.linopress', 'exports', params.id, `site-${params.id}.tar.gz`);
  
  if (!existsSync(bundlePath)) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  const stat = statSync(bundlePath);
  const stream = createReadStream(bundlePath);

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="site-${params.id}.tar.gz"`,
      'Content-Length': String(stat.size)
    }
  });
}
```

---

## State Management

**In-memory build queue** (for V1 simplicity):

```ts
// app/src/lib/build-queue.ts
interface Build {
  id: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  prompt: string;
  startedAt: Date;
  completedAt?: Date;
  steps: BuildStep[];
  bundlePath?: string;
  screenshots?: string[];
  error?: string;
}

export const builds = new Map<string, Build>();
```

**For production**: Replace with Redis/PostgreSQL for persistence.

---

## CSS Architecture

### File Organization

```
app/styles/
├── globals.css              # Reset + base styles
├── tokens.css               # CSS custom properties
├── layouts/
│   ├── page-shell.css       # Common page wrapper
│   └── centered-content.css
└── components/
    ├── prompt-panel.css     # The hero component
    ├── build-progress.css   # Step indicators
    ├── style-seed-picker.css
    ├── site-preview.css
    └── button.css           # btn, btn-primary, btn-ghost
```

### Component CSS Pattern

Each component has a dedicated CSS file:

```css
/* app/styles/components/build-progress.css */
.build-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-8);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-step {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out);
}

.progress-step.status-complete {
  background: rgba(16, 185, 129, 0.05);
}

.progress-step.status-active {
  background: rgba(0, 217, 255, 0.05);
  border-left: 3px solid var(--color-accent);
}

.step-icon {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
}

.progress-step.status-complete .step-icon {
  color: var(--color-success);
}

.progress-step.status-active .step-icon {
  color: var(--color-accent);
  animation: pulse 2s ease-in-out infinite;
}

.progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), var(--color-success));
  transition: width var(--duration-slow) var(--ease-out);
}
```

---

## Technical Decisions

### Why SSE over WebSocket?

**Server-Sent Events (SSE)** for build progress:
- ✅ Simpler than WebSocket (one-way: server → client)
- ✅ Built-in reconnection
- ✅ Works with standard HTTP
- ✅ No need for socket.io dependency

**When WebSocket is needed**: If we add interactive features like "pause build" or chat.

---

### Build Execution Strategy

**Option A: Spawn child_process per build** (recommended for V1)
```ts
spawn('node', ['../dist/cli.js', 'build', buildId, ...args])
```
- ✅ Simple
- ✅ Isolated processes
- ⚠️ No concurrency control
- ⚠️ Resource-heavy if many simultaneous builds

**Option B: Job queue with workers** (Bull/BullMQ)
- ✅ Concurrency limits
- ✅ Retry logic
- ✅ Persistence
- ⚠️ More complex

**Recommendation**: Start with A, migrate to B when scaling.

---

### Deployment Considerations

**Development**:
```bash
cd app
npm run dev  # Next.js dev server on :3000
```

**Production**:
```bash
cd app
npm run build
npm start    # Next.js prod server on :3000
```

**Requirements**:
- Node.js 20+
- Docker (for CLI to spawn containers)
- 4GB+ RAM per concurrent build

**Environment variables** (`.env.local`):
```
LINOPRESS_CLI_PATH=../dist/cli.js
EXPORT_DIR=../.linopress/exports
MAX_CONCURRENT_BUILDS=3
ANTHROPIC_API_KEY=sk-...
```

---

## Animations & Polish

### Reuse landing page animations

**Electric border** on prompt panel:
```css
.prompt-panel::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: linear-gradient(115deg,
    rgba(0, 217, 255, 0.38),
    rgba(124, 58, 237, 0.28) 32%,
    rgba(244, 114, 182, 0.34) 56%,
    rgba(0, 217, 255, 0.18) 76%,
    rgba(0, 217, 255, 0.38));
  background-size: 240% 240%;
  animation: prompt-electric-border 7s linear infinite;
  /* ... mask properties ... */
}

@keyframes prompt-electric-border {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**Grain texture** (global):
```css
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,...");
}
```

---

## Next Steps

### Phase 1: Foundation (Week 1)
- [ ] Initialize Next.js project in `app/`
- [ ] Port landing page to `/` route
- [ ] Set up CSS architecture (tokens + components)
- [ ] Create empty routes: `/new`, `/builds/[id]`, `/sites/[id]`

### Phase 2: Prompt Composer (Week 2)
- [ ] Build `<PromptPanel />` component
- [ ] Implement style seed picker
- [ ] Add advanced options (collapsed)
- [ ] Create `/api/builds/create` endpoint

### Phase 3: Build Progress (Week 3)
- [ ] Implement SSE streaming (`/api/builds/[id]/stream`)
- [ ] Build `<BuildProgress />` component
- [ ] Add log viewer
- [ ] Test with actual CLI builds

### Phase 4: Site Details (Week 4)
- [ ] Screenshot carousel
- [ ] Metadata display
- [ ] Download endpoint (`/api/builds/[id]/download`)
- [ ] Error states and failed builds

### Phase 5: Polish (Week 5)
- [ ] Loading states
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Responsive design (mobile-first)
- [ ] Accessibility audit

---

## Open Questions

1. **Authentication**: Should we add user accounts, or allow anonymous builds?
2. **Build persistence**: In-memory queue (ephemeral) or database (persistent)?
3. **Concurrency limits**: Max simultaneous builds (3? 5? 10?)?
4. **Preview hosting**: Should we keep Docker stacks alive for live previews, or export-only?
5. **Pricing model**: Free tier (X builds/month), paid plans?

---

## Conclusion

This architecture gives us:

✅ **Clean separation**: Frontend in `app/`, CLI unchanged  
✅ **Aesthetic continuity**: Reuse landing page CSS system  
✅ **Simple backend**: Next.js API routes + child_process  
✅ **Real-time UX**: SSE for progress streaming  
✅ **Portable**: Easy to deploy (Vercel, Railway, self-hosted)  

**Core principle**: The prompt panel is the hero. Everything else supports it.

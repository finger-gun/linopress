# Linopress Frontend App

The frontend in [`app/`](app/README.md) is the user-facing prompt experience for Linopress. It is a Next.js App Router application where users describe a website idea and interact with the prompt composer UI.

This package currently focuses on:
- A polished index-page prompt interface
- Local, client-side interaction behavior
- Fast iteration for UX and component architecture

## What this app is

This frontend is the presentation layer for the “prompt-first” workflow. It does **not** execute build orchestration directly; instead, it provides the UI surface where users compose intent.

Key UI areas include:
- Top navigation/header via [`TopBar.tsx`](src/app/components/TopBar.tsx)
- Hero messaging via [`HeroCta.tsx`](src/app/components/HeroCta.tsx)
- Prompt composition and actions via [`PromptComposer.tsx`](src/app/components/PromptComposer.tsx)

## Core principles

1. **UI-first clarity**
   - Components should make user intent obvious and reduce ambiguity while typing.

2. **Local-first interactions**
   - UX guidance (such as contextual prompt tips) should run locally when possible, without unnecessary network coupling.

3. **Component ownership**
   - Component logic lives with component styling (e.g. [`PromptComposer.tsx`](src/app/components/PromptComposer.tsx) + [`PromptComposer.module.css`](src/app/components/PromptComposer.module.css)).

4. **MVP-safe behavior**
   - Frontend interactions should preserve current MVP boundaries unless explicitly expanded in OpenSpec changes.

5. **Incremental evolution through OpenSpec**
   - Product-facing behavior should be guided by change artifacts under [`openspec/changes/`](../openspec/changes/).

## Tech stack

- Next.js (App Router)
- React + TypeScript
- CSS Modules for component-scoped styles

Main entry points:
- Route component: [`src/app/page.tsx`](src/app/page.tsx)
- Global styles: [`src/app/globals.css`](src/app/globals.css)
- Route layout: [`src/app/layout.tsx`](src/app/layout.tsx)

## How to run

From the repo root, this app lives in [`app/`](app/README.md). In a terminal:

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run from repo root with pnpm

If you prefer staying at the monorepo root, run:

```bash
pnpm --dir app install
pnpm --dir app dev
```

This starts the same Next.js dev server for [`app/`](app/README.md) without changing directories.

## Useful scripts

Run from [`app/`](app/README.md):

- `npm run dev` – start development server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – run ESLint

## Project structure (high level)

```text
app/
├─ src/app/
│  ├─ page.tsx
│  ├─ page.module.css
│  └─ components/
│     ├─ TopBar.tsx
│     ├─ HeroCta.tsx
│     ├─ PromptComposer.tsx
│     └─ ...
├─ public/
└─ package.json
```

## Development notes

- Keep page-level styles focused on layout primitives in [`page.module.css`](src/app/page.module.css).
- Keep component visuals in their own CSS modules under [`src/app/components/`](src/app/components/TopBar.tsx).
- Prefer extending existing components before introducing parallel patterns.
- Validate UX changes quickly with the local dev server and linting.

## Related documentation

- Root project overview: [`README.md`](../README.md)
- Agent conventions: [`AGENT.md`](../AGENT.md)
- Architecture notes: [`docs/architecture.md`](../docs/architecture.md)
- Active/archived change specs: [`openspec/`](../openspec/config.yaml)

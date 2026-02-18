## Why

Build already runs self-review and improvement, but it is locked inside the build flow. A standalone `linopress selfimprove` command lets users iterate on quality without rebuilding, and makes the feedback loop more accessible and repeatable.

## What Changes

- Add a new CLI command `linopress selfimprove` that runs the existing self-review + improvement loop outside of build.
- Implement site selection: if only one site stack exists, infer it; if multiple exist, require `--site` and fail with a clear message.
- Expose a more aggressive improvement mode (tighter loop or stricter criteria) while preserving the same safety limits as build.
- Goal: enable repeated, fast quality passes on an existing site without triggering a full build.
- Non-goals: altering build defaults, expanding browser allowlist, or adding multi-site management features.
- Success criteria (demo): with a single site stack running, `linopress selfimprove` performs the browser review, applies at least one improvement cycle, and outputs a report; with two stacks, running without `--site` exits with a helpful error, and running with `--site <id>` completes the same loop.

## Capabilities

### New Capabilities

- `selfimprove-command`: Standalone self-review and improvement CLI flow with site selection rules and reporting.

### Modified Capabilities

## Impact

- CLI command surface and help output.
- Build/self-heal orchestration paths reused by the new command.
- Agent-browser usage remains limited to local WordPress base URL; sandbox model stays one site per isolated stack with no external navigation.

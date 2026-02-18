## Why

Today LinoPress only accepts text prompts or a SiteSpec JSON, which limits users who want to anchor the design to real-world visual inspiration. Adding optional image inputs makes it easier to request “build something like this” experiences while keeping the build workflow deterministic and secure.

## What Changes

- Add a way to provide one or more inspiration images when starting a new page build, alongside prompt and/or SiteSpec JSON.
- Extend the CLI to accept image paths as flags, supporting both individual files and directories.
- Ensure image inputs are used by vision-capable agents during generation without expanding tool or URL permissions.
- Define how image inputs are represented in build requests and retained in reports/manifests.
- Non-goals: external image fetching, remote URLs, or unrestricted file system access.
- Success criteria (demo): user runs `linopress build --images ./inspo/ --prompt "I want a website that looks like this, but it should be for a book author."`, the build reads the local images, passes them to the agent, and completes with a report referencing the inspiration inputs.

## Capabilities

### New Capabilities

- `image-inspiration-input`: Accept and validate local image inputs for build requests and make them available to vision-capable agents.

### Modified Capabilities

## Impact

- CLI argument parsing and help output.
- Build request payload and storage of inputs (report/manifest).
- Agent orchestration to pass image inputs into the generation flow.
- File access constraints remain limited to approved local paths; sandbox model unchanged.

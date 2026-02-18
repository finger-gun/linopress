## 1. CLI surface and site selection

- [ ] 1.1 Locate existing CLI command registry and add `selfimprove` command wiring
- [ ] 1.2 Implement argument parsing for `--site <id>` and aggressive mode flag
- [ ] 1.3 Add site discovery and selection logic (auto-select one, require flag for many)
- [ ] 1.4 Add clear error messaging and help text for missing `--site`

## 2. Orchestration reuse

- [ ] 2.1 Identify build self-review/self-heal entry point to reuse
- [ ] 2.2 Add `mode: "selfimprove"` path in orchestrator with proper branching
- [ ] 2.3 Configure aggressive mode parameters (stricter thresholds or +1 cycle) with safety caps
- [ ] 2.4 Ensure selfimprove uses existing tool allowlists and URL allowlist

## 3. Reporting and validation

- [ ] 3.1 Ensure selfimprove emits a BuildReport-compatible output
- [ ] 3.2 Add report summary for improvements applied and failures
- [ ] 3.3 Add regression check to verify external URL attempts are blocked and reported

## 4. Tests and docs

- [ ] 4.1 Add CLI tests for single-site auto-selection and multi-site `--site` requirement
- [ ] 4.2 Add tests for aggressive mode limits and loop caps
- [ ] 4.3 Update CLI documentation/README with the new command and examples

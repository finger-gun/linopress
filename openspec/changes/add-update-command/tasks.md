## 1. CLI Surface and Validation

- [x] 1.1 Add `linopress update` command definition with `--prompt` and optional `--site` flags
- [x] 1.2 Implement input validation for update requests (missing prompt, invalid site id)
- [x] 1.3 Add default site resolution when only one stack exists; require `--site` when multiple stacks exist
- [x] 1.4 Update CLI help/usage text with examples for single-stack and multi-stack usage

## 2. Update Orchestration

- [x] 2.1 Add UpdateRequest data model and wire into agent API input handling
- [x] 2.2 Implement Update Orchestrator that targets an existing site stack
- [x] 2.3 Enforce update tool allowlist in orchestration pipeline
- [x] 2.4 Apply update prompt using existing skills (page builder/theme generator/wp-cli)
- [ ] 2.5 Introduce analyze → plan → apply phases with explicit tool usage and JSON outputs
- [ ] 2.6 Require at least one write during apply or mark update as failed
- [ ] 2.7 Add deterministic fallback edits for template-driven homepages (theme.json / templates)

## 3. Validation, Healing, and Reporting

- [x] 3.1 Run CLI validation and browser smoke tests after update execution
- [x] 3.2 Reuse self-healing loop for updates (max two cycles)
- [x] 3.3 Emit BuildReport with `mode: "update"` and include update prompt/input metadata
- [ ] 3.4 Use control-flow middleware to manage update pipeline and review loops

## 4. Export and Observability

- [x] 4.1 Trigger export bundle on successful update
- [x] 4.2 Add update progress logging for each orchestration step
- [ ] 4.3 Swap console logs to Sisu logger for update pipeline events

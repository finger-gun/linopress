## 1. CLI and input validation

- [ ] 1.1 Add repeatable `--images` flag to build CLI command and help text
- [ ] 1.2 Implement image path resolver for files and directories (png/jpg/jpeg/webp)
- [ ] 1.3 Add validation errors for missing/unreadable paths and empty directories
- [ ] 1.4 Add de-duplication and deterministic ordering of resolved image paths

## 2. Build request and orchestration

- [ ] 2.1 Extend build request schema to include `inspirationImages` metadata
- [ ] 2.2 Pass image references into agent context for vision-capable models
- [ ] 2.3 Restrict file-tool access to the resolved image list (or staging dir)

## 3. Reporting and guardrails

- [ ] 3.1 Update BuildReport/manifest to include inspiration image references
- [ ] 3.2 Add caps for max image count/size and warning when trimming
- [ ] 3.3 Ensure builds without images behave unchanged and report correctly

## 4. Tests and docs

- [ ] 4.1 Add CLI tests for file inputs, directory expansion, and validation errors
- [ ] 4.2 Add orchestration tests for agent context image injection
- [ ] 4.3 Update documentation with examples for `--images` usage

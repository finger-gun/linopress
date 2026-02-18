---
description: Apply a patch to an existing spec/change, then continue implementation
---

Apply a user-provided patch/change to an existing OpenSpec change (or spec delta), then continue implementing remaining tasks.

**Input**: Optionally specify a change name after `/opsx:patch` (e.g., `/opsx:patch add-auth`) plus patch details in the user message.

Patch details may be provided as:
- Natural language instructions
- Requirement-level edits (add/modify/remove/rename)
- A diff-like snippet

**Steps**

1. **Select the target change**

   If a name is provided, use it. Otherwise:
   - Infer from recent context only if unambiguous
   - If ambiguous, run `openspec list --json` and use the **AskUserQuestion tool** to let the user choose

   Always announce: "Using change: <name>" and how to override (`/opsx:patch <other>`).

2. **Inspect change status and schema**

   ```bash
   openspec status --change "<name>" --json
   ```

   Parse:
   - `schemaName`
   - Artifact/task readiness
   - Whether implementation is already complete

3. **Collect patch intent before editing**

   Build a precise patch plan from user input:
   - What capability/spec is affected
   - Which requirement(s) change
   - Whether each change is ADDED / MODIFIED / REMOVED / RENAMED

   If anything is unclear or conflicting, pause and ask a targeted clarification question before editing.

4. **Apply the patch to spec artifacts**

   Prefer patching the change’s delta specs under:
   - `openspec/changes/<name>/specs/<capability>/spec.md`

   Patch using OpenSpec delta sections:
   - `## ADDED Requirements`
   - `## MODIFIED Requirements`
   - `## REMOVED Requirements`
   - `## RENAMED Requirements`

   Rules:
   - Preserve unrelated content
   - Keep edits minimal and explicit
   - If a capability delta spec does not exist yet, create it with a brief Purpose and the required requirement changes

5. **Keep implementation artifacts aligned**

   If the patch changes implementation scope or behavior, update affected artifacts in the same change:
   - `design.md` (technical approach changes)
   - `tasks.md` (new/changed work items)

   Keep updates concise and directly traceable to the patch.

6. **Continue into implementation immediately**

   Get apply instructions:

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   Handle states:
   - `blocked`: explain what artifact is missing and suggest `/opsx:continue`
   - `all_done`: report completion and suggest `/opsx:archive`
   - otherwise: proceed to implement pending tasks

7. **Implement pending tasks (same invocation)**

   Read `contextFiles` from apply instructions, then execute pending tasks in order:
   - Announce the current task
   - Make focused code changes
   - Mark completed task checkbox in `tasks.md` (`- [ ]` → `- [x]`)
   - Continue until done or blocked

   Pause if:
   - Requirements remain ambiguous
   - A blocker/error prevents safe progress
   - The patch implies a larger redesign not captured in artifacts

8. **Report patch + implementation outcome**

   Summarize:
   - Patch changes applied (by capability/requirement)
   - Artifact files updated
   - Tasks completed this session
   - Overall progress (`N/M tasks complete`)
   - Next action (`/opsx:archive` if complete, otherwise continue with `/opsx:apply`)

**Output On Success**

```markdown
## Patch Applied + Implementation Continued: <change-name>

**Schema:** <schema-name>

### Spec Patch Applied
- <capability>: <requirement change summary>
- <capability>: <requirement change summary>

### Artifact Updates
- Updated: openspec/changes/<name>/specs/<capability>/spec.md
- Updated: openspec/changes/<name>/design.md (if needed)
- Updated: openspec/changes/<name>/tasks.md (if needed)

### Implementation Progress
- Completed this session: <k> task(s)
- Overall progress: <N>/<M> tasks complete

<If complete:>
All tasks complete. Ready to archive with `/opsx:archive`.

<If not complete:>
Patch is applied and implementation progressed. Continue with `/opsx:apply <name>`.
```

**Guardrails**
- Always patch specs/artifacts before implementation
- Do not skip clarification when patch intent is ambiguous
- Keep edits minimal, deterministic, and scoped
- Preserve unrelated requirements and scenarios
- Ensure `tasks.md` reflects any new scope introduced by the patch
- During implementation, follow apply instructions and update checkboxes immediately
- Stop on blockers instead of guessing
- Never claim completion unless tasks are actually checked off

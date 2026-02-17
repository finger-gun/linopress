# Architecture Diagram

```text
LLM Planner
  -> Skills (wp-install, plugin-installer, theme-generator, page-builder, validator, self-healing)
    -> Tools (wp-cli, file, browser, export)
      -> Docker Sandbox (wordpress + db + agent-api + optional browser)
```

Key boundaries:

- Skills orchestrate tools; they do not mutate state directly.
- Tools are allowlisted and sandboxed.
- Each site runs in an isolated Docker Compose stack.

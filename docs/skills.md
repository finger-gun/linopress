# Adding New Skills

Skills are filesystem-based Claude skills under `skills/<skill-name>/SKILL.md`.

## Structure

```text
skills/
  my-skill/
    SKILL.md
```

## SKILL.md format

```yaml
---
name: my-skill
description: Describe when to use this skill.
---
# My Skill

## Purpose
...
```

## Registration

The agent runtime scans `skills/` by default. No code changes required unless you want a custom path.

## Tips

- Keep skill descriptions concise.
- Include inputs, outputs, and error handling.
- Prefer clear, actionable steps.

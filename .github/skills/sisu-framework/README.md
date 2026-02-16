# Sisu Framework Skill

A Claude Agent Skill for working with the Sisu TypeScript framework for building AI agents.

## What is this?

This is a [Claude Agent Skill](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) that provides comprehensive knowledge about the Sisu framework. It enables Claude to help you build agents using Sisu's middleware-based architecture.

## Structure

```
sisu-framework/
├── SKILL.md            # Main skill instructions (loaded when triggered)
├── CONTROL_FLOW.md     # Control flow patterns (branch, loop, parallel, graph)
├── RAG.md              # Retrieval augmented generation patterns
├── TOOLS.md            # Built-in tools and custom tool creation
├── STREAMING.md        # Token streaming and real-time responses
├── SISU_SKILLS.md      # Sisu's own skills support
├── EXAMPLES.md         # 25+ working examples from the repo
└── README.md           # This file
```

## Using this skill

### In Claude Code

1. Copy this directory to `~/.claude/skills/sisu-framework/`
2. Claude will automatically discover and use it when relevant

### In Claude API

```typescript
import { Agent } from "@sisu-ai/core";
import { skillsMiddleware } from "@sisu-ai/mw-skills";

const app = new Agent().use(
  skillsMiddleware({
    directories: ["./skills"],
  }),
);
// ... rest of your agent setup
```

### In claude.ai

1. Zip this directory
2. Go to Settings > Features
3. Upload the zip file
4. Claude will use it when you ask about Sisu

## What it covers

- **Core concepts** - Context, middleware, tools
- **LLM adapters** - OpenAI, Anthropic, Ollama
- **Middleware** - Control flow, safety, observability
- **Built-in tools** - Web, cloud, dev, data tools
- **Custom tools** - Creating your own tools
- **Error handling** - Structured errors and recovery
- **Streaming** - Real-time token streaming
- **RAG** - Retrieval augmented generation
- **Skills** - Sisu's own skills support
- **Examples** - 25+ working examples

## When Claude uses this skill

Claude automatically loads this skill when you:

- Ask about building AI agents
- Mention Sisu framework
- Need help with middleware patterns
- Want to implement tool calling
- Set up LLM adapters
- Work with control flow
- Build RAG systems
- Debug agent behavior

## Progressive disclosure

The skill uses Claude's progressive disclosure pattern:

1. **Metadata** (always loaded) - Brief description
2. **Main instructions** (loaded on trigger) - SKILL.md
3. **Reference docs** (loaded as needed) - Other .md files

This keeps token usage efficient while providing comprehensive documentation.

## External resources

All external links point to the Sisu GitHub repository:

- [Main repository](https://github.com/finger-gun/sisu)
- [Examples](https://github.com/finger-gun/sisu/tree/main/examples)
- [Middleware packages](https://github.com/finger-gun/sisu/tree/main/packages/middleware)
- [Tools packages](https://github.com/finger-gun/sisu/tree/main/packages/tools)

## Updating this skill

To update:

1. Pull latest Sisu docs from GitHub
2. Update relevant .md files
3. Test with Claude
4. Redistribute to team

## Related

- **Sisu framework**: [github.com/finger-gun/sisu](https://github.com/finger-gun/sisu)
- **Claude Skills docs**: [platform.claude.com/docs/en/agents-and-tools/agent-skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- **Agent guide**: See `SISU_AGENT_GUIDE.md` in the repo root for a portable markdown guide

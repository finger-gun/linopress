# Agent Framework Specification

## Purpose

TBD.

## Requirements

### Requirement: Sisu-Based Agent Runtime

The system SHALL use the Sisu framework (@sisu-ai/core) as the foundation for agent execution with LLM-driven planning.

#### Scenario: Initialize Sisu agent

- **WHEN** the agent-api service starts
- **THEN** the system initializes a Sisu agent instance with configured LLM adapter (Claude or GPT)

#### Scenario: Agent receives user prompt

- **WHEN** a site creation request is submitted with a natural language prompt
- **THEN** the Sisu agent parses the prompt and generates a high-level execution plan

### Requirement: Layered Architecture

The system SHALL implement a four-layer architecture: LLM Planner → Skills → Tools → Sandbox, with strict boundaries between layers.

#### Scenario: LLM plans without direct state mutation

- **WHEN** the LLM planner generates an execution strategy
- **THEN** it produces a sequence of skill invocations but does not directly execute tools or modify the sandbox

#### Scenario: Skills orchestrate tools

- **WHEN** a skill is invoked by the LLM planner
- **THEN** the skill executes one or more allowlisted tool calls but does not directly access the WordPress container

#### Scenario: Tools interact with sandbox

- **WHEN** a tool is called by a skill
- **THEN** the tool performs atomic operations on the Docker sandbox (wp-cli commands, file writes, browser navigation)

### Requirement: Middleware Support

The system SHALL support optional Sisu middleware to extend agent behavior.

#### Scenario: Enable control-flow middleware

- **WHEN** complex workflows require branching or early exit
- **THEN** the system can enable control-flow middleware to manage execution flow

#### Scenario: Enable react parser middleware

- **WHEN** agent responses need structured self-reflection signals
- **THEN** the system can enable the react-parser middleware to interpret those signals

### Requirement: Skill Registration

The system SHALL provide a skill registration mechanism where each skill exports a Sisu skill definition with typed inputs, outputs, and dependencies.

#### Scenario: Register wp-install skill

- **WHEN** the agent-api service initializes
- **THEN** the wpInstallSkill is registered with Sisu and available for the LLM to invoke

#### Scenario: Skill with typed parameters

- **WHEN** a skill is registered with input schema (e.g., pluginInstallerSkill requires pluginName: string)
- **THEN** Sisu validates all invocations have correct parameter types at runtime

#### Scenario: Discover registered skills

- **WHEN** the LLM planner evaluates available capabilities
- **THEN** it can query the list of registered skills and their signatures

### Requirement: Tool Alias Compatibility

The system SHALL register tool aliases to support ecosystem skills that expect snake_case tool names.

#### Scenario: Alias terminal tool names

- **WHEN** registering the Sisu terminal tool
- **THEN** the system aliases terminalRun to bash, terminalReadFile to read_file, and terminalCd to cd

### Requirement: Skill Composability

The system SHALL allow skills to invoke other skills as subroutines, enabling hierarchical task decomposition.

#### Scenario: Self-healing skill calls validator skill

- **WHEN** the selfHealingSkill needs to assess site health
- **THEN** it invokes the siteValidatorSkill and processes the validation results

#### Scenario: Prevent circular skill dependencies

- **WHEN** a skill attempts to invoke itself directly or indirectly
- **THEN** the system detects the cycle and rejects the invocation with an error

### Requirement: State Management

The system SHALL maintain agent state across skill executions, including site metadata, build progress, and error history.

#### Scenario: Track build progress

- **WHEN** the agent completes a skill execution
- **THEN** the system persists the completion status and any generated artifacts to the state store

#### Scenario: Access prior skill outputs

- **WHEN** a downstream skill needs data from an earlier step (e.g., installed plugin list)
- **THEN** it retrieves the data from the agent state without re-executing the prior skill

#### Scenario: State isolation per site

- **WHEN** multiple sites are being built concurrently
- **THEN** each site's agent state is isolated and does not interfere with other sites

### Requirement: Error Handling and Propagation

The system SHALL catch errors at each layer (tool, skill, planner) and propagate structured error information upward for recovery decisions.

#### Scenario: Tool error propagates to skill

- **WHEN** a tool execution fails (e.g., wp-cli command returns non-zero exit code)
- **THEN** the tool raises a structured error with context (command, exit code, stderr) that the skill can catch

#### Scenario: Skill error triggers healing

- **WHEN** a skill execution fails and the error is recoverable
- **THEN** the system invokes the selfHealingSkill with the error context

#### Scenario: Unrecoverable error halts build

- **WHEN** a critical error occurs that cannot be healed (e.g., Docker daemon unreachable)
- **THEN** the system halts execution and generates a failure BuildReport

### Requirement: LLM Adapter Configuration

The system SHALL support multiple LLM providers (OpenAI, Anthropic) via pluggable adapters with consistent interfaces.

#### Scenario: Configure Claude adapter

- **WHEN** the system is configured to use Anthropic Claude
- **THEN** the Sisu runtime initializes with the Claude API adapter and correct model identifier

#### Scenario: Configure GPT adapter

- **WHEN** the system is configured to use OpenAI GPT
- **THEN** the Sisu runtime initializes with the OpenAI API adapter and correct model identifier

#### Scenario: Fallback on adapter failure

- **WHEN** the primary LLM adapter fails (e.g., API timeout)
- **THEN** the system retries with exponential backoff and fails gracefully if retries are exhausted

### Requirement: Execution Tracing

The system SHALL log all agent actions (skill invocations, tool calls, LLM prompts/responses) for debugging and auditability.

#### Scenario: Trace skill execution

- **WHEN** a skill is invoked
- **THEN** the system logs the skill name, input parameters, timestamp, and execution duration

#### Scenario: Trace tool calls

- **WHEN** a tool is executed
- **THEN** the system logs the tool name, parameters, and result (or error)

#### Scenario: Trace LLM interactions

- **WHEN** the LLM planner generates a response
- **THEN** the system logs the prompt sent and the response received (with optional PII redaction)

### Requirement: Skill Timeout Protection

The system SHALL enforce timeout limits on skill executions to prevent runaway operations.

#### Scenario: Skill completes within timeout

- **WHEN** a skill executes and completes in 30 seconds
- **THEN** the result is returned normally

#### Scenario: Skill exceeds timeout

- **WHEN** a skill execution exceeds the configured timeout (e.g., 5 minutes)
- **THEN** the system terminates the skill and raises a timeout error

### Requirement: Tool Allowlisting Enforcement

The system SHALL restrict skills to invoking only allowlisted tools, rejecting any attempts to call unauthorized primitives.

#### Scenario: Skill invokes allowlisted tool

- **WHEN** a skill calls the wp-cli tool
- **THEN** the invocation succeeds because wp-cli is on the allowlist

#### Scenario: Skill attempts to invoke disallowed tool

- **WHEN** a skill attempts to call a hypothetical 'exec-arbitrary-shell' tool
- **THEN** the system rejects the call and raises a security violation error

### Requirement: Graceful Shutdown

The system SHALL support graceful shutdown, allowing in-progress skill executions to complete or timeout before terminating the agent process.

#### Scenario: Graceful shutdown with active skill

- **WHEN** a shutdown signal is received while a skill is executing
- **THEN** the system waits for the skill to complete (or timeout) before exiting

#### Scenario: Force shutdown after grace period

- **WHEN** a shutdown signal is received and the grace period expires
- **THEN** the system forcefully terminates all in-progress operations and exits

### Requirement: Concurrent Skill Execution

The system SHALL support concurrent execution of independent skills to optimize build time, while respecting skill dependencies.

#### Scenario: Parallel plugin installation

- **WHEN** multiple plugins need to be installed with no interdependencies
- **THEN** the system invokes pluginInstallerSkill concurrently for each plugin

#### Scenario: Sequential dependent skills

- **WHEN** themeGeneratorSkill depends on wpInstallSkill completion
- **THEN** the system waits for wpInstallSkill to finish before starting themeGeneratorSkill

### Requirement: Skill Versioning

The system SHALL track skill versions and ensure compatibility between agent runtime and skill implementations.

#### Scenario: Compatible skill version

- **WHEN** a skill declares compatibility with agent runtime v1.0
- **THEN** the system allows registration and execution

#### Scenario: Incompatible skill version

- **WHEN** a skill declares compatibility with agent runtime v2.0 but the runtime is v1.5
- **THEN** the system logs a warning and optionally refuses to register the skill based on configuration

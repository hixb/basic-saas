---
name: verify
description: Mandatory verification workflow after any code change. Run lint and build to ensure code quality. Must be executed after writing, editing, or refactoring code.
allowed-tools: Bash(pnpm:*)
---

# AI Execution Skills Specification

This document defines execution-level skills for AI assistants and developers.

## Document Scope

This document applies to:

- AI code generation
- AI-assisted refactoring
- Human-written code verified by AI

## Core Principle

Code is not considered complete after it is written.
Code is considered complete only after it is executed and verified.

## Mandatory Execution Workflow

After any code change, the following workflow is mandatory and must be executed in order:

### Step 1: Lint Fix

Run:

```bash
pnpm lint:fix
```

Requirements:

- All lint errors must be fixed by modifying the code
- Warnings must not be ignored
- ESLint rules must be strictly followed
- No eslint-disable comments may be added unless explicitly approved
- Ignoring or suppressing ESLint errors is forbidden

If Step 1 fails:

- Code must be revised to comply with ESLint rules
- Fix the root cause, do not disable the rule
- Workflow restarts from Step 1

### Step 2: Build

Run:

```bash
pnpm build
```

Requirements:

- Build must complete successfully
- No TypeScript errors
- No runtime or configuration errors

If Step 2 fails:

- Code must be revised
- Workflow restarts from Step 1

## Completion Criteria

Code is considered DONE only if:

- `pnpm lint:fix` passes with no remaining errors
- `pnpm build` completes successfully
- No steps in the workflow are skipped

Partial completion is forbidden.

## Forbidden Behaviors

The following behaviors are strictly forbidden:

- Assuming the code works without execution
- Skipping lint or build steps
- Claiming completion after writing code only
- Blaming environment without verification
- Disabling lint rules to bypass errors
- Adding eslint-disable comments to ignore errors
- Suppressing ESLint warnings without fixing the underlying issue

## AI Assistant Behavioral Contract

When acting as an AI assistant:

- You must assume the code is broken until verified
- You must follow the execution workflow strictly
- You must fix issues iteratively until all steps pass
- You must not declare success prematurely
- When ESLint errors are detected, you must fix the code to comply with the rules
- You must never ignore or suppress ESLint errors

## Execution Commands

Quick check (recommended):

```bash
pnpm lint:fix && pnpm build
```

Or run separately:

```bash
# Step 1
pnpm lint:fix

# Step 2
pnpm build
```

## Final Statement

Writing code is an intermediate step.
Execution and verification define completion.

All contributors and AI assistants must comply.

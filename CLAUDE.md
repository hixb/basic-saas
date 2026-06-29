# Project Rules

Always follow all skills defined in `.claude/skills/`:

- **engineering-architecture**: Apply to all file creation, directory organization, and naming decisions.
- **code-style**: Apply to all code writing and documentation.
- **execution-workflow**: After every code change, run `pnpm lint:fix` then `pnpm build` without exception.
- **api-response-logging**: Apply to all API route implementations and response handling.
- **rbac-admin**: Apply when working on user, role, or permission management features.

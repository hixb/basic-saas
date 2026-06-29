---
name: engineering-architecture
description: Enterprise-grade architecture rules for this Next.js SaaS project. Apply when writing code, creating files, organizing directories, naming files, handling errors, or making architectural decisions.
user-invocable: false
---

# Engineering Skills & Architecture Specification

Project-wide Engineering Skills & Architecture Rules

## Document Status

- This document is normative
- This document applies to the entire lifecycle of the project
- Temporary deviations are not allowed
- All contributors must follow this document

## Purpose

This document defines a long-term, enterprise-grade engineering skills system for a Next.js-based SaaS project.
Its goals are:

- Long-term maintainability
- Clear mental model for large teams
- Prevention of architectural erosion
- Predictable code organization
- Enforceable engineering rules

## Core Engineering Principles

### Stability Over Convenience

- Architecture must not change due to feature growth
- Short-term convenience must not override long-term clarity

### Explicit Boundaries

- Every directory represents a responsibility
- Cross-layer access is forbidden unless explicitly allowed

### Predictability

- File path + file name must reveal responsibility
- No "hidden logic" in routing or entry files

## Global Directory Structure Contract

```
/
├─ app/                    # Next.js routing & API entry
├─ server/                 # Backend system (enterprise layered architecture)
├─ components/             # Frontend global UI components
├─ hooks/                  # Frontend global hooks
├─ services/               # Frontend API services
├─ stores/                 # Frontend state management
├─ utils/                  # Frontend environment utilities
├─ shared/                 # Frontend-backend shared code
├─ infra/                  # Runtime infrastructure
├─ config/
├─ middleware.ts
```

Rules:

- src/ is forbidden
- modules/ is forbidden
- Top-level structure must remain stable

## Frontend Architecture Skills

### Routing Layer (app/)

Responsibilities:

- Routing
- Layout composition
- HTTP method mapping (API)

Forbidden:

- Business logic
- State orchestration
- Validation logic
- Direct data access

### Frontend Routing Groups

```
app/
├─ (web)/
├─ (admin)/
├─ (auth)/
└─ api/
```

Routing groups represent product areas, not modules.

### Page Structure Rules

Inside a routing group:

```
app/(web)/
├─ layout.tsx
├─ page.tsx
├─ loading.tsx
├─ error.tsx
├─ views/
├─ components/
├─ hooks/
├─ utils/
```

Rules:

- page.tsx must be thin
- UI composition lives in *.view.tsx

### View Layer

```
home.view.tsx
dashboard.view.tsx
pricing.view.tsx
```

Rules:

- Page-level composition only
- May use hooks, services, and stores
- Must not contain business rules

### Component Layer

Rules:

- Reusable and stateless by default
- Must not depend on routing APIs
- File name describes UI responsibility

### Frontend Dependency Rules

```
page → view → component
view → hook → service → shared
view → store
```

Reverse dependencies are forbidden.

## Backend Architecture Skills (server/)

### Layered Structure

```
server/
├─ core/                # Framework-level request lifecycle
├─ domain/              # Business domain models
├─ application/         # Use cases & orchestration
├─ infrastructure/      # Technical implementations
└─ interfaces/          # HTTP adapters
```

### Layer Responsibilities

**core/**

- Middleware
- Guards
- Pipes
- Interceptors
- Exception filters
- Request context
- Response normalization

**domain/**

- Entities
- Value objects
- Policies
- Domain types

Rules:

- Pure TypeScript
- No framework or infrastructure dependencies

**application/**

- Business use cases
- Transaction orchestration
- Domain coordination

**infrastructure/**

Technology-specific implementations organized by technical concern:

```
infrastructure/
├─ database/
│  ├─ index.ts              # Database connection
│  ├─ schema/               # Drizzle schemas
│  └─ repositories/         # Data access layer
├─ security/
│  ├─ jwt.service.ts        # JWT token management
│  └─ encryption.service.ts # Encryption utilities
├─ cache/
│  └─ redis.service.ts      # Cache implementation
├─ email/
│  └─ email.service.ts      # Email service
└─ storage/
   └─ s3.service.ts         # File storage
```

Rules:
- Organize by technical concern, NOT by business domain
- Repository files go in `database/repositories/`
- Security-related services go in `security/`
- Each subdirectory represents a technical capability

**interfaces/**

- HTTP adapters
- Controllers
- Guards
- Pipes
- Interceptors
- Filters
- Handlers

### Backend Dependency Rules

```
interfaces → application → domain
interfaces → core
application → domain
infrastructure → domain
```

Reverse dependencies are forbidden.

## HTTP Request Lifecycle

```
Request
 → Edge Middleware
 → app/api (route.ts)
 → interfaces/http
 → core/middleware
 → core/guard
 → core/pipe
 → application/usecase
 → domain
 → infrastructure
 → core/interceptor
 → core/filter
 → Response
```

## Shared Layer (shared/)

Purpose:

- Environment-agnostic
- Business-agnostic
- Stable across frontend and backend

Allowed Contents:

```
shared/
├─ contracts/
├─ schemas/
├─ types/
├─ enums/
├─ constants/
└─ utils/
```

Rules:

- No runtime logic
- Must not import from server/
- Must not depend on browser or Node APIs

## Utility Functions Policy

### Core Rule

There is no global miscellaneous utils.
Every utility function must belong to a specific layer and context.

### Utility Placement

**shared/utils**

- Pure functions only
- No environment dependencies

**server/core/utils**

- Request lifecycle helpers
- Logging, tracing, error normalization

**server/infrastructure/utils**

- Technology-specific helpers
- DB, cache, third-party SDK helpers

**frontend utils**

- Browser and DOM helpers
- UI formatting helpers

### Forbidden Utility Patterns

- Business-related utilities
- Cross-layer utility dependencies
- Catch-all utility files

## File Naming Conventions

### General Rules

- kebab-case for file names
- One file, one responsibility
- Naming ambiguity is forbidden

### Mandatory File Suffixes

**Frontend Suffixes**

| Suffix | Responsibility |
|--------|----------------|
| .view.tsx | Page-level UI composition |
| .store.ts | State management |
| .context.tsx | React Context definition |
| .provider.tsx | Context Provider component |
| .hook.ts | Custom React hook |

**Backend Suffixes**

| Suffix | Responsibility |
|--------|----------------|
| .usecase.ts | Application use case |
| .entity.ts | Domain entity |
| .value-object.ts | Domain value object |
| .repository.ts | Persistence layer |
| .controller.ts | HTTP controller |
| .handler.ts | HTTP entry handler |
| .guard.ts | Authorization guard |
| .pipe.ts | Validation / transformation |
| .interceptor.ts | Response processing |
| .filter.ts | Exception handling |
| .service.ts | External or API service |

**Shared Suffixes**

| Suffix | Responsibility |
|--------|----------------|
| .schema.ts | Zod/validation schema |
| .dto.ts | Data Transfer Object |
| .mapper.ts | Data mapping between layers |
| .factory.ts | Factory pattern |
| .constant.ts | Constants definition |
| .enum.ts | Enum definition |
| .type.ts | Type definition |

**Testing Suffixes**

| Suffix | Responsibility |
|--------|----------------|
| .spec.ts | Unit test file |
| .test.ts | Integration test file |
| .e2e.ts | End-to-end test file |
| .mock.ts | Mock data/functions |
| .fixture.ts | Test fixtures |

### Forbidden File Names

- utils.ts
- helpers.ts
- common.ts
- temp.ts
- misc.ts
- shared.ts (at arbitrary locations)

### Index File Policy

**Forbidden:**

- Barrel files that re-export everything from a directory
- index.ts files that contain business logic
- index.ts files used to hide implementation complexity

**Allowed:**

- `components/ui/index.ts` - UI component library public API
- `shared/schemas/index.ts` - Schema exports aggregation
- Entry points for published packages

Rules:

- index.ts must only contain export statements
- index.ts must not contain logic or side effects
- Prefer explicit imports over barrel imports for internal code

## Testing Strategy

### Test File Location

Tests should be co-located with the code they test:

```
server/
├─ application/
│  ├─ user/
│  │  ├─ create-user.usecase.ts
│  │  └─ create-user.spec.ts
```

Exception: E2E tests live in a dedicated directory:

```
/
├─ e2e/
│  ├─ auth.e2e.ts
│  └─ checkout.e2e.ts
```

### Test Naming Rules

- Unit tests: `{name}.spec.ts`
- Integration tests: `{name}.test.ts`
- E2E tests: `{name}.e2e.ts`
- Mock files: `{name}.mock.ts`
- Fixtures: `{name}.fixture.ts`

### Test Organization

```typescript
describe('CreateUserUseCase', () => {
  describe('execute', () => {
    it('should create user with valid input', () => {})
    it('should throw when email already exists', () => {})
  })
})
```

Rules:

- One test file per source file
- Test file mirrors source file structure
- Mocks must be explicitly typed

## Error Handling Specification

### Error Class Hierarchy

```
server/domain/errors/
├─ base.error.ts           # Abstract base error
├─ validation.error.ts     # Input validation errors
├─ not-found.error.ts      # Resource not found
├─ conflict.error.ts       # Resource conflict
├─ unauthorized.error.ts   # Authentication errors
└─ forbidden.error.ts      # Authorization errors
```

### Error Structure

```typescript
interface AppError {
  code: string // Machine-readable error code
  message: string // Human-readable message
  details?: unknown // Additional context
  cause?: Error // Original error
}
```

### Error Handling Rules

- Domain layer throws domain-specific errors
- Application layer may wrap or rethrow errors
- Infrastructure layer converts external errors to domain errors
- Interfaces layer transforms errors to HTTP responses

### Frontend Error Boundaries

```
app/
├─ error.tsx              # Root error boundary
├─ (web)/
│  ├─ error.tsx           # Web area error boundary
│  └─ dashboard/
│     └─ error.tsx        # Page-specific error boundary
```

Rules:

- Every routing group must have an error.tsx
- Error boundaries must log errors before rendering fallback
- Never expose internal error details to users

## API Response Contract

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    timestamp: string
    requestId: string
  }
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    timestamp: string
    requestId: string
  }
}
```

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

### HTTP Status Code Mapping

| Error Type | HTTP Status |
|------------|-------------|
| ValidationError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError | 409 |
| InternalError | 500 |

## Environment Configuration

### Environment Files

```
/
├─ .env                    # Default values (committed)
├─ .env.local              # Local overrides (gitignored)
├─ .env.development        # Development defaults
├─ .env.production         # Production defaults
└─ .env.test               # Test environment
```

### Variable Naming Convention

```
# Format: [SCOPE]_[CATEGORY]_[NAME]

# Database
DATABASE_URL=
DATABASE_POOL_SIZE=

# Authentication
AUTH_SECRET=
AUTH_GOOGLE_CLIENT_ID=

# External Services
STRIPE_SECRET_KEY=
RESEND_API_KEY=

# Feature Flags
FEATURE_DARK_MODE=
FEATURE_BETA_ACCESS=

# App Configuration
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
```

### Configuration Validation

All environment variables must be validated at startup:

```
config/
├─ env.schema.ts           # Zod schema for env validation
└─ env.ts                  # Validated env export
```

Rules:

- Never use `process.env` directly in application code
- Always import from `config/env.ts`
- Fail fast on missing required variables

## Internationalization (i18n)

### Directory Structure

```
messages/
├─ en.json                 # English (default)
├─ zh.json                 # Chinese
└─ ja.json                 # Japanese
```

### Translation Key Convention

```json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete"
    },
    "status": {
      "loading": "Loading...",
      "error": "An error occurred"
    }
  },
  "auth": {
    "login": {
      "title": "Sign In",
      "email": "Email Address",
      "password": "Password"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {name}"
  }
}
```

### Key Naming Rules

- Use dot notation for nesting: `auth.login.title`
- Use camelCase for key names
- Group by feature/page first, then by UI element
- Use `common.*` for shared translations

### i18n Rules

- All user-facing strings must be externalized
- No hardcoded strings in components
- Interpolation uses `{variable}` syntax
- Pluralization uses ICU message format

## Enforcement Rules

- Code reviews
- Directory ownership
- Linting and boundary rules
- Architectural reviews

Violations must be resolved before merging.

## Evolution Strategy

- Features must fit existing layers
- Architecture evolves slower than business logic
- Breaking architectural changes require formal review

## Final Statement

This engineering skills system is designed to remain valid for the entire lifecycle of the project.
It prioritizes:

- Clarity over cleverness
- Stability over speed
- Structure over convenience

## Team Commitment

By contributing to this repository, all contributors agree to follow this document.

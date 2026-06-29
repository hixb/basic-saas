---
name: code-style
description: Professional code style and documentation standards. Use when writing code, adding comments, or creating documentation to ensure consistent English-only professional style.
user-invocable: false
---

# Code Style & Documentation Standards

Professional code style and documentation standards for the SaaS template.

## Language Requirements

### English Only

All code-related text must be in English:
- Comments
- Variable names
- Function names
- Type names
- Error messages
- Log messages
- Documentation

## Comment Standards

### Comment Placement

Comments must be placed above the code they describe, never inline.

**Correct:**
```typescript
// Calculate total price including tax
const total = price * (1 + taxRate)

// Filter active users from the dataset
const activeUsers = users.filter(u => u.status === 1)
```

**Incorrect:**
```typescript
const total = price * (1 + taxRate) // Calculate total price including tax
const activeUsers = users.filter(u => u.status === 1) // Filter active users
```

### Comment Style

Comments should be professional and objective. Avoid:
- Second person pronouns (you, your)
- First person pronouns (I, we, my, our)
- Numbered lists in inline comments
- Conversational tone
- Instructional language

**Correct:**
```typescript
// Validates email format using RFC 5322 standard
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

// Retrieves user by ID from database
// Returns null if user does not exist
async function getUserById(id: number): Promise<User | null> {
  return db.select().from(users).where(eq(users.id, id))
}

// Transforms raw API response into domain entity
function mapToUserEntity(raw: RawUser): UserEntity {
  return {
    id: raw.id,
    email: raw.email,
    createdAt: new Date(raw.created_at),
  }
}
```

**Incorrect:**
```typescript
// 1. First, validate the email format
// 2. Then check if it exists in database
// 3. Finally return the result
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

// You should call this function to get user data
// Make sure you pass a valid ID
async function getUserById(id: number): Promise<User | null> {
  return db.select().from(users).where(eq(users.id, id))
}

// We transform the API response here
// I added this to handle the date conversion
function mapToUserEntity(raw: RawUser): UserEntity {
  return {
    id: raw.id,
    email: raw.email,
    createdAt: new Date(raw.created_at),
  }
}
```

### JSDoc Comments

Use JSDoc for functions, classes, and interfaces. Keep descriptions objective.

**Correct:**
```typescript
/**
 * Authenticates user credentials and returns session token
 *
 * @param username - User's login identifier
 * @param password - User's password in plain text
 * @returns Session token if authentication succeeds
 * @throws AuthenticationError if credentials are invalid
 */
async function authenticate(username: string, password: string): Promise<string> {
  // Implementation
}

/**
 * User entity representing authenticated users in the system
 */
export interface UserEntity {
  id: number
  username: string
  email: string
}

/**
 * Handles user registration workflow
 */
export class UserRegistrationUseCase {
  /**
   * Executes user registration process
   *
   * @param input - Registration data including email and password
   * @returns Newly created user entity
   */
  async execute(input: RegisterInput): Promise<UserEntity> {
    // Implementation
  }
}
```

**Incorrect:**
```typescript
/**
 * This function will authenticate your user
 *
 * Steps:
 * 1. Validate the username
 * 2. Check the password
 * 3. Generate token
 *
 * @param username - You need to provide the username here
 * @param password - Your password goes here
 * @returns You'll get a token back
 */
async function authenticate(username: string, password: string): Promise<string> {
  // Implementation
}
```

### Inline Explanatory Comments

Use inline comments sparingly, only for complex logic. Keep them objective.

**Correct:**
```typescript
function calculateDiscount(price: number, userLevel: number): number {
  // Apply progressive discount based on user level
  // Level 1: 5%, Level 2: 10%, Level 3: 15%
  const discountRate = Math.min(userLevel * 0.05, 0.15)

  // Ensure discount does not exceed maximum threshold
  const maxDiscount = price * 0.2
  const calculatedDiscount = price * discountRate

  return Math.min(calculatedDiscount, maxDiscount)
}

function processPayment(amount: number): void {
  // Lock prevents concurrent payment processing for same transaction
  acquireLock()

  try {
    chargeCard(amount)
    updateBalance(amount)
  }
  finally {
    releaseLock()
  }
}
```

**Incorrect:**
```typescript
function calculateDiscount(price: number, userLevel: number): number {
  // Now we calculate the discount
  const discountRate = Math.min(userLevel * 0.05, 0.15)

  // You should make sure the discount isn't too high
  const maxDiscount = price * 0.2
  const calculatedDiscount = price * discountRate

  // I'm returning the smaller value here
  return Math.min(calculatedDiscount, maxDiscount)
}
```

## Code Organization

### File Headers

Avoid file-level comments unless documenting complex modules.

**Correct:**
```typescript
// server/core/auth/jwt.service.ts
import { sign, verify } from 'jsonwebtoken'

export class JwtService {
  // Implementation
}
```

**Incorrect:**
```typescript
/**
 * JWT Service File
 *
 * This file contains the JWT service implementation.
 * You can use this service to generate and verify tokens.
 *
 * Author: Developer Name
 * Date: 2024-01-01
 */
import { sign, verify } from 'jsonwebtoken'

export class JwtService {
  // Implementation
}
```

### TODO Comments

Format TODO comments professionally without personal pronouns.

**Correct:**
```typescript
// TODO: Add rate limiting to prevent abuse
// TODO: Implement caching layer for improved performance
// TODO: Refactor to use async/await pattern
// FIXME: Handle edge case when user has no roles assigned
```

**Incorrect:**
```typescript
// TODO: We need to add rate limiting here
// TODO: I should implement caching
// TODO: You need to refactor this later
// FIXME: This breaks when user has no roles
```

## Naming Conventions

### Variables and Functions

Use descriptive English names in camelCase.

**Correct:**
```typescript
const userCount = 10
const isAuthenticated = true
const maxRetryAttempts = 3

function calculateTotalPrice(items: Item[]): number {}
function validateUserInput(input: string): boolean {}
```

**Incorrect:**
```typescript
const cnt = 10 // Too abbreviated
const flag = true // Non-descriptive
const MAX_RETRY = 3 // Wrong case for variable

function calc(items: Item[]): number {} // Too abbreviated
function check(input: string): boolean {} // Non-descriptive
```

### Constants

Use UPPER_SNAKE_CASE for true constants.

**Correct:**
```typescript
const MAX_LOGIN_ATTEMPTS = 5
const DEFAULT_PAGE_SIZE = 20
const API_TIMEOUT_MS = 30000

export const UserStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const
```

### Types and Interfaces

Use PascalCase for types, interfaces, classes, and enums.

All type declarations, interfaces, and constants must have English comments explaining their purpose.

**Correct:**
```typescript
/**
 * User entity representing authenticated users in the system
 */
interface UserEntity {
  id: number
  email: string
}

/**
 * Unique identifier for a user
 */
type UserId = number

/**
 * Repository for user data access operations
 */
class UserRepository {
  // Implementation
}

/**
 * Available user roles in the system
 */
enum UserRole {
  Admin = 'admin',
  User = 'user',
}

/**
 * User account status values
 */
export const UserStatus = {
  /** Active user account */
  ACTIVE: 1,
  /** Disabled user account */
  DISABLED: 2,
} as const
```

**Incorrect:**
```typescript
// Missing comments
interface UserEntity {
  id: number
  email: string
}

type UserId = number

const UserStatus = {
  ACTIVE: 1,
  DISABLED: 2,
} as const
```

## Error Messages

Error messages should be clear and professional.

**Correct:**
```typescript
throw new Error('User not found')
throw new Error('Invalid email format')
throw new Error('Database connection failed')
throw new ValidationError('Password must be at least 8 characters')
```

**Incorrect:**
```typescript
throw new Error('Oops! User not found')
throw new Error('Your email is invalid')
throw new Error('We cannot connect to database')
throw new ValidationError('You need a longer password')
```

## Log Messages

Log messages should be informative and objective.

**Correct:**
```typescript
logger.info('User authentication successful', { userId: user.id })
logger.warn('Rate limit exceeded', { ip: clientIp, endpoint: '/api/users' })
logger.error('Database query failed', { query, error: error.message })
```

**Incorrect:**
```typescript
logger.info('Yay! User logged in', { userId: user.id })
logger.warn('Someone is hitting the API too much', { ip: clientIp })
logger.error('Oops, database broke', { query })
```

## Documentation

### README and Markdown Files

Use professional technical writing style.

**Correct:**
```markdown
## Installation

Install dependencies using pnpm:

```bash
pnpm install
```

## Configuration

Configure environment variables in `.env` file:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation
```

**Incorrect:**
```markdown
## Installation

You need to install the dependencies first. Just run this command:

```bash
pnpm install
```

## Configuration

Now you should configure your environment variables. Here's what you need to do:

1. First, create a `.env` file
2. Then add your database URL
3. Don't forget to add your JWT secret!
```

## Examples

### Complete Function Example

**Correct:**
```typescript
/**
 * Registers a new user in the system
 *
 * Validates input, checks for existing users, hashes password,
 * and creates user record in database.
 *
 * @param input - Registration data
 * @returns Newly created user entity
 * @throws ConflictError if email already exists
 * @throws ValidationError if input is invalid
 */
export async function registerUser(input: RegisterInput): Promise<UserEntity> {
  // Validate email format
  if (!isValidEmail(input.email)) {
    throw new ValidationError('Invalid email format')
  }

  // Check for existing user with same email
  const existingUser = await userRepository.findByEmail(input.email)
  if (existingUser) {
    throw new ConflictError('Email already registered')
  }

  // Hash password using bcrypt
  const hashedPassword = await bcrypt.hash(input.password, 10)

  // Create user record
  const user = await userRepository.create({
    email: input.email,
    password: hashedPassword,
    createdAt: new Date(),
  })

  return user
}
```

### Complete Class Example

**Correct:**
```typescript
/**
 * Repository for user data access operations
 *
 * Provides methods for CRUD operations on user entities
 * using Drizzle ORM.
 */
export class UserRepository {
  /**
   * Retrieves user by ID
   *
   * @param id - User identifier
   * @returns User entity or null if not found
   */
  async findById(id: number): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))

    return result[0] ?? null
  }

  /**
   * Retrieves user by email address
   *
   * @param email - User email address
   * @returns User entity or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    return result[0] ?? null
  }

  /**
   * Creates new user record
   *
   * @param data - User data for creation
   * @returns Created user entity
   */
  async create(data: NewUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(data)
      .returning()

    return result[0]
  }
}
```

## Summary

Key principles:
- Use English for all code-related text
- Place comments above code, never inline
- Keep comments objective and professional
- Avoid personal pronouns and conversational tone
- Avoid numbered lists in inline comments
- Use descriptive names for variables and functions
- Write clear, professional error and log messages
- Maintain consistent documentation style

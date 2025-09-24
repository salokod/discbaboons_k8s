# Project Instructions for Claude

## Development Workflow
- **Always use TDD (Test-Driven Development)**: Write tests first, then implement
- **Test Data**: Follow Martin Fowler's Testing Pyramid principles for data generation
- **Error Handling**: Always use the existing `errorHandler` middleware for consistent error responses

## TDD Methodology (Claude + Human Pair Programming)
- **Thinnest possible slices**: Start with "should export a function", then add one small piece at a time
- **Red-Green-Refactor**: Write failing test → minimal code to pass → run test → repeat
- **Stop and validate**: After each slice, human runs `npm run test` to confirm all green before proceeding
- **Teaching moments**: Claude explains WHY each design choice was made and WHAT the implications are
- **One concept per slice**: Don't bundle multiple validations or features in one step
- **Security-first approach**: Always validate user ownership/permissions in the same database query
- **Edge cases as separate slices**: Test happy path first, then add edge cases one by one
- **CRITICAL FOR AGENTS**: Run `npm run verify` after EVERY thin slice implementation
- **100% VERIFICATION REQUIREMENT**: `npm run verify` MUST pass 100% without any failures, skipped tests, or errors
- **TEST QUALITY**: NEVER sacrifice test quality or delete tests - write complete, thorough tests
- **NO SHORTCUTS**: Do not give up on writing tests or skip test cases - maintain high quality standards
- **QUALITY GATE**: If `npm run verify` doesn't pass 100%, stop and fix the issues before proceeding

## Testing Standards - Martin Fowler's Testing Pyramid
- Use Vitest for all tests
- Integration tests should use `supertest` with the app instance  
- Test files should follow the pattern: `*.integration.test.js` or `*.test.js`
- Always clean up test data in `beforeEach` and `afterEach` hooks

### Integration Test Principles (Martin Fowler)
- **Focus on integration concerns**: Middleware, database persistence, JOINs, FK constraints, transactions
- **Use hardcoded values**: Predictable, deterministic test scenarios (NOT Chance.js for business logic)
- **Direct DB setup**: Use test helpers instead of API call chains for speed
- **Parallel safety**: Unique IDs with global counter to prevent race conditions
- **Sequential cleanup**: Respect FK constraint order to prevent violations

### When to Use Chance.js vs Hardcoded Values
- **Chance.js for**: Unique identifiers (usernames, emails, IDs), test data setup, non-business values
- **Hardcoded for**: Business logic values (scores, prices, calculations), expected test scenarios, assertions

### What NOT to Test in Integration Tests
- Validation scenarios (unit test concern)
- Missing fields (unit test concern)  
- Invalid formats (unit test concern)
- Business logic edge cases (unit test concern)

### Test Data Guidelines
- Use unique test identifiers to avoid conflicts between parallel tests
- **IMPORTANT: Error response format is `{ success: false, message: "..." }` NOT `{ error: "..." }`**
- **IMPORTANT: Pagination must always include metadata: `{ items: [...], total: N, limit: N, offset: N, hasMore: boolean }`**

## Code Standards
- Use ES6 imports/exports
- Follow existing file structure patterns in the codebase
- Services should accept a database connection parameter for testing (default to main DB instance)
- Controllers should be thin - delegate business logic to services
- Always validate user ownership/permissions in services

## Project Structure
```
apps/express-server/
├── controllers/     # Thin controllers that call services
├── services/        # Business logic and database operations
├── routes/          # Express route definitions
├── middleware/      # Custom middleware (auth, error handling)
├── tests/
│   ├── integration/ # Full request/response tests
│   └── unit/        # Service/function tests
```

## Human preferences
- I like to go slow and learn throughout
- Try and return the thinnest slice each time, first with test like 'function exists' then the prod code to match that
- go step by step, and explain / give me opportunities to learn
- **NEVER start work without confirming with the human first - always ask permission before beginning any task**

## Command Restrictions
- **ONLY these bash commands are allowed**: `npm run verify` and `npm run lint:fix`
- **NO OTHER bash commands** should be executed by agents
- Human will handle all other command execution to save tokens

## Database
- Use raw PostgreSQL queries for all database operations
- Always use transactions for multi-step operations
- Follow existing naming conventions (snake_case for DB fields)

## Authentication
- All protected routes use `authenticateToken` middleware
- User ID is available in `req.user.userId` after authentication
- Always validate user ownership before allowing operations

## Commands to Run
- **Verification**: `npm run verify` - Run after EVERY implementation slice (MUST pass 100%)
- **Linting**: `npm run lint:fix` - Only auto-fixable linting command allowed
- **RESTRICTION**: These are the ONLY bash commands agents may execute

## Agent-Specific Instructions

### For react-native-code-reviewer Agent
- Review all React Native code for performance, security, and best practices
- Follow the React Native PR Review Guide standards
- Identify inline styles that need refactoring to StyleSheet.create()
- Check for proper theme integration using useThemeColors()
- Ensure cross-platform consistency (iOS/Android)

### For principal-engineer-delegator Agent
- Design architecture following existing patterns in the codebase
- Break down complex features into thin, testable slices
- Delegate tasks with clear acceptance criteria
- Ensure TDD methodology is followed
- Plan for scalability and maintainability

### For delivery-implementer Agent
- **CRITICAL**: Run `npm run verify` after EVERY thin slice (MUST pass 100%)
- **TEST FIRST**: Write the test before implementation
- **NO SHORTCUTS**: Complete all test cases, don't skip or delete tests
- **QUALITY**: Maintain high code and test quality standards
- **ZERO TOLERANCE**: No skipped tests, no failing tests, no errors in verification
- Follow the thinnest slice approach:
  1. Write failing test for smallest feature
  2. Implement minimal code to pass
  3. Run `npm run verify` (must be 100% green)
  4. If verification fails, fix issues immediately
  5. Run `npm run lint:fix` if needed
  6. Refactor if needed
  7. Run `npm run verify` again (must be 100% green)
  8. Move to next slice
- **NEVER** proceed to next slice if current slice has failing tests
- **ALWAYS** ensure 100% of tests pass before moving forward
- **COMMAND RESTRICTION**: Only use `npm run verify` and `npm run lint:fix`
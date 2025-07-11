# Project Instructions for Claude

## Development Workflow
- **Always use TDD (Test-Driven Development)**: Write tests first, then implement
- **Test Data**: Always use Chance.js for generating test data instead of hardcoding values
- **Error Handling**: Always use the existing `errorHandler` middleware for consistent error responses

## TDD Methodology (Claude + Human Pair Programming)
- **Thinnest possible slices**: Start with "should export a function", then add one small piece at a time
- **Red-Green-Refactor**: Write failing test → minimal code to pass → run test → repeat
- **Stop and validate**: After each slice, human runs `npm run test` to confirm all green before proceeding
- **Teaching moments**: Claude explains WHY each design choice was made and WHAT the implications are
- **One concept per slice**: Don't bundle multiple validations or features in one step
- **Security-first approach**: Always validate user ownership/permissions in the same database query
- **Edge cases as separate slices**: Test happy path first, then add edge cases one by one

## Testing Standards
- Use Vitest for all tests
- Integration tests should use `supertest` with the app instance
- Test files should follow the pattern: `*.integration.test.js` or `*.test.js`
- Always clean up test data in `beforeEach` and `afterEach` hooks
- Use unique test identifiers (like `testbc` for bag create tests) to avoid conflicts

## Code Standards
- Use ES6 imports/exports
- Follow existing file structure patterns in the codebase
- Services should accept a `prismaClient` parameter for testing (default to main prisma instance)
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

## Database
- Use Prisma for all database operations
- Always use transactions for multi-step operations
- Follow existing naming conventions (snake_case for DB fields)

## Authentication
- All protected routes use `authenticateToken` middleware
- User ID is available in `req.user.userId` after authentication
- Always validate user ownership before allowing operations

## Commands to Run
- Tests: `npm test` or specific test files
- Linting: `npm run lint`
- To Create new `prisma.schema` file, we will create the `migrations` file first, then go to the `apps/express-server` folder and run `npm run db:pull` after we connect to it locally, i can help run these for you
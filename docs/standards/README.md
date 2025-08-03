# Coding Standards & Methodology

Comprehensive coding standards, review processes, and development methodologies for the DiscBaboons project.

## Quick Links

- **[PR Review Methodology](./PR_REVIEW_METHODOLOGY.md)** - Comprehensive code review guidelines
- **[Testing Standards](../development/testing-standards.md)** - TDD approach and testing requirements (in Development section)

## Code Quality Standards

### Test-Driven Development (TDD)
- **Thinnest possible slices**: Start with function existence, then add one small piece at a time
- **Red-Green-Refactor**: Write failing test → minimal code to pass → run test → repeat
- **Martin Fowler's Testing Pyramid**: Unit tests (fast, isolated) → Integration tests (real dependencies) → E2E tests (minimal)
- **Chance.js for dynamic data**: Use for identifiers and setup, hardcoded values for business logic
- **Security-first approach**: Always validate user ownership/permissions in the same database query

### Code Review Excellence
Following **PR_REVIEW_METHODOLOGY.md**, all code reviews focus on:

#### 🔴 Must Fix (Blocking)
- **Security vulnerabilities** (missing auth, input validation, unauthorized access)
- **Logic errors** that could cause data corruption or incorrect behavior
- **Missing critical error handling** (500 errors, unhandled promises)
- **Authentication/Authorization gaps** (wrong middleware, missing permissions)

#### 🟡 Should Fix (Non-blocking but important)
- **Inconsistent patterns** (different error formats, naming conventions)
- **Missing edge case handling** (empty responses, boundary conditions)
- **Performance concerns** (N+1 queries, missing pagination)
- **Documentation gaps** (missing API docs, unclear parameter handling)

#### 🟢 Nice to Have (Optional improvements)
- **Code organization** suggestions (route grouping, middleware optimization)
- **Additional validation** (more comprehensive input checking)
- **Enhanced error messages** (more user-friendly responses)

### Error Handling Standards

#### Consistent Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

#### Required Response Formats
- **Success responses**: Always include `success: true`
- **Pagination**: Must include `{ items: [...], total: N, limit: N, offset: N, hasMore: boolean }`
- **Error responses**: Use standard format with appropriate HTTP status codes

### Database Standards
- **Raw PostgreSQL queries**: No ORM, use direct SQL for clarity and performance
- **Security-first queries**: Combine authorization and data access in single atomic operations
- **Transaction management**: Use transactions for multi-step operations
- **UUID validation**: Always validate UUID format to prevent 500 errors

### Testing Quality Requirements

#### Unit Tests
- **Dynamic test data**: Use Chance.js for all identifiers and non-business values
- **Comprehensive validation**: Test all edge cases and error scenarios
- **Mock external dependencies**: Database, HTTP calls, file system operations
- **Test behavior, not implementation**: Tests should survive refactoring

#### Integration Tests
- **Real database operations**: Test actual persistence and constraints
- **Hardcoded business values**: Predictable scenarios for deterministic outcomes
- **Parallel-safe design**: Unique identifiers to prevent test conflicts
- **Proper cleanup**: Respect foreign key constraints in cleanup order

### Security Standards

#### Authentication & Authorization
- **JWT tokens**: Secure token management with refresh capabilities
- **User ownership validation**: Always check user permissions in database queries
- **Input validation**: UUID format validation, parameter type checking
- **Rate limiting**: Appropriate limits for different endpoint types

#### Data Protection
- **No secrets in code**: Environment variables for all sensitive data
- **SQL injection prevention**: Parameterized queries only
- **Authorization at query level**: Include user ID in WHERE clauses
- **Audit trails**: Track who made changes and when

## Development Workflow Standards

### Git Workflow
1. **Feature branches**: Create from main for each feature/fix
2. **Descriptive commits**: Clear commit messages following conventional commits
3. **Pull request reviews**: Required before merging to main
4. **Automated testing**: All tests must pass before merge

### Code Organization
- **Service layer pattern**: Controllers delegate to services for business logic
- **Consistent file structure**: Follow established patterns in the codebase
- **ES6 imports/exports**: Modern module syntax throughout
- **Error middleware**: Use existing errorHandler middleware consistently

### Documentation Requirements
- **API documentation**: Complete endpoint docs in `/docs/express-server/api/`
- **Code comments**: Only when business logic is non-obvious
- **README updates**: Keep documentation current with changes
- **Migration documentation**: Document all database schema changes

## Quality Metrics

### Code Review Scoring
PRs are evaluated on a scale of 1-10 considering:
- **Technical correctness** (40%): Logic, security, error handling
- **Test coverage** (30%): Comprehensive testing with proper patterns
- **Code quality** (20%): Consistency, organization, maintainability  
- **Documentation** (10%): API docs, comments, clarity

### Testing Coverage Expectations
- **Unit tests**: 90%+ coverage for service layer
- **Integration tests**: All API endpoints tested
- **Edge cases**: Comprehensive validation and error scenario testing
- **Security tests**: Authorization and input validation coverage

## Best Practices Summary

1. **Security First**: Always validate authorization and input at the query level
2. **Test-Driven Development**: Write tests first, implement in thin slices
3. **Consistent Patterns**: Follow existing codebase conventions
4. **Martin Fowler's Principles**: Respect the testing pyramid structure
5. **Dynamic Test Data**: Use Chance.js appropriately for test scenarios
6. **Comprehensive Reviews**: Focus on security, logic, and maintainability
7. **Documentation Standards**: Keep API docs current and comprehensive
8. **Error Handling**: Use consistent response formats across all endpoints

## Reference Documents

- **[PR Review Methodology](./PR_REVIEW_METHODOLOGY.md)** - Detailed review guidelines and scoring criteria
- **[Testing Standards](../development/testing-standards.md)** - Complete TDD and testing approach
- **[Development Workflows](../development/workflows.md)** - Daily development commands and procedures

These standards ensure high code quality, security, and maintainability across the entire DiscBaboons project.
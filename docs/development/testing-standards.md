# Testing Standards

Comprehensive testing guidelines following Martin Fowler's Testing Pyramid principles with TDD approach.

## TDD Methodology (Test-Driven Development)

### Core Principles
- **Thinnest possible slices**: Start with "should export a function", then add one small piece at a time
- **Red-Green-Refactor**: Write failing test → minimal code to pass → run test → repeat
- **Stop and validate**: After each slice, run `npm test` to confirm all green before proceeding
- **One concept per slice**: Don't bundle multiple validations or features in one step
- **Security-first approach**: Always validate user ownership/permissions in the same database query
- **Edge cases as separate slices**: Test happy path first, then add edge cases one by one

### TDD Workflow
1. Write the smallest possible failing test
2. Write just enough code to make it pass
3. Run tests to ensure they pass
4. Refactor if needed (keeping tests green)
5. Repeat with next small slice

## Testing Framework Setup

### Tools Used
- **Vitest** for all tests
- **Supertest** for integration tests with app instance
- **Chance.js** for dynamic test data generation

### Test File Patterns
- Integration tests: `*.integration.test.js`
- Unit tests: `*.test.js`
- Always clean up test data in `beforeEach` and `afterEach` hooks

## Martin Fowler's Testing Pyramid

### Unit Tests (Base of Pyramid)
- **Fast and isolated**: Test single units of behavior
- **Mock external dependencies**: Database, HTTP calls, file system
- **Use Chance.js**: For dynamic test data generation
- **Test business logic**: Focus on pure functions and service logic

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Chance from 'chance';
import serviceFunction from '../../../services/example.service.js';

const chance = new Chance();

describe('serviceFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a function', () => {
    expect(typeof serviceFunction).toBe('function');
  });

  it('should validate required parameters', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    
    await expect(serviceFunction()).rejects.toThrow('Parameter is required');
    await expect(serviceFunction(null, userId)).rejects.toThrow('Parameter is required');
  });
});
```

### Integration Tests (Middle of Pyramid)
- **Focus on integration concerns**: Middleware, database persistence, JOINs, FK constraints, transactions
- **Use hardcoded values**: Predictable, deterministic test scenarios
- **Direct DB setup**: Use test helpers instead of API call chains for speed
- **Parallel safety**: Unique IDs with global counter to prevent race conditions
- **Sequential cleanup**: Respect FK constraint order to prevent violations

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';
import { setupTestData, cleanupTestData } from '../../helpers/testHelpers.js';

describe('POST /api/endpoint - Integration', () => {
  let testData;

  beforeEach(async () => {
    testData = await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData(testData);
  });

  it('should create resource and persist to database', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${testData.authToken}`)
      .send({
        name: 'Test Resource',
        value: 100
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        name: 'Test Resource',
        value: 100
      })
    });
  });
});
```

## Test Data Guidelines

### When to Use Chance.js vs Hardcoded Values

#### Use Chance.js for:
- **Unique identifiers**: usernames, emails, IDs
- **Test data setup**: Non-business values that need to be unique
- **Property-based testing**: Testing with various inputs

```javascript
const chance = new Chance();
const userId = chance.integer({ min: 1, max: 1000 });
const email = chance.email();
const username = chance.word({ length: 8 });
const roundId = chance.guid();
```

#### Use Hardcoded Values for:
- **Business logic values**: scores, prices, calculations
- **Expected test scenarios**: Predictable outcomes
- **Assertions**: Expected results and error messages

```javascript
// Good: Business logic with predictable values
const score = 4; // Par score
const expectedTotal = 72; // 18 holes * 4 par
const betAmount = 5.00; // Dollar amount

// Good: Expected error messages
expect(error.message).toBe('Round must be in progress to be completed');
```

### Test Data Management

#### Unique Test Identifiers
```javascript
// Use global counter for parallel test safety
let testCounter = 0;

function generateTestId() {
  return `test-${Date.now()}-${++testCounter}`;
}

const username = `user-${generateTestId()}`;
const email = `${generateTestId()}@example.com`;
```

#### Database Cleanup Patterns
```javascript
// Respect foreign key constraints in cleanup order
afterEach(async () => {
  // Delete child records first
  await queryRows('DELETE FROM round_players WHERE round_id = $1', [testRoundId]);
  await queryRows('DELETE FROM scores WHERE round_id = $1', [testRoundId]);
  
  // Then parent records
  await queryOne('DELETE FROM rounds WHERE id = $1', [testRoundId]);
  await queryOne('DELETE FROM users WHERE id = $1', [testUserId]);
});
```

## What NOT to Test in Integration Tests

Avoid testing these in integration tests (use unit tests instead):
- Validation scenarios (missing fields, invalid formats)
- Business logic edge cases
- Error message variations
- Input sanitization

Integration tests should focus on:
- Database persistence
- Middleware execution
- Authentication/authorization flow
- HTTP status codes and response structure

## Error Response Standards

### Consistent Error Format
```javascript
// IMPORTANT: Use this format consistently
{
  "success": false,
  "message": "Human-readable error message"
}

// NOT this format:
{
  "error": "Error message"
}
```

### Testing Error Scenarios
```javascript
it('should return 403 when user is not authorized', async () => {
  const response = await request(app)
    .post('/api/protected-endpoint')
    .set('Authorization', `Bearer ${unauthorizedToken}`)
    .send(validData)
    .expect(403);

  expect(response.body).toEqual({
    success: false,
    message: 'Permission denied: You are not a participant in this round'
  });
});
```

## Pagination Testing

### Required Metadata Format
```javascript
// IMPORTANT: Pagination must always include metadata
{
  "items": [...],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

### Testing Pagination
```javascript
it('should return paginated results with metadata', async () => {
  const response = await request(app)
    .get('/api/endpoint?limit=10&offset=0')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200);

  expect(response.body).toMatchObject({
    items: expect.arrayContaining([]),
    total: expect.any(Number),
    limit: 10,
    offset: 0,
    hasMore: expect.any(Boolean)
  });
});
```

## Code Quality in Tests

### Test Behavior, Not Implementation
```javascript
// Good: Tests behavior
it('should update round status to completed', async () => {
  const result = await roundsCompleteService(roundId, userId);
  expect(result.round.status).toBe('completed');
});

// Bad: Tests implementation details
it('should call queryOne with specific SQL', async () => {
  await roundsCompleteService(roundId, userId);
  expect(queryOne).toHaveBeenCalledWith(
    'UPDATE rounds SET status = $1 WHERE id = $2',
    ['completed', roundId]
  );
});
```

### Comprehensive Validation Testing
```javascript
// Test all validation scenarios
it('should validate all required parameters', async () => {
  const validRoundId = chance.guid();
  const validUserId = chance.integer({ min: 1, max: 1000 });

  // Missing roundId
  await expect(service()).rejects.toThrow('Round ID is required');
  await expect(service(null, validUserId)).rejects.toThrow('Round ID is required');
  
  // Invalid UUID format
  await expect(service('invalid-uuid', validUserId)).rejects.toThrow('Round ID must be a valid UUID');
  
  // Missing userId
  await expect(service(validRoundId)).rejects.toThrow('User ID is required');
  await expect(service(validRoundId, null)).rejects.toThrow('User ID is required');
  
  // Invalid userId
  await expect(service(validRoundId, 0)).rejects.toThrow('User ID must be a valid number');
  await expect(service(validRoundId, -1)).rejects.toThrow('User ID must be a valid number');
});
```

## Security Testing

### Authorization Testing
```javascript
it('should prevent unauthorized access', async () => {
  // User not in round
  queryOne.mockResolvedValueOnce({ id: roundId, status: 'in_progress' }); // Round exists
  queryOne.mockResolvedValueOnce(null); // User not a participant

  await expect(service(roundId, unauthorizedUserId)).rejects.toThrow(
    'Permission denied: You are not a participant in this round'
  );
});
```

### Input Validation Testing
```javascript
it('should prevent 500 errors with UUID validation', async () => {
  const invalidIds = ['', '123', 'not-uuid', 'invalid-format'];
  
  for (const invalidId of invalidIds) {
    await expect(service(invalidId, validUserId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError'
      })
    );
  }
});
```

## Best Practices Summary

1. **Follow TDD**: Write tests first, implement in thin slices
2. **Use appropriate test data**: Chance.js for identifiers, hardcoded for business logic
3. **Test behavior, not implementation**: Focus on outcomes, not internal calls
4. **Comprehensive validation**: Test all edge cases and error scenarios
5. **Consistent error handling**: Use standardized error response format
6. **Security-first**: Always test authorization and input validation
7. **Parallel-safe tests**: Use unique identifiers and proper cleanup
8. **Martin Fowler's principles**: Respect the testing pyramid structure

## Next Steps

- Review [Daily Workflows](./workflows.md) for running tests
- Check [Local Setup](./local-setup.md) for test environment configuration
- See [API Documentation](../express-server/api/) for endpoint testing examples
# PR Review Methodology

## What Makes a Good PR Review

### Technical Excellence
- **Logic Gap Detection**: Look for missing edge cases, incomplete validation, or flawed business logic
- **Dynamic Testing**: Ensure tests use random/generated data (Chance.js) rather than hardcoded values
- **Test Coverage**: Verify tests actually validate functionality, not just implementation details
- **Intentional Design**: Question unusual patterns - if intentional, ensure unit tests exist

### Code Quality Standards
- **CLAUDE.md Adherence**: Follow TDD approach, use Chance.js, proper error handling patterns
- **Security First**: Validate user ownership/permissions in same database query
- **Consistency**: Match existing codebase patterns and naming conventions
- **Error Handling**: Use `{ success: false, message: "..." }` format consistently
- **Martin Fowler's Testing Principles**: Apply the Testing Pyramid approach:
  - **Unit Tests**: Fast, isolated, test single units of behavior
  - **Integration Tests**: Test integration points, use real dependencies
  - **Avoid Over-Mocking**: Don't mock what you don't own
  - **Test Behavior, Not Implementation**: Tests should survive refactoring

### Review Focus Areas
1. **Business Logic Validation**
   - Are all edge cases handled?
   - Do validation rules make sense?
   - Are error messages helpful to users?

2. **Test Quality Assessment**
   - Do tests use dynamic data generation?
   - Are tests testing behavior, not implementation?
   - Is error handling properly tested?
   - Are integration tests using proper cleanup patterns?
   - **Martin Fowler's Testing Pyramid Applied**:
     - Are unit tests truly isolated and fast?
     - Do integration tests focus on integration concerns (DB, API contracts)?
     - Are we avoiding testing implementation details?
     - Can tests survive refactoring without changes?

3. **Security & Permissions**
   - Is user authorization checked correctly?
   - Are UUID validations preventing 500 errors?
   - Do database queries prevent unauthorized access?

4. **Code Maintainability**
   - Are functions single-purpose and well-named?
   - Is error handling consistent across layers?
   - Are database operations efficient and safe?

## How to Provide Helpful Review Responses

### For Human Reviewers
Provide clear, actionable feedback with:
- **Context**: Why is this important?
- **Examples**: Show what good/bad looks like
- **Suggestions**: Offer specific improvements
- **Questions**: Ask about intentional design decisions

### For Claude Integration
When responding to reviews, include:

#### Code Context
```javascript
// Provide relevant code snippets that need attention
// Include surrounding context for understanding
```

#### Specific Issues
- **File**: `path/to/file.js:lineNumber`
- **Issue**: Clear description of the problem
- **Impact**: What could go wrong?
- **Fix**: Specific suggestion or question

#### Test Improvements
```javascript
// Current test (if problematic)
expect(result).toBe(true);

// Suggested improvement
expect(result.success).toBe(true);
expect(result.data).toMatchObject({
  id: expect.any(String),
  amount: expect.any(String)
});
```

#### Questions for Clarification
- "Was this intentional? If so, we need a test for..."
- "Should this handle the case where...?"
- "Is there a reason we're not validating...?"

### Review Response Template

```markdown
## Review Response

### Code Context
[Paste relevant code snippets here]

### Issues Found
1. **Logic Gap**: [Description]
   - File: `path/to/file.js:line`
   - Problem: [What's wrong]
   - Fix: [Suggested solution]

2. **Test Quality**: [Description] 
   - Current: [What test does now]
   - Should: [What it should test instead]
   - Example: [Code example]

3. **Documentation Issues**: [Description]
   - Files: `/docs/api/[affected files]`
   - Missing: [What documentation is missing or outdated]
   - Required: [What needs to be added/updated]

### Documentation Review Checklist
- [ ] **Implementation Match**: Documentation accurately reflects the code changes
- [ ] **Error Response Format**: All examples use current error response format
- [ ] **New Features**: All implemented features documented with examples
- [ ] **Working Examples**: All curl commands match actual implementation and work
- [ ] **Breaking Changes**: Any changes that affect existing API usage are documented
- [ ] **Validation Changes**: Any new or modified validation rules are documented

### Questions
- [Specific questions about design decisions]
- [Edge cases to consider]
- [Documentation completeness questions]

### Suggestions
- [Specific improvements]
- [Pattern recommendations]
- [Documentation improvements]
```

## Review Categories

### 🔴 Must Fix (Blocking)
- Security vulnerabilities
- Logic errors that could cause data corruption
- Missing critical error handling
- Tests that don't actually test functionality
- **500 Error Prevention**: Incomplete input validation that could cause internal server errors
  - Missing user ID format validation (must be integer/UUID)
  - Missing query parameter validation (type, range, format)
  - Missing request body validation (required fields, data types, max lengths)
  - Missing JWT payload structure validation
  - Missing database parameter validation
- **Testing Anti-Patterns** (per Martin Fowler):
  - Tests that break on refactoring (testing implementation)
  - Over-mocked unit tests that don't test real behavior
  - Integration tests that mock the database
  - Tests with no clear assertion of behavior
- **Documentation Gaps** (Must Fix - Implementation Incomplete Without Docs):
  - API documentation not updated to reflect implementation changes
  - Code changes not reflected in corresponding endpoint documentation
  - New features implemented but not documented with examples
  - Error response changes not updated in documentation examples
  - New validation rules implemented but not documented with examples
  - Breaking changes implemented but not documented for users
  - Non-working curl examples in documentation (examples don't match implementation)

### 🟡 Should Fix (Non-blocking but important)
- Hardcoded test values instead of dynamic generation
- Missing edge case tests
- Inconsistent error message formats
- Performance concerns

### 🟢 Nice to Have (Optional improvements)
- Code organization suggestions
- Documentation improvements
- Additional test scenarios
- Pattern consistency

### ❓ Questions (Need clarification)
- Unusual design decisions
- Missing functionality
- Unclear business rules
- Test coverage gaps

## Success Metrics

A good review should result in:
- **Higher Code Quality**: Fewer bugs, better error handling
- **Better Tests**: Dynamic, behavior-focused testing
- **Learning**: Understanding of design decisions and trade-offs
- **Consistency**: Code that follows established patterns
- **Security**: Proper validation and authorization
- **Complete Documentation**: Current, accurate API docs that match implementation

### Documentation Success Criteria
- **100% Documentation Currency**: All API docs reflect current implementation
- **Working Examples**: All curl commands and JSON examples verified
- **Complete Error Coverage**: All possible error responses documented
- **User-Friendly**: Developers can use the API from docs alone
- **Searchable**: Documentation is well-organized and findable

### Documentation Review Requirements
Before any PR can be approved:
1. **All affected endpoints must have updated documentation**
2. **All examples must be tested and working with the actual implementation**
3. **Error responses must use current standard format** 
4. **All implemented features must be documented with examples**
5. **Breaking changes must be clearly documented for users**

**⚠️ PRs with incomplete documentation are considered incomplete implementations and must be marked as "Needs Work"**
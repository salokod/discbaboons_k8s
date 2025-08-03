# GitHub Branch Protection Setup

To require tests to pass before merging PRs, follow these steps:

## 1. Go to Repository Settings
- Navigate to your GitHub repository
- Click on **Settings** tab
- Click on **Branches** in the left sidebar

## 2. Add Branch Protection Rule
- Click **Add rule**
- Branch name pattern: `main` (or your default branch)

## 3. Configure Protection Settings
Check these boxes:
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - In the search box, type: `test` (this is the job name from our workflow)
  - Select the `test` check that appears
- ✅ **Require linear history** (optional but recommended)
- ✅ **Include administrators** (makes rules apply to everyone)

## 4. Workflow Status Check
The GitHub Action workflow we created will:
- Run on every push to `main` or `develop`
- Run on every pull request to `main` 
- Execute `npm run verify` which runs:
  1. `npm run lint` - Code linting
  2. `npm run test:unit` - Fast unit tests (mocked)
  3. `npm run test:integration` - Database integration tests

## 5. Testing the Setup
1. Create a test branch: `git checkout -b test-branch-protection`
2. Make a small change and push
3. Create a pull request to `main`
4. Verify that the "test" check must pass before merge button becomes available

## Workflow Details
- **Unit tests**: Run fast with mocked database (no PostgreSQL needed)
- **Integration tests**: Run with real PostgreSQL service container
- **Database migrations**: Flyway runs automatically to set up test schema
- **Environment**: Isolated test database for each CI run

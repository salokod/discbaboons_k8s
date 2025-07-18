// apps/express-server/tests/integration/setup.js
// Test setup and database configuration for raw SQL
import 'dotenv/config';
import { query, queryOne, queryRows } from '../../lib/database.js';

// Raw SQL database utilities for integration tests
export { query, queryOne, queryRows };

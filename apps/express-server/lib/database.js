// apps/express-server/lib/database.js
// Raw SQL database connection and utilities
import 'dotenv/config';

import pg from 'pg';

const { Pool } = pg;

// Build DATABASE_URL if not provided (for local development)
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Build from components
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.DB_HOST || 'postgres-service';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.POSTGRES_DB;

  if (!user || !password || !database) {
    throw new Error('Missing required database environment variables: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB');
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
}

// Create connection pool
const pool = new Pool({
  connectionString: getDatabaseUrl(),
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  ssl: false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1 as test');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Execute a query with parameters
export async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('error', error);
    }
    throw error; // Let the caller handle the error instead of returning null
  } finally {
    client.release();
  }
}

// Execute a query and return only the rows
export async function queryRows(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

// Execute a query and return only the first row
export async function queryOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Execute multiple queries in a transaction
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// SQL query builder utilities
export class QueryBuilder {
  constructor(tableName) {
    this.table = tableName;
    this.whereConditions = [];
    this.params = [];
    this.orderClauses = [];
    this.limitValue = null;
    this.offsetValue = null;
  }

  where(condition, value) {
    this.whereConditions.push(condition);
    this.params.push(value);
    return this;
  }

  whereIn(column, values) {
    if (values.length === 0) {
      this.whereConditions.push('FALSE'); // No matches
      return this;
    }
    const placeholders = values.map((_, index) => `$${this.params.length + 1 + index}`).join(', ');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  whereILike(column, value) {
    this.whereConditions.push(`${column} ILIKE $${this.params.length + 1}`);
    this.params.push(`%${value}%`);
    return this;
  }

  orderBy(column, direction = 'ASC') {
    this.orderClauses.push(`${column} ${direction}`);
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  offset(count) {
    this.offsetValue = count;
    return this;
  }

  buildSelect(columns = '*') {
    let sql = `SELECT ${columns} FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderClauses.length > 0) {
      sql += ` ORDER BY ${this.orderClauses.join(', ')}`;
    }

    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params: this.params };
  }

  buildCount() {
    let sql = `SELECT COUNT(*) as count FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    return { sql, params: this.params };
  }

  buildInsert(data) {
    const columns = Object.keys(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = columns.map((col) => data[col]);

    const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    return { sql, params: values };
  }

  buildUpdate(data) {
    const columns = Object.keys(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const values = columns.map((col) => data[col]);

    let sql = `UPDATE ${this.table} SET ${setClause}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
      values.push(...this.params);
    }

    sql += ' RETURNING *';

    return { sql, params: values };
  }

  buildDelete() {
    let sql = `DELETE FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    return { sql, params: this.params };
  }
}

// Helper function to create a new query builder
export function table(tableName) {
  return new QueryBuilder(tableName);
}

// Graceful shutdown
async function disconnectDatabase() {
  await pool.end();
}

// Handle shutdown signals
process.on('SIGINT', disconnectDatabase);
process.on('SIGTERM', disconnectDatabase);

export default pool;

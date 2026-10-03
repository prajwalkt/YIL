import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL! });

/**
 * Executes a PostgreSQL query using the Neon Serverless HTTPS connection.
 * Note: Use $1, $2 instead of @Param in your queries.
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('Database Query Error:', error.message, text.slice(0, 100));
    throw error;
  }
}

/**
 * Get a dedicated client from the pool (for transactions) - Not fully supported over HTTP, mocking it for compatibility
 */
export async function getClient() {
  return {
    query: async (text: string, params?: any[]) => query(text, params),
    release: () => {}
  };
}

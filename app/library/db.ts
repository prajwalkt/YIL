import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

export async function getConnection() {
  return {
    query: async (sqlStr: string, values?: any[]) => {
      const res = await pool.query(sqlStr, values);
      return { recordset: res.rows, rowsAffected: [res.rowCount] };
    },
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async (sqlStr: string, values?: any[]) => {
          const res = await client.query(sqlStr, values);
          return { recordset: res.rows, rowsAffected: [res.rowCount] };
        },
        release: () => client.release()
      };
    },
    request: () => {
      const inputs: Record<string, any> = {};
      return {
        input: function(name: string, value: any) {
          inputs[name] = value;
          return this;
        },
        query: async function(sqlStr: string) {
          let pgSql = sqlStr;
          const values: any[] = [];
          let index = 1;
          for (const [key, val] of Object.entries(inputs)) {
            const regex = new RegExp(`@${key}\\b`, 'g');
            if (regex.test(pgSql)) {
              pgSql = pgSql.replace(regex, `$${index}`);
              values.push(val);
              index++;
            }
          }
          const res = await pool.query(pgSql, values);
          return { recordset: res.rows, rowsAffected: [res.rowCount] };
        }
      };
    },
    transaction: () => {
      let client: any = null;
      return {
        begin: async () => {
          client = await pool.connect();
          await client.query('BEGIN');
        },
        query: async (sqlStr: string, values?: any[]) => {
          if (!client) throw new Error("Transaction not started");
          const res = await client.query(sqlStr, values);
          return { recordset: res.rows, rowsAffected: [res.rowCount] };
        },
        commit: async () => {
          if (client) {
            await client.query('COMMIT');
            client.release();
          }
        },
        rollback: async () => {
          if (client) {
            await client.query('ROLLBACK');
            client.release();
          }
        }
      };
    }
  };
}
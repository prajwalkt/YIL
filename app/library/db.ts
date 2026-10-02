import { query } from './db_pg';

class SqlServerToPgRequest {
  private inputs: Record<string, any> = {};

  input(name: string, typeOrValue: any, value?: any) {
    this.inputs[name] = value !== undefined ? value : typeOrValue;
    return this;
  }

  async query(sqlString: string) {
    // Basic MSSQL -> PG translations
    let pgSql = sqlString
      .replace(/GETDATE\(\)/gi, 'NOW()')
      .replace(/ISNULL\(/gi, 'COALESCE(')
      .replace(/OUTPUT INSERTED\.([a-zA-Z0-9_]+)/gi, 'RETURNING $1');

    // Replace @Param with $N and build values array
    const paramsArray: any[] = [];
    let paramIndex = 1;

    // Sort keys by length descending to prevent substring matching (e.g. @Id vs @Id_Course)
    const keys = Object.keys(this.inputs).sort((a, b) => b.length - a.length);

    for (const key of keys) {
      const regex = new RegExp(`@${key}\\b`, 'gi');
      if (pgSql.match(regex)) {
        pgSql = pgSql.replace(regex, `$${paramIndex}`);
        paramsArray.push(this.inputs[key]);
        paramIndex++;
      }
    }

    // Edge cases for specific queries that might fail
    pgSql = pgSql.replace(/BIT/gi, 'BOOLEAN');
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    pgSql = pgSql.replace(/IDENTITY\(1,1\)/gi, 'SERIAL');
    
    // Quick fix for SQL Server TOP 1 -> LIMIT 1
    if (pgSql.match(/SELECT\s+TOP\s+(\d+)/i)) {
       const limit = pgSql.match(/SELECT\s+TOP\s+(\d+)/i)![1];
       pgSql = pgSql.replace(/SELECT\s+TOP\s+\d+/i, 'SELECT');
       pgSql += ` LIMIT ${limit}`;
    }

    const res = await query(pgSql, paramsArray);

    return {
      recordset: res.rows,
      rowsAffected: [res.rowCount]
    };
  }
}

export async function getConnection() {
  return {
    request: () => new SqlServerToPgRequest(),
    close: async () => {} // Mock close
  };
}
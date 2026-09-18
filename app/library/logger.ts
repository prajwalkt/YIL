import { getConnection } from './db';

export async function logError(
  module: string,
  errorMessage: string,
  stackTrace: string = '',
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'ERROR' as any,
  userId: number | null = null
) {
  try {
    const pool = await getConnection();
    await pool.query(`
        INSERT INTO ErrorLogs (Module, UserID, ErrorMessage, StackTrace, Severity, Status, Timestamp)
        VALUES ($1, $2, $3, $4, $5, 'Open', CURRENT_TIMESTAMP)
      `, [module.substring(0, 100), userId, errorMessage.substring(0, 4000), stackTrace.substring(0, 4000), severity]);
  } catch (dbError) {
    console.error('Failed to write to ErrorLogs table:', dbError);
  }
}

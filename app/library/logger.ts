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
    await pool.request()
      .input('Module', module.substring(0, 100))
      .input('UserID', userId)
      .input('ErrorMessage', errorMessage.substring(0, 4000))
      .input('StackTrace', stackTrace.substring(0, 4000))
      .input('Severity', severity)
      .query(`
        INSERT INTO ErrorLogs (Module, UserID, ErrorMessage, StackTrace, Severity, Status, Timestamp)
        VALUES (@Module, @UserID, @ErrorMessage, @StackTrace, @Severity, 'Open', GETDATE())
      `);
  } catch (dbError) {
    console.error('Failed to write to ErrorLogs table:', dbError);
  }
}

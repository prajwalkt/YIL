import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import os from 'os';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    
    // DB Status (simple query to check latency)
    const startDb = Date.now();
    await pool.request().query('SELECT 1');
    const dbLatency = Date.now() - startDb;

    // Active Sessions (last 24 hours)
    const activeSessions = await pool.request().query(`
      SELECT COUNT(*) as count FROM LMS_Sessions WHERE IsActive = 1 AND ExpiresAt > GETDATE()
    `);

    // Failed Jobs / Errors (last 24 hours)
    const failedErrors = await pool.request().query(`
      SELECT COUNT(*) as count FROM ErrorLogs WHERE Timestamp > DATEADD(day, -1, GETDATE())
    `);

    // System info
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);
    
    const cpuLoad = os.loadavg(); // Returns an array containing the 1, 5, and 15 minute load averages.

    return NextResponse.json({
      success: true,
      health: {
        database: {
          status: 'Healthy',
          latencyMs: dbLatency
        },
        server: {
          status: 'Healthy',
          uptimeSeconds: process.uptime(),
          memoryUsagePercent,
          cpuLoad: cpuLoad[0].toFixed(2)
        },
        apiHealth: 'Healthy',
        activeSessions: activeSessions.recordset[0].count,
        failedJobs: failedErrors.recordset[0].count,
        runningJobs: 0, // Placeholder
        storageUsage: '45%' // Placeholder as filesystem size requires heavy scan
      }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error', health: { database: { status: 'Down' } } }, { status: 500 });
  }
}

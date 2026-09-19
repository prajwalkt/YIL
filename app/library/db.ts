import { Pool } from '@neondatabase/serverless';

const KNOWN_TABLES = [
  'Announcements', 'TrainingCalendar', 'Messages', 'Enrollments', 'CourseMaterials',
  'Certificates', 'WaitingList', 'Feedback', 'Assessments', 'AssessmentQuestions',
  'AssessmentResults', 'ErrorLogs', 'Testimonials', 'OrganizationBranding', 'Invoices',
  'CourseMaterialVersions', 'NotificationConfig', 'PasswordResetTokens', 'AuditLog',
  'Registrations', 'ReportTemplates', 'LoginAttempts', 'TrainingEnquiries', 'AffiliateRegions',
  'LMS_Sessions', 'VMTemplates', 'PaymentTracking', 'VMInstances', 'Notifications',
  'AssessmentResponses', 'FeedbackResponses', 'VMSessions', 'SystemSettings', 'Attendance',
  'NotificationLog', 'CourseModes', 'ELearningContent', 'LMS_Users', 'ELearningProgress',
  'TrainerProfiles', 'LMS_Courses'
];

function quoteTables(sql: string) {
  let processed = sql;
  for (const table of KNOWN_TABLES) {
    // Only quote if it's not already quoted and matches exactly as a word
    const regex = new RegExp(`\\b(?<!")(${table})(?!")\\b`, 'g');
    processed = processed.replace(regex, '"$1"');
  }
  return processed;
}

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

export async function getConnection() {
  return {
    query: async (sqlStr: string, values?: any[]) => {
      const res = await pool.query(quoteTables(sqlStr), values);
      return { recordset: res.rows, rowsAffected: [res.rowCount] };
    },
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async (sqlStr: string, values?: any[]) => {
          const res = await client.query(quoteTables(sqlStr), values);
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
          const res = await pool.query(quoteTables(pgSql), values);
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
          const res = await client.query(quoteTables(sqlStr), values);
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
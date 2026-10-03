const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_BERbJ8zHo0qh@ep-solitary-meadow-b32pps9s-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});
client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM "LMS_Courses"'))
  .then(res => console.log('LMS_Courses count:', res.rows))
  .catch(console.error)
  .then(() => client.query('SELECT COUNT(*) FROM "TrainingCalendar"'))
  .then(res => console.log('TrainingCalendar count:', res?.rows))
  .catch(console.error)
  .finally(() => client.end());

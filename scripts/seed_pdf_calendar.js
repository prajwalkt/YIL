require('dotenv').config({ path: '../.env.local' });
const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const lines = [
    ...fs.readFileSync('./ocr_page1.txt', 'utf8').split('\n'),
    ...fs.readFileSync('./ocr_page2.txt', 'utf8').split('\n')
  ].filter(l => l.trim().length > 0);

  let insertedCount = 0;
  
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const year = '2026';

  for (let line of lines) {
    // Regex to match "1 Course Title CODE DURATION <dates>"
    // CODE is usually 4 uppercase letters, duration is a number.
    const match = line.match(/^(\d+)\s+(.+?)\s+([A-Z]{4})\s+(\d+)\s+(.*)$/);
    if (!match) continue;

    let [_, id, title, code, duration, datesStr] = match;
    duration = parseInt(duration);

    // Get CourseID from LMS_Courses
    const [courses] = await connection.execute('SELECT CourseID FROM LMS_Courses WHERE Code = ? LIMIT 1', [code]);
    const courseId = courses.length > 0 ? courses[0].CourseID : null;

    // Some lines have '*' for holidays e.g. '5-16*' -> remove asterisk
    // Some lines have 'Sep' e.g. '31-4Sep' -> clean it
    datesStr = datesStr.replace(/\*/g, '').replace(/Sep/g, '');

    // Split by spaces to get the 12 month columns
    const columns = datesStr.trim().split(/\s+/);
    
    // Safety check: if we have more or less than 12, we just map them in order up to what we have (usually 12)
    // Actually, looking at the data, it's very consistent.
    
    for (let monthIdx = 0; monthIdx < Math.min(12, columns.length); monthIdx++) {
      const col = columns[monthIdx];
      if (!col || col === '..') continue;

      // Col can have multiple ranges separated by '/'
      const ranges = col.split('/');
      
      for (const range of ranges) {
        if (!range || !range.includes('-')) continue;
        
        const [startDayStr, endDayStr] = range.split('-');
        const startDay = parseInt(startDayStr, 10);
        let endDay = parseInt(endDayStr, 10);
        
        if (isNaN(startDay) || isNaN(endDay)) continue;

        let startMonth = months[monthIdx];
        let endMonth = months[monthIdx];
        
        // If it's something like 31-4 (spans into next month)
        let endYear = year;
        if (endDay < startDay) {
            let nextMonthIdx = monthIdx + 1;
            if (nextMonthIdx > 11) {
                nextMonthIdx = 0;
                endYear = '2027';
            }
            endMonth = months[nextMonthIdx];
        }

        const startDate = `${year}-${startMonth}-${String(startDay).padStart(2, '0')}`;
        const endDate = `${endYear}-${endMonth}-${String(endDay).padStart(2, '0')}`;

        // Insert into TrainingCalendar
        await connection.execute(`
          INSERT INTO TrainingCalendar 
          (CourseID, Title, TrainingType, StartDate, EndDate, Status, TMConfirmed, TMConfirmedAt, MaxParticipants, CurrentEnrolled)
          VALUES (?, ?, ?, ?, ?, 'SCHEDULED', 1, NOW(), 20, 0)
        `, [
          courseId, 
          title.trim(), 
          'Offline / Classroom', // Default to Offline, can be adjusted
          startDate, 
          endDate
        ]);
        insertedCount++;
      }
    }
  }

  console.log(`Successfully seeded ${insertedCount} historical batches from PDF data.`);
  await connection.end();
}

main().catch(console.error);

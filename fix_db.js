const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lms_db_backup.json', 'utf8'));
const keys = new Set();
Object.values(data).forEach(arr => {
  if(Array.isArray(arr)) arr.forEach(obj => Object.keys(obj).forEach(k => keys.add(k)));
});
const extraAliases = [
'ActiveCourses','BatchTitle','CalendarStatus','CalendarTitle','CertificatesIssued','ColorStatus','CourseCode','CourseName','CourseTitle','CreatorName','CurrentEnrolled','DaysAttended','EnrollmentStatus','FinanceApproved','FullName','FullyApproved','HolidayFlag','Id','IsCompleted','LastPosition','Mode','Month','MonthlyRevenue','OpenEnquiries','OverdueInvoices','PaidInvoices','ParticipantName','PaymentStatus','PendingApprovals','PendingInvoices','PendingPayments','PendingPaymentsAmount','PendingPaymentsCount','QuestionCount','ReceiverName','RegCount','RegistrationCount','RegistrationID','RegistrationStatus','Revenue','SeededEnrolled','SenderName','StudentEmail','StudentID','StudentName','TMConfirmed','Total','TotalAffiliates','TotalFeedback','TotalPayments','TotalRegistrations','TotalResponses','TotalRevenue','TotalSeconds','TotalStudents','TotalTrainers','TrainerFullName','TrainerName','Transactions','UploadedByName','UserEmail','UserRole','VerifiedPayments','VMName','WatchedSeconds', 'ActiveSessionToken', 'DurationDays', 'count', 'RegCount'
];
extraAliases.forEach(a => keys.add(a));
const keyMap = {};
Array.from(keys).forEach(k => {
    keyMap[k.toLowerCase()] = k;
});

const mapStr = JSON.stringify(keyMap, null, 2);
let dbFile = fs.readFileSync('app/library/db.ts', 'utf8');

const mapCode = 'const CaseMap: Record<string, string> = ' + mapStr + ';';

const newLogic = `    const caseInsensitiveRows = res.rows.map((row: any) => {
      if (!row) return row;
      const newRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        const mappedKey = CaseMap[lowerKey] || key;
        newRow[mappedKey] = value;
      }
      return newRow;
    });`;

const oldLogic = `    const caseInsensitiveRows = res.rows.map((row: any) => {
      return new Proxy(row, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            const lowerProp = prop.toLowerCase();
            const key = Object.keys(target).find(k => k.toLowerCase() === lowerProp);
            if (key) return target[key];
          }
          return target[prop];
        }
      });
    });`;

dbFile = dbFile.replace(oldLogic, newLogic);
// prepend CaseMap
dbFile = mapCode + '\n' + dbFile;
fs.writeFileSync('app/library/db.ts', dbFile);
console.log('Successfully updated db.ts');

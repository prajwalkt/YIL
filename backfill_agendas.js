process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_BERbJ8zHo0qh@ep-solitary-meadow-b32pps9s-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

const baseCourses = [
  { name: 'CENTUM VP DCS Operation', agendaPath: '/agendas/vpop.pdf' },
  { name: 'CENTUM VP DCS Fundamentals', agendaPath: '/agendas/FIPC.pdf' },
  { name: 'CENTUM VP DCS Engineering', agendaPath: '/agendas/vpeg.pdf' },
  { name: 'CENTUM VP DCS Fundamentals & Engineering', agendaPath: '/agendas/vpfe.pdf' },
  { name: 'CENTUM VP DCS Engineering & Maintenance', agendaPath: '/agendas/vpem.pdf' },
  { name: 'CENTUM VP DCS Maintenance', agendaPath: '/agendas/vpmn.pdf' },
  { name: 'CENTUM VP DCS Advanced Engineering', agendaPath: '/agendas/vpae.pdf' },
  { name: 'CENTUM VP DCS Batch Engineering', agendaPath: '/agendas/vbeg.pdf' },
  { name: 'CENTUM VP DCS AD Suite Engineering', agendaPath: '/agendas/vpad.pdf' },
  { name: 'Consolidated Alarm Management System', agendaPath: '/agendas/cams.pdf' },
  { name: 'SEBOL Programming', agendaPath: '/agendas/sebl.pdf' },
  { name: 'STARDOM NCS with FAST/TOOLS SCADA', agendaPath: '/agendas/stft.pdf' },
  { name: 'STARDOM NCS with CI Server', agendaPath: '/agendas/stci.pdf' },
  { name: 'STARDOM NCS Engineering', agendaPath: '/agendas/steg.pdf' },
  { name: 'FAST/TOOLS SCADA Operations', agendaPath: '/agendas/ftop.pdf' },
  { name: 'FAST/TOOLS SCADA Engineering', agendaPath: '/agendas/fteg.pdf' },
  { name: 'CI Server Operations', agendaPath: '/agendas/ciop.pdf' },
  { name: 'CI Server Engineering', agendaPath: '/agendas/cieg.pdf' },
  { name: 'Field Bus basics & Engineering', agendaPath: '/agendas/ffeg.pdf' },
  { name: 'Field Bus Engineering & PRM', agendaPath: '/agendas/fprm.pdf' },
  { name: 'PROFIBUS Basics and Engineering', agendaPath: '/agendas/pbus.pdf' },
  { name: 'Industrial Communication Protocols', agendaPath: '/agendas/incp.pdf' },
  { name: 'Field Instruments for Process Control', agendaPath: '/agendas/fipc.pdf' },
  { name: 'Asset Management Software- PRM', agendaPath: '/agendas/prmb.pdf' },
  { name: 'Cyber Security for Industrial Control System', agendaPath: '/agendas/csic.pdf' },
  { name: 'PROSAFE RS Operations', agendaPath: '/rsop.pdf' },
  { name: 'PROSAFE-RS Engineering with FAST/TOOLS SCADA', agendaPath: '/agendas/rsft.pdf' },
  { name: 'PROSAFE-RS Engineering with CI Server', agendaPath: '/agendas/rsci.pdf' },
  { name: 'PROSAFE RS Engineering', agendaPath: '/agendas/pprs.pdf' },
  { name: 'PROSAFE-RS Advanced Engineering', agendaPath: '/agendas/rsae.pdf' }
];

async function updateDB() {
  const courses = await sql`SELECT courseid, title, code, agendapdfpath FROM lms_courses`;
  let updatedCount = 0;
  
  for (const c of courses) {
    if (c.agendapdfpath === null) {
      const mapping = baseCourses.find(bc => bc.name === c.title);
      if (mapping) {
        await sql`UPDATE lms_courses SET agendapdfpath = ${mapping.agendaPath} WHERE courseid = ${c.courseid}`;
        updatedCount++;
      }
    }
  }
  
  console.log('Update Complete! Rows modified:', updatedCount);
}
updateDB().catch(console.error);

require('dotenv').config({ path: '.env.neon' });
const { Pool } = require('@neondatabase/serverless');

const baseCourses = [
  { id: 1, name: "CENTUM VP DCS Operation", code: "VPOP", days: "3", agendaPath: "/agendas/vpop.pdf" },
  { id: 2, name: "CENTUM VP DCS Fundamentals", code: "VPFD", days: "5", agendaPath: "/agendas/FIPC.pdf" },
  { id: 3, name: "CENTUM VP DCS Engineering", code: "VPEG", days: "5", agendaPath: "/agendas/vpeg.pdf" },
  { id: 4, name: "CENTUM VP DCS Fundamentals & Engineering", code: "VPFE", days: "5", agendaPath: "/agendas/vpfe.pdf" },
  { id: 5, name: "CENTUM VP DCS Engineering & Maintenance", code: "VPEM", days: "10", agendaPath: "/agendas/vpem.pdf" },
  { id: 6, name: "CENTUM VP DCS Maintenance", code: "VPMN", days: "3", agendaPath: "/agendas/vpmn.pdf" },
  { id: 7, name: "CENTUM VP DCS Advanced Engineering", code: "VPAE", days: "5", agendaPath: "/agendas/vpae.pdf" },
  { id: 8, name: "CENTUM VP DCS Batch Engineering", code: "VBEG", days: "5", agendaPath: "/agendas/vbeg.pdf" },
  { id: 9, name: "CENTUM VP DCS AD Suite Engineering", code: "VPAD", days: "5", agendaPath: "/agendas/vpad.pdf" },
  { id: 10, name: "Consolidated Alarm Management System", code: "CAMS", days: "2", agendaPath: "/agendas/cams.pdf" },
  { id: 11, name: "SEBOL Programming", code: "SEBL", days: "3", agendaPath: "/agendas/sebl.pdf" },
  { id: 12, name: "STARDOM NCS with FAST/TOOLS SCADA", code: "STFT", days: "5", agendaPath: "/agendas/stft.pdf" },
  { id: 13, name: "STARDOM NCS with CI Server", code: "STCI", days: "5", agendaPath: "/agendas/stci.pdf" },
  { id: 14, name: "STARDOM NCS Engineering", code: "STEG", days: "5", agendaPath: "/agendas/steg.pdf" },
  { id: 15, name: "FAST/TOOLS SCADA Operations", code: "FTOP", days: "2", agendaPath: "/agendas/ftop.pdf" },
  { id: 16, name: "FAST/TOOLS SCADA Engineering", code: "FTEG", days: "5", agendaPath: "/agendas/fteg.pdf" },
  { id: 17, name: "CI Server Operations", code: "CIOP", days: "2", agendaPath: "/agendas/ciop.pdf" },
  { id: 18, name: "CI Server Engineering", code: "CIEG", days: "5", agendaPath: "/agendas/cieg.pdf" },
  { id: 19, name: "Field Bus basics & Engineering", code: "FFEG", days: "3", agendaPath: "/agendas/ffeg.pdf" },
  { id: 20, name: "Field Bus Engineering & PRM", code: "FPRM", days: "5", agendaPath: "/agendas/fprm.pdf" },
  { id: 21, name: "PROFIBUS Basics and Engineering", code: "PBUS", days: "2", agendaPath: "/agendas/pbus.pdf" },
  { id: 22, name: "Industrial Communication Protocols", code: "INCP", days: "3", agendaPath: "/agendas/incp.pdf" },
  { id: 24, name: "Field Instruments for Process Control", code: "FIPC", days: "5", agendaPath: "/agendas/fipc.pdf" },
  { id: 25, name: "Asset Management Software- PRM", code: "PRMB", days: "3", agendaPath: "/agendas/prmb.pdf" },
  { id: 26, name: "Cyber Security for Industrial Control System", code: "CSIC", days: "3", agendaPath: "/agendas/csic.pdf" },
  { id: 27, name: "PROSAFE RS Operations", code: "RSOP", days: "2", agendaPath: "/rsop.pdf" },
  { id: 28, name: "PROSAFE-RS Engineering with FAST/TOOLS SCADA", code: "RSFT", days: "5", agendaPath: "/agendas/rsft.pdf" },
  { id: 29, name: "PROSAFE-RS Engineering with CI Server", code: "RSCI", days: "5", agendaPath: "/agendas/rsci.pdf" },
  { id: 30, name: "PROSAFE RS Engineering", code: "PPRS", days: "5", agendaPath: "/agendas/pprs.pdf" },
  { id: 31, name: "PROSAFE-RS Advanced Engineering", code: "RSAE", days: "5", agendaPath: "/agendas/rsae.pdf" },
];

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

async function run() {
  try {
    // 1. Reset all AgendaPDFPath to null
    await pool.query(`UPDATE "LMS_Courses" SET "AgendaPDFPath" = NULL`);
    
    // 2. Map correctly based on title
    for (const c of baseCourses) {
      const res = await pool.query(`UPDATE "LMS_Courses" SET "AgendaPDFPath" = $1 WHERE "Title" = $2`, [c.agendaPath, c.name]);
      if (res.rowCount > 0) {
        console.log(`Updated ${c.name} -> ${c.agendaPath}`);
      } else {
        console.log(`WARNING: Course not found in DB: ${c.name}`);
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

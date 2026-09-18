import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const pool = await getConnection();

    if (action === 'getTemplates') {
      const templates = await pool.query(`
        SELECT TemplateID, TemplateName, FiltersJSON, Layout, OutputType, SortBy, CreatedAt
        FROM ReportTemplates
        ORDER BY CreatedAt DESC
      `);
      return NextResponse.json({ success: true, templates: templates.recordset });
    }

    if (action === 'generate') {
      const type = searchParams.get('type') || 'Registration';
      const country = searchParams.get('country') || 'ALL';
      const course = searchParams.get('course') || 'ALL';
      const sortBy = searchParams.get('sortBy') || 'CreatedAt';
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      let query = '';
      let filters = 'WHERE 1=1';
      
      if (country !== 'ALL') filters += ` AND Country = '${country}'`;
      if (course !== 'ALL') filters += ` AND Course = '${course}'`;
      if (dateFrom) filters += ` AND CreatedAt >= '${dateFrom}'`;
      if (dateTo) filters += ` AND CreatedAt <= '${dateTo}'`;

      if (type === 'Registration') {
        query = `SELECT Id, Name, Email, Organization, Country, Course, TrainingMode, RegistrationType, Status, CreatedAt 
                 FROM Registrations ${filters} ORDER BY ${sortBy} DESC`;
      } else if (type === 'Attendance') {
        filters = filters.replace(/CreatedAt/g, 'SessionDate');
        query = `SELECT a.AttendanceID, a.SessionDate, a.Status, u.FirstName + ' ' + u.LastName as StudentName, c.Title as CourseName 
                 FROM Attendance a 
                 JOIN Enrollments e ON a.EnrollmentID = e.EnrollmentID 
                 JOIN LMS_Users u ON e.StudentID = u.UserID 
                 JOIN LMS_Courses c ON e.CourseID = c.CourseID
                 ${filters} ORDER BY ${sortBy === 'CreatedAt' ? 'SessionDate' : sortBy} DESC`;
      } else if (type === 'Financial') {
        filters = filters.replace(/CreatedAt/g, 'IssuedDate');
        if (country !== 'ALL') filters = filters.replace(/Country/g, 'r.Country');
        if (course !== 'ALL') filters = filters.replace(/Course/g, 'i.CourseName');
        query = `SELECT i.InvoiceNo, i.StudentName, i.Organization, i.CourseName, i.Amount, i.Currency, i.Status, i.IssuedDate, i.PaidDate 
                 FROM Invoices i
                 LEFT JOIN Registrations r ON i.RegistrationID = r.Id
                 ${filters} ORDER BY ${sortBy === 'CreatedAt' ? 'IssuedDate' : sortBy} DESC`;
      } else {
        query = `SELECT Id, Name, Email, Course, Status, CreatedAt FROM Registrations ${filters} ORDER BY CreatedAt DESC`;
      }

      const reportData = await pool.request().query(query);
      return NextResponse.json({ success: true, data: reportData.recordset });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' });
  } catch (error: any) {
    console.error('Reports Generator API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { templateName, filters, layout, outputType, sortBy } = data;
    const pool = await getConnection();
    
    // Hardcoded UserID 1 for now (admin)
    await pool.query(`
        INSERT INTO ReportTemplates (UserID, TemplateName, FiltersJSON, Layout, OutputType, SortBy)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [1, templateName, JSON.stringify(filters), layout || 'Standard', outputType || 'Display', sortBy || 'CreatedAt']);

    return NextResponse.json({ success: true, message: 'Template saved successfully.' });
  } catch (error: any) {
    console.error('Reports Generator POST API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

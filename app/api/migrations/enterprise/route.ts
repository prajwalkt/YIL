import { NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';

export async function GET() {
  try {
    const pool = await getConnection();

    // 1. Add SelectedSlotID to Registrations
    await pool.request().query(`
      IF COL_LENGTH('Registrations', 'SelectedSlotID') IS NULL
      BEGIN
          ALTER TABLE Registrations ADD SelectedSlotID INT NULL;
      END
    `);

    // 2. Add HolidayFlag to TrainingCalendar
    await pool.request().query(`
      IF COL_LENGTH('TrainingCalendar', 'HolidayFlag') IS NULL
      BEGIN
          ALTER TABLE TrainingCalendar ADD HolidayFlag BIT DEFAULT 0;
      END
    `);

    // 3. Create ReportTemplates Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ReportTemplates' AND xtype='U')
      BEGIN
          CREATE TABLE ReportTemplates (
              TemplateID INT IDENTITY(1,1) PRIMARY KEY,
              UserID INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID) ON DELETE CASCADE,
              TemplateName NVARCHAR(200) NOT NULL,
              FiltersJSON NVARCHAR(MAX),
              Layout NVARCHAR(100),
              OutputType NVARCHAR(50),
              SortBy NVARCHAR(50),
              CreatedAt DATETIME DEFAULT GETDATE(),
              UpdatedAt DATETIME DEFAULT GETDATE()
          );
      END
    `);

    return NextResponse.json({ success: true, message: 'Enterprise Migration completed successfully.' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

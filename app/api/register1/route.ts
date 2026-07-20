import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Ask Google what the tabs are actually named
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId!,
    });

    // 2. Get the name of the very first tab (index 0)
    const actualSheetName = spreadsheet.data.sheets?.[0].properties?.title;

    if (!actualSheetName) {
      throw new Error("No sheets found in this spreadsheet.");
    }

    // 3. Fetch data using the dynamic name
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId!,
      range: `'${actualSheetName}'!A:A`, // Notice the single quotes to handle spaces
    });

    const rows = response.data.values;
    
    // Subtract 1 for header, ensure it doesn't go below 0
    const count = rows && rows.length > 0 ? rows.length - 1 : 0;

    console.log(`✅ Success! Pulled from tab: "${actualSheetName}"`);
    return NextResponse.json({ count });

  } catch (error: any) {
    console.error("Detailed Google API Error:", error.message);
    return NextResponse.json({ count: 0, error: error.message }, { status: 500 });
  }
}
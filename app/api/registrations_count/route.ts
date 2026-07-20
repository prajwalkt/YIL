import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey?.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
      ],
    });

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId!,
    });

    const actualSheetName =
      spreadsheet.data.sheets?.[0].properties?.title;

    if (!actualSheetName) {
      throw new Error("No sheets found.");
    }

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId!,
        range: `'${actualSheetName}'!A:A`,
      });

    const rows = response.data.values;

    const count =
      rows && rows.length > 0
        ? rows.length - 1
        : 0;

    return NextResponse.json({
      count,
    });

  } catch (error: any) {

    return NextResponse.json(
      {
        count: 0,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
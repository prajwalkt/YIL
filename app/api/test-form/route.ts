import { NextRequest, NextResponse } from "next/server";
import { parseAndSanitizeFormData } from "../../library/validation";

export async function POST(request: NextRequest) {
  const formData = await parseAndSanitizeFormData(request);
  const trainingMode = formData.get("trainingMode")?.toString() || "";
  return NextResponse.json({ trainingMode });
}

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const output = execSync('npx tsc --noEmit', { encoding: 'utf-8', cwd: 'd:/YTS_FULL_PROJECT/yts_platform', stdio: 'pipe' });
    return new NextResponse(output, { status: 200 });
  } catch (e: any) {
    return new NextResponse(e.stdout + '\n' + e.stderr, { status: 200 });
  }
}

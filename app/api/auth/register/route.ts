import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Direct account registration is disabled. Please use the official Registration page.' 
    }, 
    { status: 403 }
  );
}

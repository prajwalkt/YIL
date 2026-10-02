import { NextResponse } from 'next/server';
import { getConnection } from '../../library/db';

export async function POST() {
  try {
    const pool = await getConnection();
    await pool.query("ALTER TABLE Registrations ALTER COLUMN PaymentProofPath TYPE TEXT");
    await pool.query("ALTER TABLE PaymentTracking ALTER COLUMN PaymentProofPath TYPE TEXT");
    return NextResponse.json({ success: true, message: 'Tables altered successfully to TEXT' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

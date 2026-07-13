import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: session.userId,
        username: session.username,
        role: session.role,
        gnDivisionId: session.gnDivisionId
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function GET() {
  try {
    const members = await prisma.committeeMember.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching committee members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { role, fullName, phoneNumber, photoBase64, orderIndex } = body;

    if (!role || !fullName || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newMember = await prisma.committeeMember.create({
      data: {
        role,
        fullName,
        phoneNumber,
        photoBase64,
        orderIndex: parseInt(orderIndex) || 0,
      },
    });

    return NextResponse.json({ success: true, data: newMember });
  } catch (error) {
    console.error('Error creating committee member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

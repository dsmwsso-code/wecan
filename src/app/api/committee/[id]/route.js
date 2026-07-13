import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { role, fullName, phoneNumber, photoBase64, orderIndex } = body;

    const updatedMember = await prisma.committeeMember.update({
      where: { id: parseInt(id) },
      data: {
        role,
        fullName,
        phoneNumber,
        photoBase64,
        orderIndex: parseInt(orderIndex) || 0,
      },
    });

    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error) {
    console.error('Error updating committee member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { id } = params;

    await prisma.committeeMember.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting committee member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

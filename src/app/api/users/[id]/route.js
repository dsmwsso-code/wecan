import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, hashPassword } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { username, password, gnDivisionId, isActive } = body;

    const dataToUpdate = {
      username,
      gnDivisionId: parseInt(gnDivisionId) || null,
      isActive
    };

    // Only update password if a new one is provided
    if (password && password.trim() !== '') {
      dataToUpdate.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 400 });
    }
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

    // Prevent deleting the currently logged-in super admin
    if (parseInt(id) === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await request.json();

    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null;
    if (data.photoBase64) updateData.photoBase64 = data.photoBase64;

    const updatedImage = await prisma.galleryImage.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      userId: session.id,
      action: 'EDIT',
      entity: 'GalleryImage',
      entityId: id,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, data: updatedImage });

  } catch (error) {
    console.error('Error updating gallery image:', error);
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

    const id = parseInt(params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    await prisma.galleryImage.delete({ where: { id } });

    await logAction({
      userId: session.id,
      action: 'DELETE',
      entity: 'GalleryImage',
      entityId: id,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

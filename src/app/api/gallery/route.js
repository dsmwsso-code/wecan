import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
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

    const data = await request.json();
    
    // We expect either photoBase64 (single) or photoBase64s (array)
    const photos = data.photoBase64s || (data.photoBase64 ? [data.photoBase64] : []);

    if (!data.title || photos.length === 0) {
      return NextResponse.json({ error: 'Title and at least one photo are required.' }, { status: 400 });
    }

    const createdImages = [];

    // Create a record for each photo
    for (const photo of photos) {
      const newImage = await prisma.galleryImage.create({
        data: {
          title: data.title,
          description: data.description || null,
          date: data.date ? new Date(data.date) : null,
          photoBase64: photo,
        }
      });
      createdImages.push(newImage);

      await logAction({
        userId: session.id,
        action: 'ADD',
        entity: 'GalleryImage',
        entityId: newImage.id,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    }

    return NextResponse.json({ success: true, data: createdImages });

  } catch (error) {
    console.error('Error adding gallery image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

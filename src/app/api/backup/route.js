import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const fileBuffer = await fs.readFile(dbPath);

    await logAction({
      userId: session.id,
      action: 'EXPORT_DB',
      entity: 'Database',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="wecan-backup-${new Date().toISOString().split('T')[0]}.db"`,
      },
    });

  } catch (error) {
    console.error('Error downloading backup:', error);
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

    const formData = await request.formData();
    const file = formData.get('db_file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    // Create a backup of the current db before overwriting just in case
    await fs.copyFile(dbPath, path.join(process.cwd(), 'prisma', `dev.db.bak.${Date.now()}`));

    // Overwrite the database
    await fs.writeFile(dbPath, buffer);

    await logAction({
      userId: session.id,
      action: 'IMPORT_DB',
      entity: 'Database',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Database restored successfully' });

  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

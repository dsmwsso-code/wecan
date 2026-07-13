import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'GnDivision'; // GnDivision, DisabilityCategory, DisabilityType

    let data = [];
    if (type === 'GnDivision') {
      data = await prisma.gnDivision.findMany({ orderBy: { id: 'asc' } });
    } else if (type === 'DisabilityCategory') {
      data = await prisma.disabilityCategory.findMany({ orderBy: { id: 'asc' } });
    } else if (type === 'DisabilityType') {
      data = await prisma.disabilityType.findMany({
        include: { category: true },
        orderBy: { id: 'asc' } 
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching master data:', error);
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

    const { type, name, categoryId } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let newData;
    if (type === 'GnDivision') {
      newData = await prisma.gnDivision.create({ data: { name } });
    } else if (type === 'DisabilityCategory') {
      newData = await prisma.disabilityCategory.create({ data: { name } });
    } else if (type === 'DisabilityType') {
      if (!categoryId) {
        return NextResponse.json({ error: 'Category ID is required for Disability Type' }, { status: 400 });
      }
      newData = await prisma.disabilityType.create({ data: { name, categoryId: parseInt(categoryId) } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error creating master data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { type, id, name, categoryId } = await request.json();

    if (!type || !id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let updatedData;
    if (type === 'GnDivision') {
      updatedData = await prisma.gnDivision.update({ where: { id: parseInt(id) }, data: { name } });
    } else if (type === 'DisabilityCategory') {
      updatedData = await prisma.disabilityCategory.update({ where: { id: parseInt(id) }, data: { name } });
    } else if (type === 'DisabilityType') {
      if (!categoryId) {
        return NextResponse.json({ error: 'Category ID is required for Disability Type' }, { status: 400 });
      }
      updatedData = await prisma.disabilityType.update({ where: { id: parseInt(id) }, data: { name, categoryId: parseInt(categoryId) } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Error updating master data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'GnDivision') {
      await prisma.gnDivision.delete({ where: { id: parseInt(id) } });
    } else if (type === 'DisabilityCategory') {
      await prisma.disabilityCategory.delete({ where: { id: parseInt(id) } });
    } else if (type === 'DisabilityType') {
      await prisma.disabilityType.delete({ where: { id: parseInt(id) } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting master data:', error);
    // Usually foreign key constraint errors happen here if they are used
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete because this data is being used by registered persons.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gnDivisionId = searchParams.get('gnDivisionId');
    const disabilityCategoryId = searchParams.get('disabilityCategoryId');
    const disabilityTypeId = searchParams.get('disabilityTypeId');
    const gender = searchParams.get('gender');
    const ageGroup = searchParams.get('ageGroup');
    const assistanceType = searchParams.get('assistanceType'); // 'financial', 'equipment', 'both'

    let whereClause = {};

    // For ADMIN, restrict to their GN Division
    if (session.role === 'ADMIN') {
      if (session.gnDivisionId) {
        whereClause.gnDivisionId = session.gnDivisionId;
      }
    } else {
      if (gnDivisionId) {
        const ids = gnDivisionId.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          whereClause.gnDivisionId = { in: ids };
        }
      }
    }

    if (disabilityCategoryId) {
      const ids = disabilityCategoryId.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereClause.disabilityCategoryId = { in: ids };
      }
    }

    if (disabilityTypeId) {
      const ids = disabilityTypeId.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereClause.disabilityTypeId = { in: ids };
      }
    }

    if (gender) {
      const genders = gender.split(',');
      if (genders.length > 0) {
        whereClause.gender = { in: genders };
      }
    }

    if (ageGroup) {
      const ages = ageGroup.split(',');
      if (ages.length > 0) {
        whereClause.OR = [];
        
        if (ages.includes('child')) {
          whereClause.OR.push({ age: { lt: 18 } });
        }
        if (ages.includes('adult')) {
          whereClause.OR.push({ age: { gte: 18, lt: 60 } });
        }
        if (ages.includes('elderly')) {
          whereClause.OR.push({ age: { gte: 60 } });
        }
        
        if (whereClause.OR.length === 0) {
          delete whereClause.OR;
        }
      }
    }

    if (assistanceType) {
      const types = assistanceType.split(',');
      if (types.length > 0) {
        const assistanceORs = [];
        
        if (types.includes('financial')) {
          assistanceORs.push({ assistances: { some: {} } });
        }
        if (types.includes('equipment')) {
          assistanceORs.push({ equipments: { some: {} } });
        }
        if (types.includes('both')) {
          assistanceORs.push({
            AND: [
              { assistances: { some: {} } },
              { equipments: { some: {} } }
            ]
          });
        }
        
        if (assistanceORs.length > 0) {
          if (whereClause.OR) {
            // If ageGroup already added OR, we need to AND them
            whereClause.AND = [
              { OR: whereClause.OR },
              { OR: assistanceORs }
            ];
            delete whereClause.OR;
          } else {
            whereClause.OR = assistanceORs;
          }
        }
      }
    }

    const persons = await prisma.disabledPerson.findMany({
      where: whereClause,
      include: {
        gnDivision: true,
        disabilityType: { include: { category: true } },
        assistances: { include: { assistanceType: true } },
        equipments: true,
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({ success: true, data: persons });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

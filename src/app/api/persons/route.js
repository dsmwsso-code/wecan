import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function POST(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Check for role-based GN division isolation
    if (session.role === 'ADMIN') {
      if (data.gnDivisionId !== session.gnDivisionId) {
        return NextResponse.json({ error: 'You can only register persons in your assigned GN Division' }, { status: 403 });
      }
    }

    // DUPLICATE PREVENTION LOGIC
    // Primary check: NIC
    if (data.nic) {
      const existingNic = await prisma.disabledPerson.findUnique({
        where: { nic: data.nic },
        include: { gnDivision: true, registeredBy: true },
      });

      if (existingNic) {
        return NextResponse.json({ 
          error: 'Duplicate Record: This person has already been registered.',
          details: {
            registeredGnDivision: existingNic.gnDivision.name,
            registeredDate: existingNic.registeredAt,
            registeredBy: existingNic.registeredBy.username,
          }
        }, { status: 409 });
      }
    } else {
      // Fallback check: Name + DOB + Mobile
      const existingPerson = await prisma.disabledPerson.findFirst({
        where: {
          fullName: data.fullName,
          dob: new Date(data.dob),
          mobileNumber: data.mobileNumber,
        },
        include: { gnDivision: true, registeredBy: true },
      });

      if (existingPerson) {
        return NextResponse.json({ 
          error: 'Duplicate Record: This person has already been registered (Matched by Name, DOB, and Mobile).',
          details: {
            registeredGnDivision: existingPerson.gnDivision.name,
            registeredDate: existingPerson.registeredAt,
            registeredBy: existingPerson.registeredBy.username,
          }
        }, { status: 409 });
      }
    }

    // Generate Registration Number (e.g. DP-YYYY-MM-0001)
    const count = await prisma.disabledPerson.count();
    const regNo = `DP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // Calculate Age if not provided accurately
    const birthDate = new Date(data.dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    // Create the record
    const newPerson = await prisma.disabledPerson.create({
      data: {
        registrationNumber: regNo,
        nic: data.nic || `TEMP-${Date.now()}`,
        profilePhotoBase64: data.profilePhotoBase64 || null,
        fullName: data.fullName,
        nameWithInitials: data.nameWithInitials,
        gender: data.gender,
        dob: birthDate,
        age: age,
        maritalStatusId: data.maritalStatusId ? parseInt(data.maritalStatusId) : null,
        mobileNumber: data.mobileNumber,
        altContactNumber: data.altContactNumber,
        gnDivisionId: parseInt(data.gnDivisionId),
        villageId: data.villageId ? parseInt(data.villageId) : null,
        address: data.address,
        disabilityCategoryId: parseInt(data.disabilityCategoryId),
        disabilityTypeId: parseInt(data.disabilityTypeId),
        disabilityPercentage: data.disabilityPercentage ? parseInt(data.disabilityPercentage) : null,
        causeOfDisability: data.causeOfDisability,
        disabilityStartDate: data.disabilityStartDate ? new Date(data.disabilityStartDate) : null,
        educationLevelId: data.educationLevelId ? parseInt(data.educationLevelId) : null,
        schoolAttended: data.schoolAttended,
        employmentStatusId: data.employmentStatusId ? parseInt(data.employmentStatusId) : null,
        occupation: data.occupation,
        monthlyIncome: data.monthlyIncome ? parseFloat(data.monthlyIncome) : null,
        assistanceReceived: JSON.stringify(data.assistanceReceived || []),
        headOfFamily: data.headOfFamily,
        familyMembersCount: data.familyMembersCount ? parseInt(data.familyMembersCount) : null,
        guardianName: data.guardianName,
        guardianContact: data.guardianContact,
        hospital: data.hospital,
        doctor: data.doctor,
        medicalCertificateNumber: data.medicalCertificateNumber,
        medicalCertificateExpiry: data.medicalCertificateExpiry ? new Date(data.medicalCertificateExpiry) : null,
        notes: data.notes,
        registeredById: session.id,
        familyMembers: {
          create: (data.familyMembers || []).map(fm => ({
            fullName: fm.fullName,
            dob: fm.dob ? new Date(fm.dob) : null,
            nic: fm.nic || null,
            relationship: fm.relationship,
            phoneNumber: fm.phoneNumber || null,
            occupation: fm.occupation || null
          }))
        },
        equipments: {
          create: (data.equipments || []).map(eq => ({
            equipmentName: eq.equipmentName,
            receivedYear: eq.receivedYear || null
          }))
        }
      },
    });

    // Handle legacy assistances array if provided
    if (data.assistanceTypeIds && Array.isArray(data.assistanceTypeIds)) {
      await prisma.personAssistance.createMany({
        data: data.assistanceTypeIds.map(id => ({
          personId: newPerson.id,
          assistanceTypeId: parseInt(id),
        }))
      });
    }

    // Audit Log
    await logAction({
      userId: session.id,
      action: 'ADD',
      entity: 'DisabledPerson',
      entityId: newPerson.id,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, data: newPerson });

  } catch (error) {
    console.error('Error registering person:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const gnDivisionId = searchParams.get('gnDivisionId');

    const whereClause = {};

    if (session.role === 'ADMIN') {
      whereClause.gnDivisionId = session.gnDivisionId;
    } else if (gnDivisionId) {
      whereClause.gnDivisionId = parseInt(gnDivisionId);
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { nic: { contains: search } },
        { registrationNumber: { contains: search } },
      ];
    }

    const persons = await prisma.disabledPerson.findMany({
      where: whereClause,
      include: {
        gnDivision: true,
        disabilityType: true,
      },
      orderBy: { registeredAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: persons });

  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

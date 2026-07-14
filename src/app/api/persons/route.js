import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { logAction } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const person = await prisma.disabledPerson.findUnique({
      where: { id: parseInt(id) },
      include: {
        gnDivision: true,
        village: true,
        maritalStatus: true,
        disabilityCategory: true,
        disabilityType: true,
        educationLevel: true,
        employmentStatus: true,
        familyMembers: true,
        equipments: true,
        assistances: {
          include: {
            assistanceType: true
          }
        },
        registeredBy: {
          select: { username: true }
        }
      }
    });

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Role-based access control for ADMIN to only see their GN Division
    if (session.role === 'ADMIN' && person.gnDivisionId !== session.gnDivisionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: person });

  } catch (error) {
    console.error('Error fetching person details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const personId = parseInt(id);
    const data = await request.json();

    // Check existing person
    const existingPerson = await prisma.disabledPerson.findUnique({
      where: { id: personId }
    });

    if (!existingPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Role-based access control
    if (session.role === 'ADMIN') {
      if (existingPerson.gnDivisionId !== session.gnDivisionId || data.gnDivisionId !== session.gnDivisionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Duplicate check for NIC (if changed)
    if (data.nic && data.nic !== existingPerson.nic && !data.nic.startsWith('TEMP-')) {
      const existingNic = await prisma.disabledPerson.findUnique({
        where: { nic: data.nic },
      });
      if (existingNic) {
        return NextResponse.json({ error: 'Duplicate Record: This NIC is already registered.' }, { status: 409 });
      }
    }

    // Calculate Age if not provided accurately
    const birthDate = new Date(data.dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    // Perform Update (Use a transaction to delete relations and recreate them)
    const updatedPerson = await prisma.$transaction(async (tx) => {
      // 1. Delete existing relations
      await tx.familyMember.deleteMany({ where: { personId } });
      await tx.equipmentAssistance.deleteMany({ where: { personId } });
      await tx.personAssistance.deleteMany({ where: { personId } });

      // 2. Update main record and recreate relations
      const updated = await tx.disabledPerson.update({
        where: { id: personId },
        data: {
          nic: data.nic || existingPerson.nic,
          profilePhotoBase64: data.profilePhotoBase64 !== undefined ? data.profilePhotoBase64 : existingPerson.profilePhotoBase64,
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

      // 3. Recreate PersonAssistances if needed
      if (data.assistanceTypeIds && Array.isArray(data.assistanceTypeIds)) {
        await tx.personAssistance.createMany({
          data: data.assistanceTypeIds.map(id => ({
            personId: updated.id,
            assistanceTypeId: parseInt(id),
          }))
        });
      }

      return updated;
    });

    // Audit Log
    await logAction({
      userId: session.id,
      action: 'EDIT',
      entity: 'DisabledPerson',
      entityId: updatedPerson.id,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, data: updatedPerson });

  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const personId = parseInt(id);

    // Check existing person
    const existingPerson = await prisma.disabledPerson.findUnique({
      where: { id: personId }
    });

    if (!existingPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Role-based access control
    if (session.role === 'ADMIN' && existingPerson.gnDivisionId !== session.gnDivisionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete related records and the person
    await prisma.$transaction(async (tx) => {
      await tx.familyMember.deleteMany({ where: { personId } });
      await tx.equipmentAssistance.deleteMany({ where: { personId } });
      await tx.personAssistance.deleteMany({ where: { personId } });
      await tx.document.deleteMany({ where: { personId } });
      
      await tx.disabledPerson.delete({ where: { id: personId } });
    });

    // Audit Log
    await logAction({
      userId: session.id,
      action: 'DELETE',
      entity: 'DisabledPerson',
      entityId: personId,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Person deleted successfully' });

  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

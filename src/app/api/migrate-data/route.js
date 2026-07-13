import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const backupPath = path.join(process.cwd(), 'backup.json');
    const rawData = fs.readFileSync(backupPath, 'utf8');
    const data = JSON.parse(rawData);

    async function insertMany(model, records) {
      if (records && records.length > 0) {
        await prisma[model].createMany({
          data: records,
          skipDuplicates: true
        });
      }
    }

    await insertMany('gnDivision', data.gnDivisions);
    await insertMany('village', data.villages);
    await insertMany('educationLevel', data.educationLevels);
    await insertMany('maritalStatus', data.maritalStatuses);
    await insertMany('disabilityCategory', data.disabilityCategories);
    await insertMany('disabilityType', data.disabilityTypes);
    await insertMany('employmentStatus', data.employmentStatuses);
    await insertMany('assistanceType', data.assistanceTypes);
    await insertMany('user', data.users);
    
    // Main person records
    await insertMany('disabledPerson', data.disabledPersons);
    
    // Relations
    await insertMany('familyMember', data.familyMembers);
    await insertMany('equipmentAssistance', data.equipmentAssistances);
    await insertMany('personAssistance', data.personAssistances);
    await insertMany('document', data.documents);
    await insertMany('galleryImage', data.galleryImages);
    await insertMany('auditLog', data.auditLogs);
    await insertMany('committeeMember', data.committeeMembers);

    return NextResponse.json({ success: true, message: 'Data imported successfully to Supabase!' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

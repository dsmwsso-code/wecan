const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  console.log('Starting data import...');
  const rawData = fs.readFileSync('backup.json', 'utf8');
  const data = JSON.parse(rawData);

  // Function to insert data ignoring duplicates or inserting one by one
  async function insertMany(model, records) {
    if (records && records.length > 0) {
      console.log(`Importing ${records.length} records into ${model}...`);
      await prisma[model].createMany({
        data: records,
        skipDuplicates: true
      });
    }
  }

  try {
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

    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();

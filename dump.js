const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function dump() {
  console.log('Starting data dump...');
  
  const data = {};
  
  // Define tables in order of dependencies (no dependencies first)
  data.gnDivisions = await prisma.gnDivision.findMany();
  data.villages = await prisma.village.findMany();
  data.educationLevels = await prisma.educationLevel.findMany();
  data.maritalStatuses = await prisma.maritalStatus.findMany();
  data.disabilityCategories = await prisma.disabilityCategory.findMany();
  data.disabilityTypes = await prisma.disabilityType.findMany();
  data.employmentStatuses = await prisma.employmentStatus.findMany();
  data.assistanceTypes = await prisma.assistanceType.findMany();
  data.users = await prisma.user.findMany();
  data.disabledPersons = await prisma.disabledPerson.findMany();
  data.familyMembers = await prisma.familyMember.findMany();
  data.equipmentAssistances = await prisma.equipmentAssistance.findMany();
  data.personAssistances = await prisma.personAssistance.findMany();
  data.documents = await prisma.document.findMany();
  data.galleryImages = await prisma.galleryImage.findMany();
  data.auditLogs = await prisma.auditLog.findMany();
  data.committeeMembers = await prisma.committeeMember.findMany();
  
  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
  console.log('Dump completed successfully to backup.json');
}

dump()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

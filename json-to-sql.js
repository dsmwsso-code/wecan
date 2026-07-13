const fs = require('fs');

const rawData = fs.readFileSync('backup.json', 'utf8');
const data = JSON.parse(rawData);

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Escape single quotes by doubling them
    const escaped = val.replace(/'/g, "''");
    return `'${escaped}'`;
  }
  // Fallback
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(tableName, records) {
  if (!records || records.length === 0) return '';
  const columns = Object.keys(records[0]).map(col => `"${col}"`).join(', ');
  let sql = `\n-- Insert data for ${tableName}\n`;
  for (const record of records) {
    const values = Object.values(record).map(escape).join(', ');
    sql += `INSERT INTO "${tableName}" (${columns}) VALUES (${values});\n`;
  }
  return sql;
}

let sqlOutput = '';
sqlOutput += generateInserts('GnDivision', data.gnDivisions);
sqlOutput += generateInserts('Village', data.villages);
sqlOutput += generateInserts('EducationLevel', data.educationLevels);
sqlOutput += generateInserts('MaritalStatus', data.maritalStatuses);
sqlOutput += generateInserts('DisabilityCategory', data.disabilityCategories);
sqlOutput += generateInserts('DisabilityType', data.disabilityTypes);
sqlOutput += generateInserts('EmploymentStatus', data.employmentStatuses);
sqlOutput += generateInserts('AssistanceType', data.assistanceTypes);
sqlOutput += generateInserts('User', data.users);
sqlOutput += generateInserts('DisabledPerson', data.disabledPersons);
sqlOutput += generateInserts('FamilyMember', data.familyMembers);
sqlOutput += generateInserts('EquipmentAssistance', data.equipmentAssistances);
sqlOutput += generateInserts('PersonAssistance', data.personAssistances);
sqlOutput += generateInserts('Document', data.documents);
sqlOutput += generateInserts('GalleryImage', data.galleryImages);
sqlOutput += generateInserts('AuditLog', data.auditLogs);
sqlOutput += generateInserts('CommitteeMember', data.committeeMembers);

fs.writeFileSync('insert_data.sql', sqlOutput);
console.log('Successfully generated insert_data.sql');

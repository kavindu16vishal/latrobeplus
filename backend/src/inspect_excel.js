const xlsx = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../database/CSE_results_150_students_3_Subject_SIM.xlsx');
const workbook = xlsx.readFile(filePath);

console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\nSheet: ${sheetName}`);
  console.log('Headers:', json[0]);
  console.log('First data row:', json[1]);
});

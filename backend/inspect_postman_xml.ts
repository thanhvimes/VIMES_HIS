import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, '../modules/health-check-sync/docs/Postman_example.txt');
const fileContent = fs.readFileSync(filePath, 'utf8');

const dataMatch = fileContent.match(/"data":\s*"([^"]+)"/);
const rawBase64 = dataMatch![1];
const xmlContent = Buffer.from(rawBase64, 'base64').toString('utf8');

console.log("=== FULL DECODED XML FROM POSTMAN_EXAMPLE.TXT ===");
console.log(xmlContent);

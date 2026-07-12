const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../modules/health-check-sync/forms/PrintFormMau3.tsx');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const normalizedContent = content.normalize('NFC');
    fs.writeFileSync(filePath, normalizedContent, 'utf8');
    console.log('✅ PrintFormMau3.tsx normalized to NFC successfully!');
} catch (err) {
    console.error('❌ Error normalizing file:', err);
}

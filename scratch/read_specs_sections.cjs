const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/1551_technical_specs.md', 'utf-8');

function printSection(title, nextTitle) {
    const startIdx = content.indexOf(title);
    const endIdx = content.indexOf(nextTitle, startIdx + 1);
    if (startIdx !== -1) {
        console.log(content.substring(startIdx, endIdx !== -1 ? endIdx : undefined).substring(0, 2500));
    } else {
        console.log('Section not found:', title);
    }
}

console.log('=== MAU 1 ADMIN FIELDS ===');
printSection('## MẪU 1:', '## MẪU 2:');

console.log('=== MAU 2 ADMIN FIELDS ===');
printSection('## MẪU 2:', '## MẪU 3:');

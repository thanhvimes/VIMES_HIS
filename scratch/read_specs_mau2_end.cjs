const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/1551_technical_specs.md', 'utf-8');

const title = '## MẪU 2:';
const nextTitle = '## MẪU 3:';
const startIdx = content.indexOf(title);
const endIdx = content.indexOf(nextTitle, startIdx + 1);
if (startIdx !== -1) {
    // Print lines from 3000 to 5500 in this section
    console.log(content.substring(startIdx, endIdx !== -1 ? endIdx : undefined).substring(2300, 4800));
}

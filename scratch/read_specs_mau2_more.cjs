const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/1551_technical_specs.md', 'utf-8');

const title = '## MẪU 2:';
const nextTitle = '## MẪU 3:';
const startIdx = content.indexOf(title);
const endIdx = content.indexOf(nextTitle, startIdx + 1);
if (startIdx !== -1) {
    // Print lines from 2500 to 5000 in this section
    console.log(content.substring(startIdx, endIdx !== -1 ? endIdx : undefined).substring(1000, 3500));
}

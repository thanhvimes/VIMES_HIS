const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/1551_technical_specs.md', 'utf-8');

const title = '## MẪU 5:';
const nextTitle = '## MẪU 6:';
const startIdx = content.indexOf(title);
const endIdx = content.indexOf(nextTitle, startIdx + 1);
if (startIdx !== -1) {
    console.log(content.substring(startIdx, endIdx !== -1 ? endIdx : undefined).substring(0, 3000));
}

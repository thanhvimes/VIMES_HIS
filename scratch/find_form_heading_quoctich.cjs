const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/1551_technical_specs.md', 'utf-8');

const idx = content.indexOf('QUOC_TICH');
if (idx !== -1) {
    const textBefore = content.substring(0, idx);
    const lastHeader = textBefore.lastIndexOf('## MẪU');
    if (lastHeader !== -1) {
        console.log('Match is under form heading:', textBefore.substring(lastHeader, textBefore.indexOf('\n', lastHeader)));
    }
}

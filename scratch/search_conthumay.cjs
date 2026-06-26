const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/1551_technical_specs.md', 'utf-8');

const regex = /CON_THU_MAY/g;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
    matches.push(match.index);
}

console.log(`Found ${matches.length} matches of CON_THU_MAY:`);
matches.forEach((idx, i) => {
    console.log(`Match ${i+1}:`);
    console.log(content.substring(idx - 150, idx + 250));
    console.log('---');
});

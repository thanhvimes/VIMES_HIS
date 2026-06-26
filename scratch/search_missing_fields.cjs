const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/specs_comparison_report.md', 'utf-8');

const regex = /chưa được nhập liệu|hành chính/gi;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
    matches.push(match.index);
}

console.log(`Found ${matches.length} matches:`);
matches.slice(0, 15).forEach((idx, i) => {
    console.log(`Match ${i+1}:`);
    console.log(content.substring(idx - 100, idx + 200));
    console.log('---');
});

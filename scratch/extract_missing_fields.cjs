const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/specs_comparison_report.md', 'utf-8');

const regex = /#### ⚠️ Trường có trong QĐ 1551 gốc nhưng hiện tại CHƯA ĐƯỢC NHẬP LIỆU trên Form \(`DynamicForm\.tsx`\):([\s\S]*?)(?=####|#|$)/g;
let match;
const missingFieldsBySection = [];
while ((match = regex.exec(content)) !== null) {
    const sectionIndex = match.index;
    const textBefore = content.substring(0, sectionIndex);
    const lastHeader = textBefore.lastIndexOf('#');
    const header = lastHeader !== -1 ? textBefore.substring(lastHeader, textBefore.indexOf('\n', lastHeader)).trim() : 'Unknown';
    missingFieldsBySection.push({
        header,
        fields: match[1].trim().split('\n').map(line => line.trim())
    });
}

console.log(JSON.stringify(missingFieldsBySection, null, 2));

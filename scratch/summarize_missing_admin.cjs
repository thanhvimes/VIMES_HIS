const fs = require('fs');
const content = fs.readFileSync('d:/AI/vClinic/modules/health-check-sync/docs/specs_comparison_report.md', 'utf-8');

const regex = /#### ⚠️ Trường có trong QĐ 1551 gốc nhưng hiện tại CHƯA ĐƯỢC NHẬP LIỆU trên Form \(`DynamicForm\.tsx`\):([\s\S]*?)(?=####|#|$)/g;
let match;
const adminTags = [
    'MA_CSKCB', 'QUOC_TICH', 'CON_THU_MAY', 'SO_CCCD_NGH', 'NGUOI_GIAM_HO',
    'HO_TEN_NGUOI_DI_CUNG', 'SO_CCCD_NGUOI_DI_CUNG', 'MOI_QUAN_HE_VOI_TRE',
    'NGAY_VAO', 'LY_DO_VV', 'LY_DO_KSK', 'MA_GTIN_CSKCB', 'MATINH_CU_TRU', 'MAXA_CU_TRU',
    'NGAYCAP_CCCD', 'NOICAP_CCCD', 'DOI_TUONG', 'NGUON_KINH_PHI', 'NHOM_MAU'
];

const found = {};
while ((match = regex.exec(content)) !== null) {
    const lines = match[1].trim().split('\n');
    lines.forEach(line => {
        adminTags.forEach(tag => {
            if (line.includes(`\`${tag}\``)) {
                if (!found[tag]) found[tag] = [];
                // Find section header
                const textBefore = content.substring(0, match.index);
                const lastHeader = textBefore.lastIndexOf('#');
                const header = lastHeader !== -1 ? textBefore.substring(lastHeader, textBefore.indexOf('\n', lastHeader)).trim() : 'Unknown';
                found[tag].push(header);
            }
        });
    });
}

console.log('Missing administrative fields summary:');
console.log(JSON.stringify(found, null, 2));

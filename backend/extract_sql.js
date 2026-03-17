const fs = require('fs');

const content = fs.readFileSync('D:\\DEV\\VIMESClinic\\HMSReception\\HMSRegistration.cpp', 'utf16le');
const lines = content.split('\n');

const functionsToFind = [
    'CHMSRegistration::OnEthnicLoadData',
    'CHMSRegistration::OnOccupationLoadData',
    'CHMSRegistration::OnRoomLoadData',
    'CHMSRegistration::OnExamTypeLoadData'
];

let fullOutput = '';
functionsToFind.forEach(fn => {
    let found = false;
    let braces = 0;

    for (let i = 0; i < lines.length; i++) {
        if (!found && lines[i].includes(fn)) {
            found = true;
            fullOutput += `\n--- ${fn} (Line ${i + 1}) ---\n`;
        }

        if (found) {
            fullOutput += lines[i] + '\n';
            if (lines[i].includes('{')) braces += (lines[i].match(/{/g) || []).length;
            if (lines[i].includes('}')) {
                braces -= (lines[i].match(/}/g) || []).length;
                if (braces <= 0) break;
            }
        }
    }
});

fs.writeFileSync('sql_output_utf8.txt', fullOutput, 'utf8');

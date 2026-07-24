import fs from 'fs';
import path from 'path';

function convertFile() {
    const filePath = 'd:/AI/VIMES_HIS/modules/health-check-sync/components/ContractManagement.tsx';
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }
    const buffer = fs.readFileSync(filePath);
    // Detect if UTF-16LE (first two bytes are 0xFF 0xFE)
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        console.log('UTF-16LE encoding detected. Converting to UTF-8...');
        const content = buffer.toString('utf16le');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully converted to UTF-8!');
    } else {
        console.log('File is not UTF-16LE encoded. (First bytes:', buffer[0], buffer[1], ')');
    }
}

convertFile();

const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\AI\\VIMES_HIS';
const excludeDirs = ['.git', 'node_modules', 'dist', '.vscode', 'archive', 'release', 'scratch'];

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            if (excludeDirs.includes(file)) continue;
            walk(filepath, callback);
        } else {
            callback(filepath);
        }
    }
}

const keyReplacements = [
    { from: /VIMES HIS-secure-master-key-2026-vimes-jsc-admin/g, to: 'vClinic-secure-master-key-2026-vimes-jsc-admin' },
    { from: /default-secret-VIMES HIS-2026-key-32chars/g, to: 'default-secret-vClinic-2026-key-32chars' },
    { from: /VIMES HIS-secure-pass-2026/g, to: 'vClinic-secure-pass-2026' },
    { from: /VIMES HIS-super-secret-key-change-in-production-2026-min-32-characters/g, to: 'vClinic-super-secret-key-change-in-production-2026-min-32-characters' }
];

walk(rootDir, (filepath) => {
    try {
        let content = fs.readFileSync(filepath, 'utf8');
        let original = content;
        keyReplacements.forEach(({ from, to }) => {
            content = content.replace(from, to);
        });
        if (content !== original) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`Reverted keys in: ${filepath}`);
        }
    } catch (e) {
        // skip unreadable
    }
});

console.log('Revert keys process complete.');

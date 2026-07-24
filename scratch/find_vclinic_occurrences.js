const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\AI\\VIMES_HIS';
const excludeDirs = ['.git', 'node_modules', 'dist', '.vscode', 'archive', 'release', 'scratch'];
const excludeFiles = ['all_patients.json', 'db_debug.log', 'db_diagnostic.json', 'debug_db.json', 'sys_version_dump.json'];

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            if (excludeDirs.includes(file)) continue;
            walk(filepath, callback);
        } else {
            if (excludeFiles.includes(file)) continue;
            if (file.endsWith('.log')) continue;
            callback(filepath);
        }
    }
}

const results = [];

walk(rootDir, (filepath) => {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        if (/vclinic/i.test(content)) {
            const matches = [];
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (/vclinic/i.test(line)) {
                    matches.push({ lineNum: index + 1, content: line.trim() });
                }
            });
            results.push({ filepath, matches });
        }
    } catch (e) {
        // skip binary or unreadable
    }
});

console.log(JSON.stringify(results, null, 2));

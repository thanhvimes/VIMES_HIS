const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Running git inspect...');
    const status = execSync('git status', { encoding: 'utf8' });
    const diff = execSync('git diff', { encoding: 'utf8' });
    const log = execSync('git log -p -S PrintBarcodeForm -n 3', { encoding: 'utf8' });
    
    fs.writeFileSync('git_inspect.txt', `=== STATUS ===\n${status}\n\n=== LOG SEARCH ===\n${log}\n\n=== DIFF ===\n${diff}`);
    console.log('Successfully wrote results to git_inspect.txt in the project root.');
} catch (error) {
    fs.writeFileSync('git_inspect.txt', `Error running git: ${error.message}\n${error.stderr || ''}`);
    console.error('Error running git:', error);
}

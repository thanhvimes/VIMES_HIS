import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendScript = path.resolve(__dirname, '../backend/scripts/update-contract-address.ts');
const backendDir = path.resolve(__dirname, '../backend');

const rawArgs = process.argv.slice(2);

// Build child process without trigger DEP0190 warning
const isWindows = process.platform === 'win32';
const cmd = isWindows ? 'cmd.exe' : 'npx';
const cmdArgs = isWindows 
    ? ['/d', '/c', 'npx', 'ts-node', backendScript, ...rawArgs]
    : ['ts-node', backendScript, ...rawArgs];

const child = spawn(cmd, cmdArgs, {
    cwd: backendDir,
    stdio: 'inherit'
});

child.on('exit', (code) => {
    process.exit(code ?? 0);
});

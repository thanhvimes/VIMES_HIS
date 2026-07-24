import { sendDocumentsToVNeID } from './src/services/health-check-sync.service.ts';

async function main() {
    console.log('📡 Calling sendDocumentsToVNeID directly for Doc ID 2215 ...');
    try {
        const result = await sendDocumentsToVNeID(['2215']);
        console.log('✅ sendDocumentsToVNeID completed.');
        console.log('Result:', result);
    } catch (e: any) {
        console.error('❌ Error during execution:', e.message);
    }
    process.exit(0);
}

main();

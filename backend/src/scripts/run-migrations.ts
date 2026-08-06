import migrationService from '../services/migration.service';

async function main() {
    console.log('🚀 Running database migrations...');
    try {
        await migrationService.runMigrations();
        console.log('🎉 Migrations finished successfully.');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

main();

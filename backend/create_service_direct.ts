
import { query, pool } from './src/config/database';

async function create() {
    let client;
    try {
        client = await pool.connect();
        
        const payload = {
            mode: 'ADD_PATIENT',
            currentUser: 'admin',
            patient: {
                surname: 'NGUYEN',
                midName: 'VAN',
                firstName: 'NAM',
                birthDate: '1990-10-10',
                sex: 'M',
                sin: 'SV' + (Date.now() % 1000000),
                ethnic: 1,
                provId: 1,
                distId: 1,
                villId: 1,
                dtlAddr: 'Ho Chi Minh',
                occupation: 1,
                nationality: 'VN'
            },
            doc: {
                telephone: '0988776655',
                objectId: 'S', // Service
                admitDept: 'NOI2'
            },
            exam: {
                deptId: 'NOI2',
                roomId: 5,
                examType: 'E01',
                preDiagnostic: 'Kham Dich Vu'
            }
        };

        console.log("Creating Service patient: NGUYEN VAN NAM...");
        const result = await client.query(
            `SELECT hms_register_patient_v2($1::jsonb) AS data`,
            [JSON.stringify(payload)]
        );
        
        console.log("SUCCESS:", JSON.stringify(result.rows[0].data, null, 2));
        process.exit(0);
    } catch (e: any) {
        console.error("DB ERROR:", e.message);
        process.exit(1);
    } finally {
        if (client) client.release();
    }
}

create();


import { query, pool } from './src/config/database';

async function create() {
    let client;
    try {
        client = await pool.connect();
        
        const payload = {
            mode: 'ADD_PATIENT',
            currentUser: 'admin',
            patient: {
                surname: 'TRUONG',
                midName: 'QUOC',
                firstName: 'ANH',
                birthDate: '1980-05-15',
                sex: 'M',
                sin: 'QA' + (Date.now() % 1000000), // Ensure short unique SIN
                ethnic: 1,
                provId: 1,
                distId: 1,
                villId: 1,
                dtlAddr: 'Ha Noi',
                occupation: 1,
                nationality: 'VN'
            },
            doc: {
                telephone: '0912345678',
                objectId: 'I',
                insRegDate: '2024-01-01',
                disRate: 80,
                admitDept: 'NOI2',
                maDoiTuongKcb: '1'
            },
            card: {
                cardNo: 'GD' + (Date.now() % 1000000000), // Short card no
                regDate: '2024-01-01',
                expDate: '2024-12-31',
                regCode: '01001'
            },
            exam: {
                deptId: 'NOI2',
                roomId: 5,
                examType: 'E01',
                preDiagnostic: 'Kham BHYT'
            }
        };

        console.log("Creating BHYT patient: TRUONG QUOC ANH...");
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

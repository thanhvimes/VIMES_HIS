
import { query } from '../src/config/database';

async function bugTest() {
    const payload = {
        mode: 'ADD_PATIENT',
        currentUser: 'test',
        patient: { surname: 'A', firstName: 'B', sex: 'M' },
        doc: { objectId: 'S' },
        exam: { roomId: 101, deptId: 'KKB' }
    };

    try {
        await query(`SELECT hms_register_patient_v2($1::jsonb)`, [JSON.stringify(payload)]);
        console.log('Success!');
    } catch (err: any) {
        const errorDetail = `
            Message: ${err.message}
            Detail: ${err.detail}
            Hint: ${err.hint}
            Code: ${err.code}
            Where: ${err.where}
        `;
        require('fs').writeFileSync('debug_error.txt', errorDetail);
        console.log('Error written to debug_error.txt');
    }
}

bugTest();

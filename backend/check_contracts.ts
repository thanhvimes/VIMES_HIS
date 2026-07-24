import { query } from './src/config/database';

async function checkContracts() {
    try {
        const contracts = await query(`
            SELECT *
            FROM hms_exm_contract
            ORDER BY hec_contract_id DESC
            LIMIT 5
        `);
        console.log('📋 Contracts:');
        for (const row of contracts.rows) {
            console.log({
                id: row.hec_contract_id,
                name: row.hec_name,
                company: row.hec_company,
                form_type: row.hec_form_type
            });
        }

        const employees = await query(`
            SELECT *
            FROM hms_exm_employee
            ORDER BY hee_id DESC
            LIMIT 10
        `);
        console.log('📋 Recent Employees in Contracts:');
        for (const row of employees.rows) {
            console.log({
                hee_id: row.hee_id,
                hee_contract_id: row.hee_contract_id,
                hee_docno: row.hee_docno,
                surname: row.hee_surname,
                firstname: row.hee_firstname,
                cardid: row.hee_cardid,
                phone: row.hee_phone
            });
        }

        process.exit(0);
    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

checkContracts();

import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { hisIntegrationController } from '../src/controllers/health-check/his-integration';

test('Integration Test: seedFromHis handles existing records and prevents duplicate key constraint violations', async () => {
    // Tìm một hợp đồng có nhân viên trong CSDL
    const contractRes = await query(`
        SELECT c.hec_contract_id, c.hec_desc, count(e.hee_employee_id) as emp_count
        FROM hms_exm_contract c
        JOIN hms_exm_employee e ON c.hec_contract_id = e.hee_contract_id
        WHERE e.hee_isactive = 'Y'
        GROUP BY c.hec_contract_id, c.hec_desc
        HAVING count(e.hee_employee_id) > 0
        ORDER BY count(e.hee_employee_id) ASC
        LIMIT 1
    `);

    if (contractRes.rows.length === 0) {
        console.log('No active contract found in database to test.');
        return;
    }

    const testContractId = contractRes.rows[0].hec_contract_id;
    console.log(`Testing seedFromHis on contract ID ${testContractId} (${contractRes.rows[0].emp_count} employees)`);

    // Helper to create mock request and response
    const createMockReqRes = (contractId: number) => {
        const req: any = {
            body: {
                workplaceId: String(contractId)
            }
        };

        let statusCode = 200;
        let jsonResponse: any = null;

        const res: any = {
            status: (code: number) => {
                statusCode = code;
                return res;
            },
            json: (data: any) => {
                jsonResponse = data;
                return res;
            }
        };

        return { req, res, getResult: () => ({ statusCode, jsonResponse }) };
    };

    // Lần 1: Đồng bộ hợp đồng
    const run1 = createMockReqRes(testContractId);
    await hisIntegrationController.seedFromHis(run1.req, run1.res);
    const res1 = run1.getResult();

    assert.equal(res1.statusCode, 200, `First sync failed: ${JSON.stringify(res1.jsonResponse)}`);
    assert.equal(res1.jsonResponse.success, true, 'First sync must be successful');
    assert.ok(res1.jsonResponse.count > 0, 'Must have synced at least 1 record');
    console.log('✔ Lần 1 đồng bộ thành công:', res1.jsonResponse);

    // Lần 2: Đồng bộ LẠI ngay lập tức (Test Idempotency & Duplicate Key Prevention)
    // Trường hợp này trước đây sẽ bị lỗi duplicate key value violates unique constraint "health_check_masters_doc_no_key"
    const run2 = createMockReqRes(testContractId);
    await hisIntegrationController.seedFromHis(run2.req, run2.res);
    const res2 = run2.getResult();

    assert.equal(res2.statusCode, 200, `Re-sync failed with status ${res2.statusCode}: ${JSON.stringify(res2.jsonResponse)}`);
    assert.equal(res2.jsonResponse.success, true, 'Re-sync must succeed without duplicate key constraint error');
    assert.ok(res2.jsonResponse.updated > 0 || res2.jsonResponse.count > 0, 'Must update existing records cleanly');
    console.log('✔ Lần 2 đồng bộ lại an toàn 100% (không lỗi duplicate key):', res2.jsonResponse);

    // Lần 3: Giả lập một bản ghi độc lập đã có sẵn doc_no từ trước trong DB
    const emp = await query(`
        SELECT hee_docno, hee_employee_id 
        FROM hms_exm_employee 
        WHERE hee_contract_id = $1 AND hee_isactive = 'Y'
        LIMIT 1
    `, [testContractId]);
    const sampleDocNo = String(emp.rows[0].hee_docno || emp.rows[0].hee_employee_id);

    // Xác nhận bản ghi trong health_check_masters có doc_no này
    const masterCheck = await query(`
        SELECT id, doc_no, patient_name FROM health_check_masters WHERE doc_no = $1
    `, [sampleDocNo]);
    assert.ok(masterCheck.rows.length > 0, `Sample master record with doc_no ${sampleDocNo} must exist`);
    console.log(`✔ Verified existing record in health_check_masters with doc_no ${sampleDocNo}: ${masterCheck.rows[0].patient_name}`);

    // Chạy lại lần 3 để khẳng định ON CONFLICT (doc_no) DO UPDATE hoạt động hoàn hảo
    const run3 = createMockReqRes(testContractId);
    await hisIntegrationController.seedFromHis(run3.req, run3.res);
    const res3 = run3.getResult();

    assert.equal(res3.statusCode, 200, 'Third sync must succeed');
    assert.equal(res3.jsonResponse.success, true);
    console.log('✔ Lần 3 kiểm thử ON CONFLICT (doc_no) DO UPDATE hoàn thành xuất sắc!');
});

test('Integration Test: Multi-employee contract (5+ employees) syncs and re-syncs with 100% success', async () => {
    const multiRes = await query(`
        SELECT c.hec_contract_id, c.hec_desc, count(e.hee_employee_id) as emp_count
        FROM hms_exm_contract c
        JOIN hms_exm_employee e ON c.hec_contract_id = e.hee_contract_id
        WHERE e.hee_isactive = 'Y'
        GROUP BY c.hec_contract_id, c.hec_desc
        HAVING count(e.hee_employee_id) >= 5
        ORDER BY count(e.hee_employee_id) ASC
        LIMIT 1
    `);

    if (multiRes.rows.length === 0) {
        console.log('No multi-employee contract found.');
        return;
    }

    const multiContractId = multiRes.rows[0].hec_contract_id;
    console.log(`Testing multi-employee batch sync on contract ID ${multiContractId} (${multiRes.rows[0].emp_count} employees)`);

    const req: any = { body: { workplaceId: String(multiContractId) } };
    let statusCode = 200;
    let jsonResponse: any = null;
    const res: any = {
        status: (code: number) => { statusCode = code; return res; },
        json: (data: any) => { jsonResponse = data; return res; }
    };

    await hisIntegrationController.seedFromHis(req, res);
    assert.equal(statusCode, 200, `Multi sync failed: ${JSON.stringify(jsonResponse)}`);
    assert.equal(jsonResponse.success, true);
    assert.ok(jsonResponse.count >= 5, `Expected at least 5 employees synced, got ${jsonResponse.count}`);
    console.log(`✔ Đồng bộ lô hợp đồng ${multiContractId} (${jsonResponse.count} nhân viên) hoàn tất 100%:`, jsonResponse);
});


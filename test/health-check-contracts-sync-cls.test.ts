import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
if (process.env.DB_HOST === '192.168.0.200' || !process.env.DB_HOST) {
    process.env.DB_HOST = '14.177.232.29';
    process.env.DB_PORT = '8050';
    process.env.DB_NAME = 'vimes_ym';
}

let pool: any;
let contractsController: any;
let employeesController: any;

test.before(async () => {
    const dbMod = await import('../src/config/database');
    pool = dbMod.pool;
    const contractsMod = await import('../src/controllers/health-check/contracts.controller');
    contractsController = contractsMod.contractsController;
    const employeesMod = await import('../src/controllers/health-check/employees.controller');
    employeesController = employeesMod.employeesController;
});

test.after(async () => {
    if (pool) {
        await pool.end().catch(() => {});
    }
});

test('syncContractParaclinicalResults validates invalid contract ID gracefully', async () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: 'invalid-id' },
        body: {}
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await contractsController.syncContractParaclinicalResults(mockReq, mockRes);
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.success, false);
    assert.match(jsonResponse.message, /không hợp lệ/);
});

test('syncContractParaclinicalResults returns 404 for non-existent contract', async () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: '999999999' },
        body: {}
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await contractsController.syncContractParaclinicalResults(mockReq, mockRes);
    assert.equal(statusCode, 404);
    assert.equal(jsonResponse.success, false);
    assert.match(jsonResponse.message, /Không tìm thấy hợp đồng/);
});

test('syncContractParaclinicalResults runs smoothly on real contract', async () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const contractCheck = await pool.query('SELECT hec_contract_id FROM hms_exm_contract ORDER BY hec_contract_id DESC LIMIT 1');
    const testContractId = contractCheck.rows.length > 0 ? String(contractCheck.rows[0].hec_contract_id) : '35';

    const mockReq: any = {
        params: { id: testContractId },
        body: { mode: 'missing_only' },
        user: { username: 'test_admin' }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await contractsController.syncContractParaclinicalResults(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.equal(jsonResponse.success, true);
    assert.ok(jsonResponse.stats);
    assert.ok(jsonResponse.stats.totalReceived >= 0);
    assert.ok(typeof jsonResponse.stats.updatedCount === 'number');
});

test('getContractEmployees returns employees with has_cls_result boolean field', async () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const contractCheck = await pool.query('SELECT hec_contract_id FROM hms_exm_contract ORDER BY hec_contract_id DESC LIMIT 1');
    const testContractId = contractCheck.rows.length > 0 ? String(contractCheck.rows[0].hec_contract_id) : '35';

    const mockReq: any = {
        params: { id: testContractId }
    };
    const mockRes: any = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(data: any) {
            jsonResponse = data;
            return this;
        }
    };

    await employeesController.getContractEmployees(mockReq, mockRes);
    assert.equal(statusCode, 200);
    assert.ok(Array.isArray(jsonResponse));
    if (jsonResponse.length > 0) {
        assert.ok('has_cls_result' in jsonResponse[0]);
        assert.equal(typeof jsonResponse[0].has_cls_result, 'boolean');
    }
});

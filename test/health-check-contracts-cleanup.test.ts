import test from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../src/config/database';
import { contractsController } from '../src/controllers/health-check/contracts.controller';

test('cleanupUnreceivedEmployees validates invalid contract ID gracefully', async () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: 'invalid-id' }
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

    await contractsController.cleanupUnreceivedEmployees(mockReq, mockRes);
    assert.equal(statusCode, 400);
    assert.equal(jsonResponse.success, false);
    assert.match(jsonResponse.message, /không hợp lệ/);
});

test('cleanupUnreceivedEmployees returns 404 for non-existent contract', async () => {
    let statusCode = 200;
    let jsonResponse: any = null;

    const mockReq: any = {
        params: { id: '999999999' }
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

    await contractsController.cleanupUnreceivedEmployees(mockReq, mockRes);
    assert.equal(statusCode, 404);
    assert.equal(jsonResponse.success, false);
    assert.match(jsonResponse.message, /Không tìm thấy hợp đồng/);
});

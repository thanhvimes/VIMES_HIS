import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import authMiddleware from '../src/middleware/authMiddleware';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

function recorder() {
  const state = { status: 200, body: undefined as any };
  return { state, response: { status(code: number) { state.status = code; return this; }, json(body: any) { state.body = body; return this; } } as any };
}

test('rejects missing bearer token', () => {
  const { state, response } = recorder();
  authMiddleware({ headers: {}, get: () => undefined } as any, response, () => assert.fail());
  assert.equal(state.status, 401);
});

test('accepts a valid typed staff token', () => {
  const token = jwt.sign({ userId: 'doctor', groupId: 'D', permissions: ['02.05'], tokenType: 'staff' }, process.env.JWT_SECRET!);
  const request: any = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  authMiddleware(request, recorder().response, () => { called = true; });
  assert.equal(called, true);
  assert.equal(request.userId, 'doctor');
  assert.deepEqual(request.permissions, ['02.05']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { requireSignaturePermission } from '../src/routes/document-signature.routes';

function run(permissions: string[] | undefined, required: string) {
  let status = 200; let called = false;
  const middleware = requireSignaturePermission(required);
  middleware({ permissions } as any, { status: (value: number) => { status = value; return { json: () => undefined }; } } as any, () => { called = true; });
  return { status, called };
}

test('signature permission denies by default outside test mode', () => {
  const oldNode = process.env.NODE_ENV; const oldFlag = process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS;
  process.env.NODE_ENV = 'production'; delete process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS;
  try { assert.deepEqual(run([], 'DOCUMENT_SIGNATURE_SIGN'), { status: 403, called: false }); }
  finally { if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode; if (oldFlag === undefined) delete process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS; else process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = oldFlag; }
});

test('signature signer permission allows sign but not admin-only placeholder management', () => {
  const oldNode = process.env.NODE_ENV; const oldFlag = process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS;
  process.env.NODE_ENV = 'production'; process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = 'true';
  try { assert.deepEqual(run(['DOCUMENT_SIGNATURE_SIGN'], 'DOCUMENT_SIGNATURE_SIGN'), { status: 200, called: true }); assert.deepEqual(run(['DOCUMENT_SIGNATURE_SIGN'], 'DOCUMENT_SIGNATURE_PLACEHOLDER_MANAGE'), { status: 403, called: false }); }
  finally { if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode; if (oldFlag === undefined) delete process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS; else process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = oldFlag; }
});

test('signature admin bypasses individual signature permissions', () => {
  const oldNode = process.env.NODE_ENV; const oldFlag = process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS;
  process.env.NODE_ENV = 'production'; process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = 'true';
  try { assert.deepEqual(run(['DOCUMENT_SIGNATURE_ADMIN'], 'DOCUMENT_SIGNATURE_AUDIT_VIEW'), { status: 200, called: true }); }
  finally { if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode; if (oldFlag === undefined) delete process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS; else process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = oldFlag; }
});

test('audit permission is separate from signing permission', () => {
  const oldNode = process.env.NODE_ENV; const oldFlag = process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS;
  process.env.NODE_ENV = 'production'; process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = 'true';
  try { assert.deepEqual(run(['DOCUMENT_SIGNATURE_SIGN'], 'DOCUMENT_SIGNATURE_AUDIT_VIEW'), { status: 403, called: false }); assert.deepEqual(run(['DOCUMENT_SIGNATURE_AUDIT_VIEW'], 'DOCUMENT_SIGNATURE_AUDIT_VIEW'), { status: 200, called: true }); }
  finally { if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode; if (oldFlag === undefined) delete process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS; else process.env.DOCUMENT_SIGNATURE_ENFORCE_PERMISSIONS = oldFlag; }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { requireStudioPermission } from '../src/routes/template-studio.routes';

test('template studio middleware returns 403 without permission when enforcement is enabled', () => {
  const previous = process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS;
  process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS = 'true';
  try {
    let status = 200; let called = false;
    const middleware = requireStudioPermission('DOCUMENT_TEMPLATE_PUBLISH');
    middleware({ permissions: ['DOCUMENT_TEMPLATE_EDIT'] } as any, { status: (value: number) => { status = value; return { json: () => undefined }; } } as any, () => { called = true; });
    assert.equal(status, 403); assert.equal(called, false);
  } finally {
    if (previous === undefined) delete process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS; else process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS = previous;
  }
});

test('template studio permissions are enforced by default outside test mode', () => {
  const previousNode = process.env.NODE_ENV;
  const previousFlag = process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS;
  process.env.NODE_ENV = 'production'; delete process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS;
  try {
    let status = 200; let called = false;
    const middleware = requireStudioPermission('DOCUMENT_TEMPLATE_VIEW');
    middleware({ permissions: [] } as any, { status: (value: number) => { status = value; return { json: () => undefined }; } } as any, () => { called = true; });
    assert.equal(status, 403); assert.equal(called, false);
  } finally {
    if (previousNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNode;
    if (previousFlag === undefined) delete process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS; else process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS = previousFlag;
  }
});

test('mapping preview permission is separated from publish permission', () => {
  const previous = process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS; process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS = 'true';
  try {
    let status = 200; let called = false;
    requireStudioPermission('DOCUMENT_TEMPLATE_EDIT')({ permissions: ['DOCUMENT_TEMPLATE_VIEW'] } as any, { status: (value: number) => { status = value; return { json: () => undefined }; } } as any, () => { called = true; });
    assert.equal(status, 403); assert.equal(called, false);
  } finally { if (previous === undefined) delete process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS; else process.env.TEMPLATE_STUDIO_ENFORCE_PERMISSIONS = previous; }
});

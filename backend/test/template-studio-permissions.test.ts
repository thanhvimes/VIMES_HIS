import test from 'node:test';
import assert from 'node:assert/strict';
import { hasTemplateStudioPermission, TEMPLATE_STUDIO_PERMISSIONS } from '../src/template-studio/permissions';

test('template studio permissions enforce role separation', () => {
  assert.equal(hasTemplateStudioPermission(['DOCUMENT_TEMPLATE_EDIT'], TEMPLATE_STUDIO_PERMISSIONS.EDIT), true);
  assert.equal(hasTemplateStudioPermission(['DOCUMENT_TEMPLATE_EDIT'], TEMPLATE_STUDIO_PERMISSIONS.PUBLISH), false);
  assert.equal(hasTemplateStudioPermission(['DOCUMENT_TEMPLATE_ADMIN'], TEMPLATE_STUDIO_PERMISSIONS.PUBLISH), true);
});

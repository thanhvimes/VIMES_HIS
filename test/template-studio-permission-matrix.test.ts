import assert from 'node:assert/strict';
import test from 'node:test';
import { TEMPLATE_STUDIO_PERMISSIONS, hasTemplateStudioPermission } from '../src/template-studio/permissions';

test('template studio permission matrix grants only the requested capability or admin', () => {
    assert.equal(hasTemplateStudioPermission([TEMPLATE_STUDIO_PERMISSIONS.VIEW], TEMPLATE_STUDIO_PERMISSIONS.VIEW), true);
    assert.equal(hasTemplateStudioPermission([TEMPLATE_STUDIO_PERMISSIONS.VIEW], TEMPLATE_STUDIO_PERMISSIONS.EDIT), false);
    assert.equal(hasTemplateStudioPermission([TEMPLATE_STUDIO_PERMISSIONS.ADMIN], TEMPLATE_STUDIO_PERMISSIONS.PUBLISH), true);
    assert.equal(hasTemplateStudioPermission([], TEMPLATE_STUDIO_PERMISSIONS.ADMIN), false);
});

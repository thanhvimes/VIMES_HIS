export const TEMPLATE_STUDIO_PERMISSIONS = {
    VIEW: 'DOCUMENT_TEMPLATE_VIEW',
    EDIT: 'DOCUMENT_TEMPLATE_EDIT',
    TEST: 'DOCUMENT_TEMPLATE_TEST',
    REVIEW: 'DOCUMENT_TEMPLATE_REVIEW',
    PUBLISH: 'DOCUMENT_TEMPLATE_PUBLISH',
    ADMIN: 'DOCUMENT_TEMPLATE_ADMIN'
} as const;

export type TemplateStudioPermission = typeof TEMPLATE_STUDIO_PERMISSIONS[keyof typeof TEMPLATE_STUDIO_PERMISSIONS];

export function hasTemplateStudioPermission(permissions: string[] | undefined, required: TemplateStudioPermission): boolean {
    const values = new Set(permissions || []);
    return values.has(TEMPLATE_STUDIO_PERMISSIONS.ADMIN) || values.has(required);
}

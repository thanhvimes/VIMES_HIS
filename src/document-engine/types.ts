export type DocumentOutputFormat = 'pdf' | 'docx';

export interface DocumentTemplateManifest {
    code: string;
    name: string;
    version: number;
    file: string;
    documentType: string;
    status: 'published';
    artifactKey?: string;
    sha256?: string;
}

export interface RenderScopeOptions {
    facilityId?: string;
    departmentId?: string;
    asOfDate?: string | Date;
}

export interface RenderDocumentRequest extends RenderScopeOptions {
    templateCode: string;
    templateVersion?: number;
    outputFormat: DocumentOutputFormat;
    data: Record<string, unknown>;
    idempotencyKey?: string;
    isEmergency?: boolean;
    patientId?: string | number;
    receptionId?: string | number;
    encounterId?: string | number;
    documentType?: string;
}

export interface RenderedDocument {
    content: Buffer;
    contentType: string;
    filename: string;
    template: DocumentTemplateManifest;
    isIdempotencyHit?: boolean;
    renderDurationMs?: number;
}

export interface DocumentRenderer {
    render(template: DocumentTemplateManifest, data: Record<string, unknown>, outputFormat: DocumentOutputFormat): Promise<Buffer>;
}

export type DocumentOutputFormat = 'pdf' | 'docx';

export interface DocumentTemplateManifest {
    code: string;
    name: string;
    version: number;
    file: string;
    documentType: string;
    status: 'published';
}

export interface RenderDocumentRequest {
    templateCode: string;
    templateVersion?: number;
    outputFormat: DocumentOutputFormat;
    data: Record<string, unknown>;
}

export interface RenderedDocument {
    content: Buffer;
    contentType: string;
    filename: string;
    template: DocumentTemplateManifest;
}

export interface DocumentRenderer {
    render(template: DocumentTemplateManifest, data: Record<string, unknown>, outputFormat: DocumentOutputFormat): Promise<Buffer>;
}

import { apiClient } from './apiClient';

export type DocumentOutputFormat = 'pdf' | 'docx';

export interface DocumentTemplateInfo {
  code: string;
  name: string;
  version: number;
  documentType: string;
  status: 'published';
}

export interface RenderDocumentInput {
  templateCode: string;
  templateVersion?: number;
  outputFormat: DocumentOutputFormat;
  data: Record<string, unknown>;
}

export const documentEngineService = {
  async listTemplates(): Promise<DocumentTemplateInfo[]> {
    const response = await apiClient.get<{ success: boolean; data: DocumentTemplateInfo[] }>('/documents/templates');
    return response.data;
  },

  render(input: RenderDocumentInput): Promise<Blob> {
    return apiClient.post<Blob>('/documents/render', input, { responseType: 'blob' });
  },

  async renderToObjectUrl(input: RenderDocumentInput): Promise<string> {
    const blob = await this.render(input);
    return URL.createObjectURL(blob);
  }
};

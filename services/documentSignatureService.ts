import { apiClient } from './apiClient';

export interface SignaturePlaceholder {
  id: number;
  templateId: number;
  templateVersionId: number;
  code: string;
  fieldName?: string;
  signerRole: string;
  signingOrder: number;
  pageIndex: number;
  x1Pt: number;
  y1Pt: number;
  x2Pt: number;
  y2Pt: number;
  pageWidthPt: number;
  pageHeightPt: number;
  pageRotation: number;
  required: boolean;
  appearanceProfileId?: string;
  status: string;
}

export const documentSignatureService = {
  health: () => apiClient.get<any>('/signatures/health').then(res => res.data),
  providerInfo: () => apiClient.get<any>('/signatures/provider-info').then(res => res.data),
  createSession: (documentId: string, documentVersion: number, documentSha256: string, sourceArtifactKey: string) => 
    apiClient.post<any>(`/signatures/documents/${encodeURIComponent(documentId)}/signing-sessions`, { documentVersion, documentSha256, sourceArtifactKey }).then(res => res.data),
  createRequest: (sessionId: string, payload: Record<string, unknown>) => 
    apiClient.post<any>(`/signatures/signing-sessions/${sessionId}/requests`, payload, { headers: { 'Idempotency-Key': crypto.randomUUID() } }).then(res => res.data),
  getSession: (sessionId: string) => apiClient.get<any>(`/signatures/signing-sessions/${sessionId}`).then(res => res.data),
  getAudit: (sessionId: string) => apiClient.get<any>(`/signatures/signing-sessions/${sessionId}/audit`).then(res => res.data),
  listPlaceholders: async (versionId: number): Promise<SignaturePlaceholder[]> => {
    const res = await apiClient.get<any>(`/signatures/template-versions/${versionId}/placeholders`);
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    return list.map((item: any) => ({
      id: Number(item.id),
      templateId: Number(item.templateId ?? item.template_id ?? 0),
      templateVersionId: Number(item.templateVersionId ?? item.template_version_id ?? versionId),
      code: String(item.code || ''),
      fieldName: item.fieldName ?? item.field_name ?? '',
      signerRole: String(item.signerRole ?? item.signer_role ?? 'BAC_SI_KHAM'),
      signingOrder: Number(item.signingOrder ?? item.signing_order ?? 1),
      pageIndex: Number(item.pageIndex ?? item.page_index ?? 0),
      x1Pt: Number(item.x1Pt ?? item.x1_pt ?? 0),
      y1Pt: Number(item.y1Pt ?? item.y1_pt ?? 0),
      x2Pt: Number(item.x2Pt ?? item.x2_pt ?? 180),
      y2Pt: Number(item.y2Pt ?? item.y2_pt ?? 80),
      pageWidthPt: Number(item.pageWidthPt ?? item.page_width_pt ?? 595),
      pageHeightPt: Number(item.pageHeightPt ?? item.page_height_pt ?? 842),
      pageRotation: Number(item.pageRotation ?? item.page_rotation ?? 0),
      required: item.required !== false,
      appearanceProfileId: item.appearanceProfileId ?? item.appearance_profile_id,
      status: String(item.status || 'ACTIVE')
    }));
  },
  createPlaceholder: (versionId: number, payload: Record<string, unknown>) => apiClient.post<any>(`/signatures/template-versions/${versionId}/placeholders`, payload).then(res => res.data),
  updatePlaceholder: (placeholderId: number, payload: Record<string, unknown>) => apiClient.put<any>(`/signatures/placeholders/${placeholderId}`, payload).then(res => res.data),
  retirePlaceholder: (placeholderId: number) => apiClient.delete<any>(`/signatures/placeholders/${placeholderId}`).then(res => res.data),
  prepare: (requestId: string) => apiClient.post<any>(`/signatures/signature-requests/${requestId}/prepare`, {}).then(res => res.data),
  preparePdf: (requestId: string, certificateBase64: string, certificateChainBase64: string[]) => 
    apiClient.post<any>(`/signatures/signature-requests/${requestId}/prepare-pdf`, { certificateBase64, certificateChainBase64 }).then(res => res.data),
  authorizeAgentSignature: (requestId: string, payload: Record<string, unknown>) => 
    apiClient.post<any>(`/signatures/signature-requests/${requestId}/agent-signature`, payload).then(res => res.data),
  finalizePdf: (requestId: string) => apiClient.post<any>(`/signatures/signature-requests/${requestId}/finalize-pdf`, {}).then(res => res.data),
  complete: (requestId: string) => apiClient.post<any>(`/signatures/signature-requests/${requestId}/complete`, {}).then(res => res.data),
  cancel: (requestId: string) => apiClient.post<any>(`/signatures/signature-requests/${requestId}/cancel`, {}).then(res => res.data),
  cancelSession: (sessionId: string) => apiClient.post<any>(`/signatures/signing-sessions/${sessionId}/cancel`, {}).then(res => res.data)
};

export default documentSignatureService;

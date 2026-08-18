export type SignaturePlacementType = 'FREESTYLE' | 'PLACEHOLDER';
export type SigningSessionStatus = 'OPEN' | 'PROCESSING' | 'PARTIALLY_SIGNED' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
export type SignatureRequestStatus = 'PENDING' | 'PREPARED' | 'AUTHORIZED' | 'SIGNED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface PdfSignatureRect {
    pageIndex: number; x1Pt: number; y1Pt: number; x2Pt: number; y2Pt: number;
    pageWidthPt: number; pageHeightPt: number; pageRotation: 0 | 90 | 180 | 270;
}

export interface CreateSigningSessionInput { documentId: string; documentVersion: number; documentSha256: string; sourceArtifactKey: string; expiresAt: Date; createdBy: string; }
export interface CreateSignatureRequestInput extends PdfSignatureRect { sessionId: string; placeholderId?: number; placementType: SignaturePlacementType; signerUserId: string; signerRole: string; signingOrder?: number; reason?: string; location?: string; appearanceProfileId?: string; idempotencyKey: string; }

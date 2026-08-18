import crypto from 'node:crypto';
import path from 'node:path';
import { LocalTemplateArtifactStorage, S3TemplateArtifactStorage, TemplateArtifactStorage } from '../template-studio/local-template-storage';
import { SignatureRepository } from './signature.repository';
import { SignatureService } from './signature.service';
import { pdfSigningClient, PdfSigningClient } from './signing-client';

export interface PdfPackagingInput {
    sourcePdf: Buffer;
    request: Record<string, any>;
    detachedSignature: Record<string, any>;
}

export interface PdfSignaturePackager {
    package(input: PdfPackagingInput): Promise<{ pdf: Buffer; profile: string }>;
}

export class UnavailablePdfSignaturePackager implements PdfSignaturePackager {
    async package(): Promise<never> {
        throw Object.assign(new Error('External-signature PAdES packager is not configured'), { status: 503, code: 'PADES_PACKAGER_NOT_CONFIGURED' });
    }
}

export class HttpExternalPadesPackager implements PdfSignaturePackager {
    constructor(private readonly client: PdfSigningClient = pdfSigningClient) {}
    async package(input: PdfPackagingInput) {
        const result = await this.client.externalComplete({ transaction_id: input.detachedSignature.transaction_id, raw_signature_base64: input.detachedSignature.signature_base64 });
        const pdf = Buffer.from(result.pdf_base64, 'base64');
        if (crypto.createHash('sha256').update(pdf).digest('hex') !== result.pdf_sha256) throw Object.assign(new Error('PAdES provider checksum mismatch'), { status: 502, code: 'PADES_PROVIDER_CHECKSUM_MISMATCH' });
        return { pdf, profile: result.profile };
    }
}

const defaultStorage = (): TemplateArtifactStorage => process.env.DOCUMENT_ARTIFACT_STORAGE === 's3'
    ? new S3TemplateArtifactStorage(String(process.env.DOCUMENT_ARTIFACT_S3_BUCKET || process.env.S3_BUCKET || 'vimes-documents'))
    : new LocalTemplateArtifactStorage(path.resolve(process.env.DOCUMENT_ARTIFACT_STORAGE_DIR || path.join(process.cwd(), 'storage', 'documents')));

export class SignaturePackagingService {
    constructor(
        readonly repository = new SignatureRepository(),
        readonly signatures = new SignatureService(),
        readonly storage: TemplateArtifactStorage = defaultStorage(),
        readonly pdfPackager: PdfSignaturePackager = new HttpExternalPadesPackager(),
        readonly pdfClient: PdfSigningClient = pdfSigningClient,
    ) {}

    async preparePdf(requestId: string, actor: string, certificateBase64: string, certificateChainBase64: string[] = []) {
        const request = await this.repository.getRequest(requestId);
        if (request.signer_user_id !== actor) throw Object.assign(new Error('Only the assigned signer can prepare this PDF'), { status: 403, code: 'SIGNER_MISMATCH' });
        if (request.status !== 'PENDING') throw Object.assign(new Error('Signature request is not pending'), { status: 409, code: 'SIGNATURE_REQUEST_STATE_CHANGED' });
        const sourcePdf = await this.storage.get(request.source_artifact_key);
        if (!sourcePdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw Object.assign(new Error('Source artifact is not a PDF'), { status: 422, code: 'SOURCE_PDF_INVALID' });
        const sourceHash = crypto.createHash('sha256').update(sourcePdf).digest('hex');
        if (sourceHash.toLowerCase() !== String(request.document_sha256).toLowerCase()) throw Object.assign(new Error('Source artifact hash mismatch'), { status: 409, code: 'SOURCE_ARTIFACT_HASH_MISMATCH' });
        const prepared = await this.pdfClient.externalPrepare({
            pdf_base64: sourcePdf.toString('base64'), certificate_base64: certificateBase64,
            certificate_chain_base64: certificateChainBase64, field_name: request.field_name || `Signature_${requestId}`,
            page_index: Number(request.page_index), x1_pt: Number(request.x1_pt), y1_pt: Number(request.y1_pt),
            x2_pt: Number(request.x2_pt), y2_pt: Number(request.y2_pt), reason: request.reason || undefined,
            profile: process.env.DOCUMENT_PADES_PROFILE || 'PAdES-B-B',
        });
        const digestHex = Buffer.from(prepared.hash_base64, 'base64').toString('hex');
        if (!/^[a-f0-9]{64}$/.test(digestHex)) throw Object.assign(new Error('PAdES provider returned invalid digest'), { status: 502, code: 'PADES_PREPARE_INVALID_DIGEST' });
        await this.repository.prepareExternalSignature(requestId, prepared.transaction_id, digestHex);
        return { requestId, transactionId: prepared.transaction_id, hashBase64: prepared.hash_base64, hashAlgorithm: prepared.hash_algorithm, documentLabel: `PDF ${request.document_id}`, expiresAt: new Date(Date.now() + Math.min(prepared.expires_in, 300) * 1000).toISOString(), profile: prepared.profile, status: 'PREPARED' };
    }

    async finalizePdf(requestId: string, actor: string) {
        const request = await this.repository.getRequest(requestId);
        if (request.signer_user_id !== actor) throw Object.assign(new Error('Only the assigned signer can finalize this signature'), { status: 403, code: 'SIGNER_MISMATCH' });
        if (request.status !== 'AUTHORIZED') throw Object.assign(new Error('A verified Agent signature is required'), { status: 409, code: 'SIGNATURE_NOT_AUTHORIZED' });
        if (!/^documents\/[A-Za-z0-9._/-]+\.pdf$/i.test(request.source_artifact_key || '')) throw Object.assign(new Error('Source PDF artifact key is invalid'), { status: 422, code: 'SOURCE_ARTIFACT_INVALID' });
        const sourcePdf = await this.storage.get(request.source_artifact_key);
        if (!sourcePdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw Object.assign(new Error('Source artifact is not a PDF'), { status: 422, code: 'SOURCE_PDF_INVALID' });
        const sourceHash = crypto.createHash('sha256').update(sourcePdf).digest('hex');
        if (sourceHash.toLowerCase() !== String(request.document_sha256).toLowerCase()) throw Object.assign(new Error('Source artifact changed after transaction preparation'), { status: 409, code: 'SOURCE_ARTIFACT_HASH_MISMATCH' });
        const detachedSignature = await this.repository.getVerifiedAgentSignature(requestId);
        if (detachedSignature.transaction_id !== request.provider_transaction_id || detachedSignature.document_sha256.toLowerCase() !== sourceHash.toLowerCase()) throw Object.assign(new Error('Verified signature does not match source artifact'), { status: 409, code: 'VERIFIED_SIGNATURE_MISMATCH' });
        const packaged = await this.pdfPackager.package({ sourcePdf, request, detachedSignature });
        if (!packaged.pdf.subarray(0, 5).equals(Buffer.from('%PDF-')) || packaged.pdf.length <= sourcePdf.length) throw Object.assign(new Error('PAdES packager returned an invalid PDF'), { status: 502, code: 'PADES_OUTPUT_INVALID' });
        if (!/^PAdES-B-(B|T|LT|LTA)$/i.test(packaged.profile)) throw Object.assign(new Error('PAdES profile is invalid'), { status: 502, code: 'PADES_PROFILE_INVALID' });
        const resultHash = crypto.createHash('sha256').update(packaged.pdf).digest('hex');
        const resultKey = `documents/signed/${requestId}-${resultHash.slice(0, 16)}.pdf`;
        await this.storage.put(resultKey, packaged.pdf);
        const persisted = await this.storage.get(resultKey);
        if (crypto.createHash('sha256').update(persisted).digest('hex') !== resultHash) throw Object.assign(new Error('Stored signed artifact checksum mismatch'), { status: 500, code: 'SIGNED_ARTIFACT_STORAGE_MISMATCH' });
        return this.signatures.complete(requestId, request.provider_transaction_id, resultKey, resultHash, actor);
    }
}

export const signaturePackagingService = new SignaturePackagingService();

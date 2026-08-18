import crypto from 'node:crypto';
import { SignatureRepository } from './signature.repository';
import { CreateSignatureRequestInput } from './signature.types';
import { AgentSignatureSubmission, verifyAgentSignature } from './agent-signature-verifier';

export class SignatureService {
    readonly repository = new SignatureRepository();
    async createSession(input: Parameters<SignatureRepository['createSession']>[0]) {
        if (!/^[a-f0-9]{64}$/i.test(input.documentSha256)) throw Object.assign(new Error('documentSha256 must be SHA-256'), { status: 422, code: 'INVALID_DOCUMENT_HASH' });
        if (input.documentVersion < 1) throw Object.assign(new Error('documentVersion must be positive'), { status: 422, code: 'INVALID_DOCUMENT_VERSION' });
        return this.repository.createSession(input);
    }
    async createRequest(input: CreateSignatureRequestInput) {
        if (input.placementType === 'PLACEHOLDER' && !input.placeholderId) throw Object.assign(new Error('placeholderId is required'), { status: 422, code: 'PLACEHOLDER_REQUIRED' });
        if (input.placementType === 'FREESTYLE' && input.placeholderId) throw Object.assign(new Error('placeholderId is not allowed for freestyle'), { status: 422, code: 'PLACEHOLDER_NOT_ALLOWED' });
        if (![input.x1Pt, input.y1Pt, input.x2Pt, input.y2Pt].every(Number.isFinite) || input.x2Pt <= input.x1Pt || input.y2Pt <= input.y1Pt) throw Object.assign(new Error('Invalid signature rectangle'), { status: 422, code: 'INVALID_SIGNATURE_RECT' });
        if (input.x2Pt > input.pageWidthPt || input.y2Pt > input.pageHeightPt) throw Object.assign(new Error('Signature rectangle outside page'), { status: 422, code: 'INVALID_SIGNATURE_RECT' });
        return this.repository.createRequest(input);
    }
    async prepare(requestId: string, actor: string) {
        const request = await this.repository.getRequest(requestId);
        if (request.signer_user_id !== actor) throw Object.assign(new Error('Only the assigned signer can prepare this request'), { status: 403, code: 'SIGNER_MISMATCH' });
        const sessionExpiry = new Date(request.session_expires_at);
        if (sessionExpiry.getTime() <= Date.now()) throw Object.assign(new Error('Signing session expired'), { status: 409, code: 'SIGNING_SESSION_EXPIRED' });
        const transactionId = crypto.randomUUID();
        await this.repository.updateRequestStatus(requestId, ['PENDING'], 'PREPARED', transactionId);
        const expiresAt = new Date(Math.min(sessionExpiry.getTime(), Date.now() + 15 * 60_000));
        return { requestId, actor, transactionId, hashBase64: Buffer.from(request.document_sha256, 'hex').toString('base64'), hashAlgorithm: 'SHA256', documentLabel: `Document ${request.document_id}`, expiresAt: expiresAt.toISOString(), status: 'PREPARED' };
    }
    async authorizeAgentSignature(requestId: string, submission: AgentSignatureSubmission, actor: string) {
        const request = await this.repository.getRequest(requestId);
        try {
            if (request.signer_user_id !== actor) throw Object.assign(new Error('Only the assigned signer can submit this signature'), { status: 403, code: 'SIGNER_MISMATCH' });
            if (request.status !== 'PREPARED' && request.status !== 'AUTHORIZED') throw Object.assign(new Error('Signature request is not prepared'), { status: 409, code: 'SIGNATURE_REQUEST_STATE_CHANGED' });
            if (request.provider_transaction_id !== submission.transactionId) throw Object.assign(new Error('Transaction mismatch'), { status: 409, code: 'SIGNING_TRANSACTION_MISMATCH' });
            if (new Date(request.session_expires_at).getTime() <= Date.now()) throw Object.assign(new Error('Signing session expired'), { status: 409, code: 'SIGNING_SESSION_EXPIRED' });
            const digestToVerify = request.signing_digest_sha256 || request.document_sha256;
            const verified = verifyAgentSignature(digestToVerify, submission);
            const stored = await this.repository.saveVerifiedAgentSignature(requestId, submission, verified, request.document_sha256);
            await this.repository.audit({ documentId: request.document_id, sessionId: request.session_id, requestId, actorId: actor, action: 'AGENT_SIGNATURE_VERIFIED', result: 'SUCCESS', shaBefore: request.document_sha256, detail: { transactionId: submission.transactionId, certificateThumbprint: verified.certificateThumbprint, signatureAlgorithm: submission.signatureAlgorithm } });
            return { requestId, transactionId: submission.transactionId, status: 'AUTHORIZED', certificate: verified, verifiedAt: stored.verified_at };
        } catch (error: any) {
            await this.repository.audit({ documentId: request.document_id, sessionId: request.session_id, requestId, actorId: actor, action: 'AGENT_SIGNATURE_VERIFIED', result: 'FAILED', shaBefore: request.document_sha256, detail: { transactionId: submission.transactionId, code: error.code || 'SIGNATURE_VERIFY_FAILED' } });
            throw error;
        }
    }
    async complete(requestId: string, providerTransactionId: string, resultArtifactKey: string, resultArtifactSha256: string, actor = 'system') { const request = await this.repository.getRequest(requestId); try { if (request.signer_user_id !== actor) throw Object.assign(new Error('Only the assigned signer can complete this request'), { status: 403, code: 'SIGNER_MISMATCH' }); if (request.status !== 'AUTHORIZED') throw Object.assign(new Error('Verified signature authorization is required'), { status: 409, code: 'SIGNATURE_NOT_AUTHORIZED' }); if (!providerTransactionId || providerTransactionId !== request.provider_transaction_id) throw Object.assign(new Error('Provider transaction mismatch'), { status: 409, code: 'SIGNING_TRANSACTION_MISMATCH' }); if (!resultArtifactKey || !/^documents\/[A-Za-z0-9._/-]+\.pdf$/i.test(resultArtifactKey)) throw Object.assign(new Error('Signed artifact key is invalid'), { status: 422, code: 'SIGNED_ARTIFACT_REQUIRED' }); if (!/^[a-f0-9]{64}$/i.test(resultArtifactSha256 || '')) throw Object.assign(new Error('Signed artifact SHA-256 is invalid'), { status: 422, code: 'INVALID_SIGNED_ARTIFACT_HASH' }); const updated = await this.repository.updateRequestStatus(requestId, ['AUTHORIZED'], 'SIGNED', providerTransactionId, resultArtifactKey, resultArtifactSha256); await this.repository.audit({ documentId: request.document_id, sessionId: request.session_id, requestId, actorId: actor, action: 'SIGNATURE_COMPLETED', result: 'SUCCESS', shaBefore: request.document_sha256, shaAfter: resultArtifactSha256, detail: { artifactKey: resultArtifactKey } }); return updated; } catch (error: any) { await this.repository.audit({ documentId: request.document_id, sessionId: request.session_id, requestId, actorId: actor, action: 'SIGNATURE_COMPLETED', result: 'FAILED', shaBefore: request.document_sha256, detail: { code: error.code || 'SIGNATURE_COMPLETE_FAILED' } }); throw error; } }
    async cancel(requestId: string, actor = 'system') { const request = await this.repository.getRequest(requestId); const updated = await this.repository.updateRequestStatus(requestId, ['PENDING', 'PREPARED', 'AUTHORIZED'], 'CANCELLED'); await this.repository.audit({ documentId: request.document_id, sessionId: request.session_id, requestId, actorId: actor, action: 'SIGNATURE_CANCELLED', result: 'SUCCESS', shaBefore: request.document_sha256, detail: { previousStatus: request.status } }); return updated; }
    async cancelSession(sessionId: string, actor = 'system') { const session = await this.repository.getSession(sessionId); if (['COMPLETED', 'CANCELLED'].includes(session.status)) throw Object.assign(new Error('Signing session cannot be cancelled'), { status: 409, code: 'SIGNING_SESSION_NOT_CANCELLABLE' }); const requests = await this.repository.cancelOpenRequests(sessionId); for (const request of requests) await this.repository.audit({ documentId: session.document_id, sessionId, requestId: request.id, actorId: actor, action: 'SIGNATURE_CANCELLED', result: 'SUCCESS', shaBefore: session.document_sha256, detail: { scope: 'SESSION' } }); return this.repository.setSessionStatus(sessionId, ['OPEN', 'PROCESSING', 'PARTIALLY_SIGNED', 'FAILED', 'EXPIRED'], 'CANCELLED'); }
}

export const signatureService = new SignatureService();

import { PoolClient } from 'pg';
import { query, transaction } from '../config/database';
import { CreateSignatureRequestInput, CreateSigningSessionInput, SignatureRequestStatus, SigningSessionStatus } from './signature.types';
import { AgentSignatureSubmission } from './agent-signature-verifier';

export class SignatureRepository {
    async createSession(input: CreateSigningSessionInput) {
        const result = await query(`INSERT INTO hms_document_signing_session (document_id, document_version, document_sha256, source_artifact_key, expires_at, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [input.documentId, input.documentVersion, input.documentSha256, input.sourceArtifactKey, input.expiresAt, input.createdBy]);
        return result.rows[0];
    }

    async getSession(id: string) {
        const result = await query('SELECT * FROM hms_document_signing_session WHERE id=$1', [id]);
        if (!result.rows[0]) throw Object.assign(new Error('Signing session not found'), { status: 404, code: 'SIGNING_SESSION_NOT_FOUND' });
        return result.rows[0];
    }

    async createRequest(input: CreateSignatureRequestInput) {
        return transaction(async (client: PoolClient) => {
            const session = await client.query('SELECT * FROM hms_document_signing_session WHERE id=$1 FOR UPDATE', [input.sessionId]);
            if (!session.rows[0]) throw Object.assign(new Error('Signing session not found'), { status: 404, code: 'SIGNING_SESSION_NOT_FOUND' });
            if (session.rows[0].status !== 'OPEN' && session.rows[0].status !== 'PARTIALLY_SIGNED') throw Object.assign(new Error('Signing session is not writable'), { status: 409, code: 'SIGNING_SESSION_NOT_WRITABLE' });
            if (new Date(session.rows[0].expires_at).getTime() <= Date.now()) throw Object.assign(new Error('Signing session expired'), { status: 409, code: 'SIGNING_SESSION_EXPIRED' });
            const result = await client.query(`INSERT INTO hms_document_signature_request (session_id, placeholder_id, placement_type, page_index, x1_pt, y1_pt, x2_pt, y2_pt, signer_user_id, signer_role, signing_order, reason, location, appearance_profile_id, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (session_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`, [input.sessionId, input.placeholderId || null, input.placementType, input.pageIndex, input.x1Pt, input.y1Pt, input.x2Pt, input.y2Pt, input.signerUserId, input.signerRole, input.signingOrder || 1, input.reason || null, input.location || null, input.appearanceProfileId || null, input.idempotencyKey]);
            return result.rows[0];
        });
    }

    async updateRequestStatus(id: string, expected: SignatureRequestStatus[], next: SignatureRequestStatus, providerTransactionId?: string, resultArtifactKey?: string, resultArtifactSha256?: string) {
        const result = await query(`UPDATE hms_document_signature_request SET status=$3::varchar, provider_transaction_id=COALESCE($4, provider_transaction_id), result_artifact_key=COALESCE($5, result_artifact_key), result_artifact_sha256=COALESCE($6, result_artifact_sha256), signed_at=CASE WHEN $3::varchar='SIGNED' THEN NOW() ELSE signed_at END WHERE id=$1 AND status = ANY($2::varchar[]) RETURNING *`, [id, expected, next, providerTransactionId || null, resultArtifactKey || null, resultArtifactSha256 || null]);
        if (!result.rows[0]) throw Object.assign(new Error('Signature request state changed'), { status: 409, code: 'SIGNATURE_REQUEST_STATE_CHANGED' });
        return result.rows[0];
    }

    async listRequests(sessionId: string) { const result = await query('SELECT * FROM hms_document_signature_request WHERE session_id=$1 ORDER BY signing_order, created_at, id', [sessionId]); return result.rows; }
    async getRequest(id: string) { const result = await query('SELECT r.*, s.document_id, s.document_version, s.document_sha256, s.source_artifact_key, s.expires_at AS session_expires_at FROM hms_document_signature_request r JOIN hms_document_signing_session s ON s.id=r.session_id WHERE r.id=$1', [id]); if (!result.rows[0]) throw Object.assign(new Error('Signature request not found'), { status: 404, code: 'SIGNATURE_REQUEST_NOT_FOUND' }); return result.rows[0]; }
    async saveVerifiedAgentSignature(requestId: string, submission: AgentSignatureSubmission, verified: { certificateSubject: string; certificateIssuer: string; certificateSerial: string; certificateThumbprint: string; signedAt: string; hashAlgorithm: string }, documentSha256: string) {
        return transaction(async (client: PoolClient) => {
            const request = await client.query('SELECT * FROM hms_document_signature_request WHERE id=$1 FOR UPDATE', [requestId]);
            if (!request.rows[0]) throw Object.assign(new Error('Signature request not found'), { status: 404, code: 'SIGNATURE_REQUEST_NOT_FOUND' });
            if (request.rows[0].provider_transaction_id !== submission.transactionId) throw Object.assign(new Error('Transaction mismatch'), { status: 409, code: 'SIGNING_TRANSACTION_MISMATCH' });
            const existing = await client.query('SELECT * FROM hms_document_agent_signature WHERE signature_request_id=$1', [requestId]);
            if (existing.rows[0]) {
                if (existing.rows[0].signature_base64 !== submission.signatureBase64 || existing.rows[0].certificate_thumbprint !== verified.certificateThumbprint) throw Object.assign(new Error('Signature result conflicts with existing transaction'), { status: 409, code: 'SIGNATURE_RESULT_CONFLICT' });
                return existing.rows[0];
            }
            if (request.rows[0].status !== 'PREPARED') throw Object.assign(new Error('Signature request is not prepared'), { status: 409, code: 'SIGNATURE_REQUEST_STATE_CHANGED' });
            const inserted = await client.query(`INSERT INTO hms_document_agent_signature (signature_request_id,transaction_id,document_sha256,signed_digest_sha256,hash_algorithm,signature_algorithm,signature_base64,certificate_base64,certificate_chain_base64,certificate_thumbprint,certificate_subject,certificate_issuer,certificate_serial,signed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14) RETURNING *`, [requestId, submission.transactionId, documentSha256, request.rows[0].signing_digest_sha256 || documentSha256, verified.hashAlgorithm, submission.signatureAlgorithm, submission.signatureBase64, submission.certificateBase64, JSON.stringify(submission.certificateChainBase64 || [submission.certificateBase64]), verified.certificateThumbprint, verified.certificateSubject, verified.certificateIssuer, verified.certificateSerial, verified.signedAt]);
            await client.query(`UPDATE hms_document_signature_request SET status='AUTHORIZED', certificate_subject=$2, certificate_issuer=$3, certificate_serial=$4 WHERE id=$1`, [requestId, verified.certificateSubject, verified.certificateIssuer, verified.certificateSerial]);
            return inserted.rows[0];
        });
    }
    async getVerifiedAgentSignature(requestId: string) { const result = await query('SELECT * FROM hms_document_agent_signature WHERE signature_request_id=$1', [requestId]); if (!result.rows[0]) throw Object.assign(new Error('Verified Agent signature not found'), { status: 409, code: 'VERIFIED_AGENT_SIGNATURE_REQUIRED' }); return result.rows[0]; }
    async prepareExternalSignature(requestId: string, transactionId: string, signingDigestSha256: string) { const result = await query(`UPDATE hms_document_signature_request SET status='PREPARED', provider_transaction_id=$2, signing_digest_sha256=$3 WHERE id=$1 AND status='PENDING' RETURNING *`, [requestId, transactionId, signingDigestSha256]); if (!result.rows[0]) throw Object.assign(new Error('Signature request state changed'), { status: 409, code: 'SIGNATURE_REQUEST_STATE_CHANGED' }); return result.rows[0]; }
    async audit(input: { documentId: string; sessionId: string; requestId: string; actorId: string; action: string; result: string; shaBefore?: string; shaAfter?: string; detail?: Record<string, unknown> }) { await query(`INSERT INTO hms_document_signature_audit (document_id, session_id, signature_request_id, actor_id, action, result, document_sha256_before, document_sha256_after, detail) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`, [input.documentId, input.sessionId, input.requestId, input.actorId, input.action, input.result, input.shaBefore || null, input.shaAfter || null, JSON.stringify(input.detail || {})]); }
    async listAudit(sessionId: string) { const result = await query('SELECT * FROM hms_document_signature_audit WHERE session_id=$1 ORDER BY created_at ASC, id ASC', [sessionId]); return result.rows; }
    async setSessionStatus(id: string, expected: SigningSessionStatus[], next: SigningSessionStatus) { const result = await query(`UPDATE hms_document_signing_session SET status=$3::varchar, row_version=row_version+1, completed_at=CASE WHEN $3::varchar='COMPLETED' THEN NOW() ELSE completed_at END WHERE id=$1 AND status = ANY($2::varchar[]) RETURNING *`, [id, expected, next]); if (!result.rows[0]) throw Object.assign(new Error('Signing session state changed'), { status: 409, code: 'SIGNING_SESSION_STATE_CHANGED' }); return result.rows[0]; }
    async cancelOpenRequests(sessionId: string) { const result = await query(`UPDATE hms_document_signature_request SET status='CANCELLED' WHERE session_id=$1 AND status IN ('PENDING','PREPARED','AUTHORIZED') RETURNING *`, [sessionId]); return result.rows; }
}

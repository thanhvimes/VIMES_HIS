import crypto from 'node:crypto';
import { query, transaction } from '../config/database';
import { pdfSigningClient, PdfSigningClient } from '../document-signature/signing-client';
import { HealthCheckTwoTierSignerService } from './health-check-two-tier-signer.service';

const sha256 = (value: Buffer | string) => crypto.createHash('sha256').update(value).digest('hex');
const twoTierSigner = new HealthCheckTwoTierSignerService();

export class HealthCheckXmlDsigService {
    constructor(private readonly signer: PdfSigningClient = pdfSigningClient) {}

    async prepare(documentId: number, actorId: string, certificateBase64: string, certificateChainBase64: string[] = []) {
        if (!Number.isInteger(documentId)) throw Object.assign(new Error('Document ID is invalid'), { status: 400, code: 'INVALID_DOCUMENT_ID' });
        if (!certificateBase64) throw Object.assign(new Error('Signing certificate is required'), { status: 422, code: 'CERTIFICATE_REQUIRED' });
        const result = await query('SELECT id, doc_no, patient_name, xml_data, signature_status, send_status FROM health_check_masters WHERE id=$1', [documentId]);
        const doc = result.rows[0];
        if (!doc) throw Object.assign(new Error('Health-check document not found'), { status: 404, code: 'DOCUMENT_NOT_FOUND' });
        if (doc.signature_status === 'Signed' || doc.send_status === 'Success') throw Object.assign(new Error('Document is already signed or sent'), { status: 409, code: 'DOCUMENT_LOCKED' });
        if (!doc.xml_data) throw Object.assign(new Error('Unsigned XML is unavailable'), { status: 422, code: 'XML_REQUIRED' });
        const source = Buffer.from(doc.xml_data, 'utf8');

        let prepared: { transaction_id: string; hash_base64: string; hash_algorithm: 'SHA256'; profile: string; expires_in: number };
        try {
            prepared = await this.signer.xmlDsigPrepare({ xml_base64: source.toString('base64'), certificate_base64: certificateBase64, certificate_chain_base64: certificateChainBase64 });
        } catch (signerErr: any) {
            console.warn(`[HealthCheckXmlDsigService] Dịch vụ external signer không khả dụng (${signerErr.message}), tự động fallback sang chuẩn Ký số 2 cấp Bộ Y tế.`);
            const step2 = twoTierSigner.getStep2Hash(doc.xml_data);
            const txId = crypto.randomBytes(16).toString('hex');
            prepared = {
                transaction_id: txId,
                hash_base64: step2.hashBase64,
                hash_algorithm: 'SHA256',
                profile: 'BYT_TWO_TIER',
                expires_in: 300
            };
        }

        await query(`INSERT INTO hms_health_check_xmldsig_transaction(transaction_id,document_id,actor_id,source_sha256,expires_at) VALUES($1,$2,$3,$4,$5)`, [prepared.transaction_id, documentId, actorId, sha256(source), new Date(Date.now() + Math.min(prepared.expires_in, 300) * 1000)]);
        return { transactionId: prepared.transaction_id, hashBase64: prepared.hash_base64, hashAlgorithm: prepared.hash_algorithm, documentLabel: `KSK ${doc.doc_no || documentId} - ${doc.patient_name || ''}`, expiresAt: new Date(Date.now() + Math.min(prepared.expires_in, 300) * 1000).toISOString(), profile: prepared.profile };
    }

    async complete(documentId: number, actorId: string, transactionId: string, rawSignatureBase64: string) {
        if (!transactionId || !rawSignatureBase64) throw Object.assign(new Error('Transaction and raw signature are required'), { status: 422, code: 'SIGNATURE_REQUIRED' });
        return transaction(async client => {
            const txResult = await client.query('SELECT * FROM hms_health_check_xmldsig_transaction WHERE transaction_id=$1 FOR UPDATE', [transactionId]);
            const state = txResult.rows[0];
            if (!state || Number(state.document_id) !== documentId || state.actor_id !== actorId) throw Object.assign(new Error('XML signing transaction mismatch'), { status: 409, code: 'XMLDSIG_TRANSACTION_MISMATCH' });
            if (state.status === 'COMPLETED') return state.result_signature;
            if (new Date(state.expires_at).getTime() <= Date.now()) throw Object.assign(new Error('XML signing transaction expired'), { status: 409, code: 'XMLDSIG_TRANSACTION_EXPIRED' });
            const docResult = await client.query('SELECT * FROM health_check_masters WHERE id=$1 FOR UPDATE', [documentId]);
            const doc = docResult.rows[0];
            if (!doc || doc.signature_status === 'Signed' || doc.send_status === 'Success') throw Object.assign(new Error('Document state changed during signing'), { status: 409, code: 'DOCUMENT_STATE_CHANGED' });
            if (sha256(Buffer.from(doc.xml_data || '', 'utf8')) !== state.source_sha256) throw Object.assign(new Error('XML changed after signing preparation'), { status: 409, code: 'XML_CHANGED_AFTER_PREPARE' });

            let completed: { xml_base64: string; xml_sha256: string; profile: string };
            try {
                const extCompleted = await this.signer.xmlDsigComplete({ transaction_id: transactionId, raw_signature_base64: rawSignatureBase64 });
                completed = {
                    xml_base64: extCompleted.xml_base64,
                    xml_sha256: extCompleted.xml_sha256,
                    profile: extCompleted.profile
                };
            } catch (extErr: any) {
                // Fallback sang áp dụng chữ ký theo chuẩn Bộ Y tế
                const signedXml = twoTierSigner.applyHospitalSignature(doc.xml_data, rawSignatureBase64);
                const signedBytes = Buffer.from(signedXml, 'utf8');
                completed = {
                    xml_base64: signedBytes.toString('base64'),
                    xml_sha256: sha256(signedBytes),
                    profile: 'BYT_TWO_TIER'
                };
            }

            const signedXmlContent = Buffer.from(completed.xml_base64, 'base64').toString('utf8');
            const wrapper = { signed_file: { file_name: `${doc.doc_no || 'document'}_signed.xml`, mime_type: 'application/xml', data_base64: completed.xml_base64 }, profile: completed.profile, transaction_id: transactionId };
            await client.query(`UPDATE health_check_masters SET xml_data=$1, signature=$2, signature_status='Signed', signature_type='USB', updated_at=NOW() WHERE id=$3`, [signedXmlContent, JSON.stringify(wrapper), documentId]);
            await client.query(`UPDATE hms_health_check_xmldsig_transaction SET status='COMPLETED',result_xml_sha256=$2,result_signature=$3::jsonb,completed_at=NOW() WHERE transaction_id=$1`, [transactionId, completed.xml_sha256, JSON.stringify(wrapper)]);
            return wrapper;
        });
    }
}

export const healthCheckXmlDsigService = new HealthCheckXmlDsigService();


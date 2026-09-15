import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { SignaturePackagingService, UnavailablePdfSignaturePackager } from '../src/document-signature/signature-packaging.service';

class MemoryStorage {
    values = new Map<string, Buffer>();
    async put(key: string, content: Buffer) { if (!this.values.has(key)) this.values.set(key, Buffer.from(content)); }
    async get(key: string) { const value = this.values.get(key); if (!value) throw new Error('NOT_FOUND'); return Buffer.from(value); }
    async exists(key: string) { return this.values.has(key); }
}

const source = Buffer.from('%PDF-1.7\nsource');
const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
const request = { id: 'r1', signer_user_id: 'doctor-1', status: 'AUTHORIZED', source_artifact_key: 'documents/source.pdf', document_sha256: sourceHash, provider_transaction_id: 'tx-1' };
const detached = { transaction_id: 'tx-1', document_sha256: sourceHash };

test('PDF finalization fails closed when external-signature packager is unavailable', async () => {
    const storage = new MemoryStorage(); storage.values.set('documents/source.pdf', source);
    const repository: any = { getRequest: async () => request, getVerifiedAgentSignature: async () => detached };
    const service = new SignaturePackagingService(repository, {} as any, storage, new UnavailablePdfSignaturePackager());
    await assert.rejects(() => service.finalizePdf('r1', 'doctor-1'), (error: any) => error.code === 'PADES_PACKAGER_NOT_CONFIGURED');
});

test('PDF finalization detects source artifact tampering before invoking packager', async () => {
    const storage = new MemoryStorage(); storage.values.set('documents/source.pdf', Buffer.from('%PDF-1.7\ntampered'));
    let calls = 0;
    const packager: any = { package: async () => { calls++; return { pdf: Buffer.alloc(0), profile: 'PAdES-B-T' }; } };
    const service = new SignaturePackagingService({ getRequest: async () => request } as any, {} as any, storage, packager);
    await assert.rejects(() => service.finalizePdf('r1', 'doctor-1'), (error: any) => error.code === 'SOURCE_ARTIFACT_HASH_MISMATCH');
    assert.equal(calls, 0);
});

test('PDF finalization persists and rechecks immutable output before SIGNED transition', async () => {
    const storage = new MemoryStorage(); storage.values.set('documents/source.pdf', source);
    const completed: any[] = [];
    const signatures: any = { complete: async (...args: any[]) => { completed.push(args); return { status: 'SIGNED', result_artifact_key: args[2], result_artifact_sha256: args[3] }; } };
    const packager: any = { package: async () => ({ pdf: Buffer.concat([source, Buffer.from('\n% PAdES signature')]), profile: 'PAdES-B-T' }) };
    const repository: any = { getRequest: async () => request, getVerifiedAgentSignature: async () => detached };
    const service = new SignaturePackagingService(repository, signatures, storage, packager);
    const result: any = await service.finalizePdf('r1', 'doctor-1');
    assert.equal(result.status, 'SIGNED');
    assert.match(result.result_artifact_key, /^documents\/signed\/r1-[a-f0-9]{16}\.pdf$/);
    assert.equal(completed[0][1], 'tx-1');
    assert.equal(crypto.createHash('sha256').update(await storage.get(result.result_artifact_key)).digest('hex'), result.result_artifact_sha256);
});

test('PDF prepare locks the pyHanko signed-attributes digest before Agent signing', async () => {
    const storage = new MemoryStorage(); storage.values.set('documents/source.pdf', source);
    let preparedInDatabase: any[] = [];
    let providerPayload: any;
    const pending = { ...request, status: 'PENDING', field_name: 'Doctor', page_index: 0, x1_pt: 10, y1_pt: 20, x2_pt: 100, y2_pt: 80, document_id: 'doc-1' };
    const repository: any = { getRequest: async () => pending, prepareExternalSignature: async (...args: any[]) => { preparedInDatabase = args; } };
    const pdfClient: any = { externalPrepare: async (payload: any) => { providerPayload = payload; return { transaction_id: 'pades-tx-1', hash_base64: Buffer.alloc(32, 7).toString('base64'), hash_algorithm: 'SHA256', profile: 'PAdES-B-B', expires_in: 300 }; } };
    const service = new SignaturePackagingService(repository, {} as any, storage, {} as any, pdfClient);
    const result = await service.preparePdf('r1', 'doctor-1', Buffer.from('cert').toString('base64'), []);
    assert.equal(result.transactionId, 'pades-tx-1');
    assert.equal(providerPayload.pdf_base64, source.toString('base64'));
    assert.deepEqual(preparedInDatabase, ['r1', 'pades-tx-1', Buffer.alloc(32, 7).toString('hex')]);
});

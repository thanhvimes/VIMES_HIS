import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { signPdfViaVimesSigningServer } from '../src/services/vimes-signing.service';

test('rejects invalid signature rectangle before network call', async () => {
  await assert.rejects(
    signPdfViaVimesSigningServer('JVBERi0=', { pageIndex: 0, x1Pt: 10, y1Pt: 10, x2Pt: 5, y2Pt: 20 }),
    /INVALID_SIGNATURE_RECTANGLE/,
  );
});

test('maps signing server 429 to stable HIS error', async () => {
  const original = axios.post;
  axios.post = (async () => { throw { response: { status: 429 } }; }) as typeof axios.post;
  try {
    await assert.rejects(
      signPdfViaVimesSigningServer('JVBERi0=', { pageIndex: 0, x1Pt: 1, y1Pt: 1, x2Pt: 10, y2Pt: 10 }),
      /SIGNING_CONCURRENCY_LIMIT/,
    );
  } finally { axios.post = original; }
});

test('sends standard payload and correlation headers to VIMES server', async () => {
  const original = axios.post;
  let captured: any;
  axios.post = (async (url: string, body: any, config: any) => {
    captured = { url, body, config };
    return { data: { pdf_base64: 'signed', profile: 'PAdES-B-T' } };
  }) as typeof axios.post;
  try {
    const result = await signPdfViaVimesSigningServer('input', {
      pageIndex: 1, x1Pt: 10, y1Pt: 20, x2Pt: 100, y2Pt: 120,
      fieldName: 'Doctor', requestId: 'REQ-1', idempotencyKey: 'IDEM-1',
    });
    assert.equal(result.pdfBase64, 'signed');
    assert.equal(captured.url, 'http://127.0.0.1:8082/v1/sign-pdf');
    assert.equal(captured.config.headers['X-Request-ID'], 'REQ-1');
    assert.equal(captured.config.headers['X-Idempotency-Key'], 'IDEM-1');
    assert.equal(captured.body.page_index, 1);
    assert.equal(captured.body.field_name, 'Doctor');
  } finally { axios.post = original; }
});

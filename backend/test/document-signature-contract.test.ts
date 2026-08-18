import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('placeholder and signature routes expose required operations', () => {
  const source = fs.readFileSync('src/routes/document-signature.routes.ts', 'utf8');
  for (const operation of ["template-versions/:versionId/placeholders", "placeholders/:placeholderId", "signing-sessions/:sessionId/audit", "signature-requests/:requestId/complete"]) assert.match(source, new RegExp(operation.replace(/[/:]/g, '\\$&')));
});
test('signature routes expose health and provider metadata proxies', () => { const source = fs.readFileSync('src/routes/document-signature.routes.ts', 'utf8'); assert.match(source, /router\.get\('\/health'/); assert.match(source, /router\.get\('\/provider-info'/); });
test('signature routes expose verified workstation agent submission', () => { const source = fs.readFileSync('src/routes/document-signature.routes.ts', 'utf8'); assert.match(source, /signature-requests\/:requestId\/agent-signature/); });
test('signature completion is routed through server-side PDF finalization', () => { const source = fs.readFileSync('src/routes/document-signature.routes.ts', 'utf8'); assert.match(source, /signature-requests\/:requestId\/finalize-pdf/); assert.match(source, /signaturePackagingService\.finalizePdf/); });

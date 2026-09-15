import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

test('shared idempotency migration uses hms_document prefix and safe metadata only', () => {
  const migrationPath = join(process.cwd(), 'migrations/053_hms_document_signature_idempotency.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  assert.match(sql, /hms_document_signature_idempotency/);
  assert.match(sql, /UNIQUE \(idempotency_key\)/);
  assert.match(sql, /request_fingerprint/);
  assert.match(sql, /expires_at/);
  assert.match(sql, /status, lease_expires_at/);
  assert.doesNotMatch(sql, /pdf_base64|cms_signature_base64|private_key|pin/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('placeholder route contains geometry validation before repository calls', () => { const source = fs.readFileSync('src/routes/document-signature.routes.ts', 'utf8'); assert.match(source, /INVALID_PLACEHOLDER_GEOMETRY/); assert.match(source, /x2 > width/); assert.match(source, /includes\(rotation\)/); });
test('placeholder repository protects overlap on update', () => { const source = fs.readFileSync('src/document-signature/placeholder.repository.ts', 'utf8'); assert.match(source, /PLACEHOLDER_OVERLAP/); assert.match(source, /id<>\$2/); });

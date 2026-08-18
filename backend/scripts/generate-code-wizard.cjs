const field = process.argv[2]; const kind = (process.argv[3] || 'qr').toLowerCase();
if (!field || !['qr','barcode'].includes(kind) || !/^[A-Za-z][A-Za-z0-9_]*$/.test(field)) { console.error('Usage: node generate-code-wizard.cjs <field> qr|barcode'); process.exit(2); }
console.log(JSON.stringify({ type: kind, field, carboneTag: `{d.${field}}`, imageOptions: { width: 180, height: 60, format: 'png' }, sampleData: { [field]: kind === 'qr' ? 'https://example.org/patient/123' : '1234567890' } }, null, 2));

const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');

const out = path.resolve(process.env.BENCHMARK_DATA_DIR || path.join(process.cwd(), 'benchmark-data'));
fs.mkdirSync(out, { recursive: true });

const row = (i) => ({ i, name: `Thuốc mẫu ${i}`, usage: 'Uống theo hướng dẫn', quantity: `${i} viên`, result: `${i}.5`, unit: 'mg/L' });

for (const [label, count] of [['1page', 10], ['3page', 40], ['10page', 150], ['100rows', 100], ['500rows', 500]]) {
  fs.writeFileSync(path.join(out, `${label}.json`), JSON.stringify({ hospital: { name: 'VIMES BENCHMARK' }, patient: { code: `TEST-${label}` }, items: Array.from({ length: count }, (_, i) => row(i + 1)) }, null, 2));
}

(async () => {
  const qrBase64 = await QRCode.toDataURL('https://vimes.vn/verify/DOC-SYNTHETIC-2026');
  await QRCode.toFile(path.join(out, 'qr-synthetic.png'), 'VIMES-QR-SYNTHETIC-2026');
  
  // Synthetic 1x1 transparent PNG base64 for digital signature/seal
  const syntheticSignatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(path.join(out, 'signature-synthetic.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));

  fs.writeFileSync(path.join(out, 'dataset-qr-barcode.json'), JSON.stringify({
    hospital: { name: 'BỆNH VIỆN ĐA KHOA VIMES' },
    patient: { code: 'BN-QR-2026', fullName: 'NGUYỄN VĂN TEST QR', barcode: '123456789012' },
    qrCode: qrBase64,
    items: Array.from({ length: 15 }, (_, i) => row(i + 1))
  }, null, 2));

  fs.writeFileSync(path.join(out, 'dataset-signature-image.json'), JSON.stringify({
    hospital: { name: 'BỆNH VIỆN ĐA KHOA VIMES' },
    patient: { code: 'BN-SIG-2026', fullName: 'TRẦN THỊ TEST SIGNATURE' },
    doctor: { name: 'BS. CKII NGUYỄN VĂN A', signature: syntheticSignatureBase64 },
    director: { name: 'PGS. TS LÊ VĂN B', seal: syntheticSignatureBase64 },
    items: Array.from({ length: 20 }, (_, i) => row(i + 1))
  }, null, 2));

  console.log(JSON.stringify({ output: out, datasets: 7, images: 2 }));
})().catch(console.error);


const fs = require('node:fs/promises');
const path = require('node:path');

const carboneUrl = (process.env.CARBONE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const outputFormat = process.env.CARBONE_SMOKE_FORMAT || 'docx';
const templateRoot = path.resolve(process.cwd(), 'templates', 'documents');
const outputRoot = path.resolve(process.env.CARBONE_SMOKE_OUTPUT || 'templates/carbone-live-test');

(async () => {
  await fs.mkdir(outputRoot, { recursive: true });
  const codes = (await fs.readdir(templateRoot, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort();
  let failed = 0;
  for (const code of codes) {
    const versionRoot = path.join(templateRoot, code, 'v1');
    const [template, rawData] = await Promise.all([
      fs.readFile(path.join(versionRoot, 'template.docx')),
      fs.readFile(path.join(versionRoot, 'sample-data.json'), 'utf8')
    ]);
    const response = await fetch(`${carboneUrl}/render/template?download=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'carbone-version': '5' },
      body: JSON.stringify({ template: template.toString('base64'), data: JSON.parse(rawData), convertTo: outputFormat })
    });
    if (!response.ok) {
      failed += 1;
      console.error(`${code}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
      continue;
    }
    const content = Buffer.from(await response.arrayBuffer());
    const output = path.join(outputRoot, `${code}.${outputFormat}`);
    await fs.writeFile(output, content);
    const signatureOk = outputFormat === 'docx' ? content[0] === 0x50 && content[1] === 0x4b : content.subarray(0, 4).toString() === '%PDF';
    console.log(`${code}: ${signatureOk ? 'OK' : 'INVALID'} ${content.length} bytes`);
    if (!signatureOk) failed += 1;
  }
  process.exitCode = failed ? 1 : 0;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

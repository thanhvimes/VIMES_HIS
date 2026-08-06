import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import http from 'node:http';
import { TemplateRegistry } from '../src/document-engine/template-registry';
import { CarboneRenderer } from '../src/document-engine/carbone-renderer';
import { RenderCapacity } from '../src/document-engine/render-capacity';

const registry = new TemplateRegistry(path.resolve(process.cwd(), 'templates', 'documents'));

test('resolves the latest published document template', async () => {
    const template = await registry.resolve('OUTPATIENT_EXAM');
    assert.equal(template.version, 1);
    assert.equal(template.file, 'template.docx');
});

test('registry exposes the five published framework templates', async () => {
    const templates = await registry.list();
    assert.deepEqual(templates.map(item => item.code).sort(), [
        'DISCHARGE_SUMMARY', 'LAB_RESULT', 'OUTPATIENT_EXAM', 'PRESCRIPTION', 'TREATMENT_SHEET'
    ]);
});

test('rejects unsafe template codes', async () => {
    await assert.rejects(() => registry.resolve('../secrets'), /Invalid template code/);
});

test('returns not found for unknown template', async () => {
    await assert.rejects(() => registry.resolve('UNKNOWN_TEMPLATE'), /not found/);
});

test('Carbone adapter sends a versioned template and JSON data', async () => {
    let received: any;
    const server = http.createServer((request, response) => {
        const chunks: Buffer[] = [];
        request.on('data', chunk => chunks.push(Buffer.from(chunk)));
        request.on('end', () => {
            received = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            response.writeHead(200, { 'Content-Type': 'application/pdf' });
            response.end(Buffer.from('%PDF-POC'));
        });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const address = server.address();
        assert.ok(address && typeof address !== 'string');
        const renderer = new CarboneRenderer(registry, {
            baseUrl: `http://127.0.0.1:${address.port}`,
            timeoutMs: 2_000,
            converter: 'L'
        });
        const template = await registry.resolve('OUTPATIENT_EXAM', 1);
        const result = await renderer.render(template, { patient: { code: 'BN01' } }, 'pdf');
        assert.equal(result.toString(), '%PDF-POC');
        assert.equal(received.convertTo, 'pdf');
        assert.equal(received.converter, 'L');
        assert.equal(received.data.patient.code, 'BN01');
        assert.ok(Buffer.from(received.template, 'base64').length > 1_000);
    } finally {
        await new Promise<void>(resolve => server.close(() => resolve()));
    }
});

test('render capacity enforces concurrency and rejects queue overflow', async () => {
    const capacity = new RenderCapacity(1, 1, 2_000);
    let releaseFirst!: () => void;
    const blocker = new Promise<void>(resolve => { releaseFirst = resolve; });
    let simultaneous = 0;
    let maximum = 0;
    const task = () => capacity.execute(async () => {
        simultaneous += 1;
        maximum = Math.max(maximum, simultaneous);
        await blocker;
        simultaneous -= 1;
        return true;
    });
    const first = task();
    const second = task();
    await assert.rejects(task(), /queue is full/);
    releaseFirst();
    await Promise.all([first, second]);
    assert.equal(maximum, 1);
    assert.equal(capacity.snapshot().rejected, 1);
});

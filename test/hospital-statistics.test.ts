import test from 'node:test';
import assert from 'node:assert/strict';
import { StatisticsService } from '../src/services/statistics.service';

test('Hospital Statistics Service - executes all 9 reports cleanly', async (t) => {
    const fromDate = '2026-06-01 00:00:00';
    const toDate = '2026-06-25 23:59:59';

    await t.test('1. getHospitalActivity returns structured summary', async () => {
        const data = await StatisticsService.getHospitalActivity(fromDate, toDate);
        assert.ok(data);
        assert.ok(data.examination);
        assert.ok(data.inpatient);
        assert.ok(Array.isArray(data.paraclinical));
        assert.ok(Array.isArray(data.surgery));
        assert.ok(Number(data.examination.tong_so) >= 0);
    });

    await t.test('2. getClinicsStatistics returns array of clinic items', async () => {
        const clinics = await StatisticsService.getClinicsStatistics(fromDate, toDate);
        assert.ok(Array.isArray(clinics));
        assert.ok(clinics.length > 0);
    });

    await t.test('3. getInpatientStatistics returns inpatient movement by dept', async () => {
        const inp = await StatisticsService.getInpatientStatistics(fromDate, toDate);
        assert.ok(Array.isArray(inp));
        assert.ok(inp.length > 0);
    });

    await t.test('4. getParaclinicalStatistics returns paraclinical groups', async () => {
        const cls = await StatisticsService.getParaclinicalStatistics(fromDate, toDate);
        assert.ok(Array.isArray(cls));
    });

    await t.test('5. getSurgeryStatistics returns surgical classification', async () => {
        const surgery = await StatisticsService.getSurgeryStatistics(fromDate, toDate);
        assert.ok(Array.isArray(surgery));
        assert.ok(surgery.length > 0);
    });

    await t.test('6. getDepartmentCostStatistics returns financial breakdown', async () => {
        const costs = await StatisticsService.getDepartmentCostStatistics(fromDate, toDate);
        assert.ok(Array.isArray(costs));
        assert.ok(costs.length > 0);
    });

    await t.test('7. getBedOccupancyStatistics returns bed rates', async () => {
        const beds = await StatisticsService.getBedOccupancyStatistics();
        assert.ok(Array.isArray(beds));
        assert.ok(beds.length > 0);
    });

    await t.test('8. getDashboardCharts returns day trend items', async () => {
        const charts = await StatisticsService.getDashboardCharts(fromDate, toDate);
        assert.ok(Array.isArray(charts));
        assert.ok(charts.length > 0);
    });

    await t.test('9. getTopDoctors returns doctor rankings', async () => {
        const docs = await StatisticsService.getTopDoctors(fromDate, toDate);
        assert.ok(Array.isArray(docs));
        assert.ok(docs.length > 0);
    });
});

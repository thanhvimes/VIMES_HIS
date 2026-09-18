import test from 'node:test';
import assert from 'node:assert/strict';
import { StatisticsService } from '../src/services/statistics.service';

test('BHYT & Financial Risk Monitor - Kiểm thử độ chính xác số liệu và hiệu năng', async (t) => {
    const fromDate = '2026-06-01 00:00:00';
    const toDate = '2026-06-25 23:59:59';

    await t.test('1. Kiểm tra cấu trúc dữ liệu và cân đối tài chính BHYT (Ground Truth)', async () => {
        const start = Date.now();
        const data = await StatisticsService.getBhytFinancialRiskStatistics(fromDate, toDate);
        const elapsed = Date.now() - start;

        console.log(`Query execution time: ${elapsed}ms`);
        assert.ok(elapsed < 15000, `Thời gian truy vấn phải dưới 15 giây (thực tế: ${elapsed}ms)`);

        assert.ok(data, 'Phải trả về dữ liệu giám sát tài chính BHYT');
        assert.ok(data.summary, 'Phải có mục summary');
        assert.ok(data.cost_breakdown, 'Phải có mục cost_breakdown');
        assert.ok(Array.isArray(data.deposit_deficits), 'Phải có danh sách bệnh nhân âm tạm ứng');

        const { summary, cost_breakdown } = data;

        // Kiểm tra số nguyên không có số thập phân lẻ
        assert.equal(summary.tong_chi_phi, Math.round(summary.tong_chi_phi), 'Tổng chi phí phải là số nguyên tròn');
        assert.equal(summary.bhyt_chi_tra, Math.round(summary.bhyt_chi_tra), 'BHYT chi trả phải là số nguyên tròn');
        assert.equal(summary.benh_nhan_cung_chi_tra, Math.round(summary.benh_nhan_cung_chi_tra), 'BN cùng chi trả phải là số nguyên tròn');

        // Cân đối tài chính: Tổng chi phí = BHYT chi trả + BN cùng chi trả (dung sai sai số làm tròn tối đa 2 đ)
        const diff = Math.abs(summary.tong_chi_phi - (summary.bhyt_chi_tra + summary.benh_nhan_cung_chi_tra));
        assert.ok(diff <= 2, `Tổng chi phí (${summary.tong_chi_phi}) phải bằng BHYT (${summary.bhyt_chi_tra}) + BN (${summary.benh_nhan_cung_chi_tra}), chênh lệch: ${diff}`);

        // Đảm bảo không bị lọc mất chi phí tự túc (BN cùng chi trả phải có giá trị thực tế đáng kể)
        assert.ok(summary.benh_nhan_cung_chi_tra > 0, 'BN cùng chi trả phải lớn hơn 0 (bao gồm cả dịch vụ tự trả)');
        assert.ok(summary.tong_chi_phi > summary.bhyt_chi_tra, 'Tổng chi phí phải lớn hơn số tiền BHYT chi trả');

        // Kiểm tra tỷ lệ cấu trúc chi phí BHYT
        const cs = cost_breakdown;
        assert.ok(Number(cs.tien_thuoc) >= 0);
        assert.ok(Number(cs.tien_vtyt) >= 0);
        assert.ok(Number(cs.tien_giuong) >= 0);
        assert.ok(Number(cs.tien_xet_nghiem) >= 0);
        assert.ok(Number(cs.tien_cdha_tdcn) >= 0);
        assert.ok(Number(cs.tien_pttt) >= 0);
        assert.ok(Number(cs.tien_kham) >= 0);
    });

    await t.test('2. Kiểm tra danh sách bệnh nhân âm tạm ứng nội trú (Loại trừ dữ liệu ảo quá khứ)', async () => {
        const data = await StatisticsService.getBhytFinancialRiskStatistics(fromDate, toDate);
        const deficits = data.deposit_deficits;

        console.log(`Số lượng bệnh nhân âm tạm ứng phát hiện: ${deficits.length}`);

        // Đảm bảo không có bệnh nhân ảo với số tiền âm hàng tỷ VNĐ từ các đợt điều trị cũ
        for (const item of deficits) {
            assert.ok(item.docno > 0, 'Mã hồ sơ phải hợp lệ');
            assert.ok(item.patient_name, 'Tên bệnh nhân phải có');
            assert.ok(item.dept_name, 'Khoa điều trị (dept_name) phải có');
            assert.ok(item.admit_date, 'Ngày nhập viện phải có');
            assert.ok(item.total_cost >= 0, `Chi phí đợt này không được âm: ${item.total_cost}`);
            assert.ok(item.deposit_amount >= 0, `Tạm ứng khả dụng không được âm: ${item.deposit_amount}`);
            assert.ok(item.deficit_amount > 0, `Số tiền âm phải lớn hơn 0: ${item.deficit_amount}`);

            // Cân đối âm tạm ứng: deficit_amount = total_cost - deposit_amount
            const expectedDeficit = Math.round(item.total_cost - item.deposit_amount);
            assert.equal(Math.round(item.deficit_amount), expectedDeficit, 'Số tiền âm phải bằng Chi phí chưa thanh toán - Tạm ứng khả dụng');

            // Mỗi bệnh nhân nội trú thông thường không thể âm tới > 500 triệu đồng trừ trường hợp hồi sức đặc biệt
            assert.ok(item.deficit_amount < 500000000, `Hồ sơ ${item.docno} có số tiền âm bất thường (${item.deficit_amount}), cần kiểm tra việc cộng dồn các đợt cũ`);
        }

        // Kiểm tra hai mã bệnh nhân từng bị lỗi cộng dồn lịch sử (251227715 và 251184147)
        const ghost1 = deficits.find(d => d.docno === 251227715);
        if (ghost1) {
            assert.ok(ghost1.deficit_amount < 50000000, `Bệnh nhân 251227715 không được cộng dồn lịch sử 1.8 tỷ`);
        }

        const ghost2 = deficits.find(d => d.docno === 251184147);
        if (ghost2) {
            assert.ok(ghost2.deficit_amount < 50000000, `Bệnh nhân 251184147 không được cộng dồn lịch sử 1.36 tỷ`);
        }
    });

    await t.test('3. Kiểm tra đồng bộ dữ liệu Executive Alert (Cảnh báo Giám đốc)', async () => {
        const alerts = await StatisticsService.getExecutiveAlerts();
        assert.ok(alerts);
        assert.ok(Array.isArray(alerts.alerts), 'Phải có mảng alerts');
        assert.ok(['RED', 'YELLOW', 'GREEN'].includes(alerts.overall_status), 'overall_status phải hợp lệ');

        console.log(`Executive Alerts - Overall status: ${alerts.overall_status}, Số lượng cảnh báo: ${alerts.alerts.length}`);
        
        // Kiểm tra cảnh báo tài chính nếu có
        const finAlert = alerts.alerts.find((a: any) => a.category === 'FINANCIAL_RISK');
        if (finAlert) {
            console.log(`Cảnh báo rủi ro tài chính: ${finAlert.title}`);
            assert.ok(finAlert.title.includes('bệnh nhân nội trú âm tạm ứng trên 5.000.000đ'));
        }
    });
});

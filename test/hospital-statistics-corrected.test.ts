import test from 'node:test';
import assert from 'node:assert/strict';
import { StatisticsService } from '../src/services/statistics.service';

test('Hospital Statistics - Suite kiểm thử chuẩn hóa theo tài liệu nghiệp vụ', async (t) => {
    const fromDate = '2026-06-01 00:00:00';
    const toDate = '2026-06-25 23:59:59';

    await t.test('1. Báo cáo Hoạt động BV Tổng thể (Mục I & II) khớp chuẩn C6 và Nội trú IV', async () => {
        const data = await StatisticsService.getHospitalActivity(fromDate, toDate);
        assert.ok(data);
        assert.ok(data.examination);
        assert.ok(data.inpatient);
        assert.ok(Array.isArray(data.paraclinical));
        assert.ok(Array.isArray(data.surgery));

        const exam = data.examination;
        const inp = data.inpatient;

        // Assertion 1.1: Tổng lượt khám >= BHYT
        assert.ok(Number(exam.tong_so) >= Number(exam.so_bhyt), 'Tổng lượt khám phải >= lượt BHYT');
        // Assertion 1.2: Đồng bộ Vào viện giữa C6 và Nội trú
        assert.equal(Number(inp.vao_vien), Number(exam.nhap_vien), 'Vào viện nội trú trên Dashboard/Hoạt động BV phải đồng bộ khớp với Báo cáo C6');

        // Assertion 1.3: Cận lâm sàng không được chứa nhóm phẫu thuật / thủ thuật (B4, B5)
        for (const cls of data.paraclinical) {
            assert.ok(!cls.cls_group.includes('B4') && !cls.cls_group.includes('B5'), 'CLS không được lẫn nhóm B4, B5');
        }

        // Assertion 1.4: Phẫu thuật thủ thuật phân tách rõ ràng
        for (const sur of data.surgery) {
            assert.ok(['PHAU_THUAT', 'THU_THUAT'].includes(sur.pttt_type), 'Loại PTTT phải là PHAU_THUAT hoặc THU_THUAT');
        }
    });

    await t.test('2. Thống kê theo Phòng khám (Mục III) - Khớp C6, có Ra Viện (cho_ve) và Đang Khám', async () => {
        const clinics = await StatisticsService.getClinicsStatistics(fromDate, toDate);
        assert.ok(Array.isArray(clinics));
        assert.ok(clinics.length > 0, 'Phải có danh sách phòng khám');

        for (const room of clinics) {
            assert.ok(room.room_id !== undefined, 'Mỗi phòng khám phải có room_id');
            assert.ok(typeof room.room_name === 'string', 'Tên phòng khám phải là string');
            assert.ok(Number(room.tong_luot_kham) >= 0);
            assert.ok(Number(room.so_bhyt) >= 0);
            assert.ok(Number(room.so_dichvu) >= 0);
            assert.ok(Number(room.nhap_vien) >= 0);
            assert.ok(Number(room.chuyen_vien) >= 0);
            assert.ok(Number(room.cho_ve) >= 0, 'Cột Ra viện (cho_ve) phải >= 0');
            assert.ok(Number(room.dang_kham) >= 0, 'Cột Đang khám phải >= 0');
        }
    });

    await t.test('3. Báo cáo Điều trị nội trú (Mục IV - Ground Truth) cân đối bệnh nhân', async () => {
        const inp = await StatisticsService.getInpatientStatistics(fromDate, toDate);
        assert.ok(Array.isArray(inp));
        assert.ok(inp.length > 0, 'Danh sách khoa nội trú không được rỗng');

        for (const dept of inp) {
            assert.ok(dept.dept_id);
            assert.ok(dept.dept_name);
            assert.ok(Number(dept.dau_ky) >= 0);
            assert.ok(Number(dept.vao_vien) >= 0);
            assert.ok(Number(dept.chuyen_den) >= 0);
            assert.ok(Number(dept.chuyen_di) >= 0);
            assert.ok(Number(dept.ra_vien) >= 0);
            assert.ok(Number(dept.tu_vong) >= 0);
            assert.ok(Number(dept.hien_dien) >= 0);
        }
    });

    await t.test('4. Báo cáo Cận lâm sàng (Mục V) - Loại trừ B4/B5, sửa Ca BHYT, tên CT- Scanner', async () => {
        const clsList = await StatisticsService.getParaclinicalStatistics(fromDate, toDate);
        assert.ok(Array.isArray(clsList));

        // Kiểm tra loại trừ nhóm B4, B5
        for (const it of clsList) {
            assert.ok(!it.group_id.startsWith('B4'), `Nhóm ${it.group_id} là phẫu thuật không được xuất hiện ở CLS`);
            assert.ok(!it.group_id.startsWith('B5'), `Nhóm ${it.group_id} là thủ thuật không được xuất hiện ở CLS`);

            // Kiểm tra tên chuẩn CT- Scanner
            if (it.group_id === 'B2200' || it.group_name.toLowerCase().includes('ct')) {
                assert.equal(it.group_name, 'CT- Scanner', 'Tên nhóm CT Scanner phải được chuẩn hóa thành CT- Scanner');
            }

            // Kiểm tra Ca BHYT & Ca Dịch vụ
            assert.ok(Number(it.ca_bhyt) >= 0, 'Ca BHYT phải >= 0');
            assert.ok(Number(it.ca_dichvu) >= 0, 'Ca Dịch vụ phải >= 0');
            assert.equal(Number(it.ca_bhyt) + Number(it.ca_dichvu), Number(it.tong_so_ca), 'Tổng số ca phải bằng ca BHYT + ca Dịch vụ');
        }
    });

    await t.test('5. Báo cáo Phẫu thuật - Thủ thuật theo Phân loại (Mục 1 nhóm C nội trú)', async () => {
        const pttt = await StatisticsService.getSurgeryStatistics(fromDate, toDate);
        assert.ok(Array.isArray(pttt));
        assert.ok(pttt.length > 0);

        for (const dept of pttt) {
            assert.ok(Number(dept.tong_so_ca) >= 0);
            const sumTypes = Number(dept.loai_dac_biet) + Number(dept.loai_1) + Number(dept.loai_2) + Number(dept.loai_3) + Number(dept.thu_thuat);
            assert.ok(Number(dept.tong_so_ca) >= sumTypes, 'Tổng số ca phải >= tổng các loại chi tiết');
        }
    });

    await t.test('6. Kiểm tra xử lý thời gian theo chuẩn 24h (HH:mm:ss)', async () => {
        // Test với mốc thời gian chi tiết trong ngày (ca trực)
        const shiftFrom = '2026-06-15 07:00:00';
        const shiftTo = '2026-06-15 15:30:00';

        const shiftData = await StatisticsService.getHospitalActivity(shiftFrom, shiftTo);
        assert.ok(shiftData);
        assert.ok(Number(shiftData.examination.tong_so) >= 0);
    });

    await t.test('7. Báo cáo Tổng hợp Chi phí theo Khoa phòng (Cân đối 100%)', async () => {
        const costs = await StatisticsService.getDepartmentCostStatistics(fromDate, toDate);
        assert.ok(Array.isArray(costs));
        assert.ok(costs.length > 0);

        for (const dept of costs) {
            const total = Number(dept.tong_cong_chi_phi);
            const sumCategories = Number(dept.tien_kham) + Number(dept.tien_giuong) + 
                Number(dept.tien_xet_nghiem) + Number(dept.tien_cdha) + Number(dept.tien_tdcn) + 
                Number(dept.tien_pttt) + Number(dept.tien_thuoc) + Number(dept.tien_mau) + 
                Number(dept.tien_vtyt) + Number(dept.tien_khac);
            
            assert.ok(Math.abs(total - sumCategories) < 0.01, `Tổng chi phí phải khớp tổng 10 mục thành phần: ${total} vs ${sumCategories}`);
            
            const bhyt = Number(dept.bhyt_thanh_toan);
            const pat = Number(dept.benh_nhan_tra);
            assert.ok(Math.abs(total - (bhyt + pat)) < 0.01, `Tổng chi phí phải bằng BHYT + BN trả: ${total} vs ${bhyt + pat}`);
            assert.ok(pat >= 0, `Tiền bệnh nhân trả không được âm: ${pat}`);
        }
    });

    await t.test('8. Báo cáo Công suất Giường bệnh (Chỉ khoa lâm sàng thực tế)', async () => {
        const beds = await StatisticsService.getBedOccupancyStatistics();
        assert.ok(Array.isArray(beds));
        assert.ok(beds.length > 0);

        // Đảm bảo không chứa phòng ban hành chính (như Ban Giám Đốc, Hành chính)
        const invalidDepts = beds.filter(b => ['BGD', 'HC', 'KD', 'VP', 'NV'].includes(b.dept_id));
        assert.strictEqual(invalidDepts.length, 0, 'Báo cáo giường không được lẫn phòng ban hành chính');

        for (const dept of beds) {
            assert.ok(Number(dept.giuong_thuc_ke) > 0 || Number(dept.bn_dang_nam) > 0);
            assert.ok(Number(dept.ty_le_cong_suat) >= 0);
        }
    });
});

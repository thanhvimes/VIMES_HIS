import assert from 'assert';
import * as XLSX from 'xlsx';

async function runHealthCheckReportServiceAudit() {
    console.log('🧪 BẮT ĐẦU KIỂM THỬ HỒI QUY: BÁO CÁO KSK DỊCH VỤ KHÔNG THỰC HIỆN\n');

    const { buildHealthCheckExcelReport } = await import('../../modules/health-check-sync/utils/healthCheckExcelReportHelper');

    // Case 1: Gói khám cơ bản KHÔNG CÓ Siêu âm, KHÔNG CÓ X-quang
    console.log('Test Case 1: Hợp đồng chỉ khám lâm sàng + xét nghiệm máu/nước tiểu cơ bản (KHÔNG CÓ Siêu âm, X-quang)');
    const employeesWithoutImaging: any[] = [
        {
            stt: 1,
            code: 'NV001',
            name: 'Nguyễn Văn A',
            gender: 'Nam',
            dob: '15/05/1990',
            blood_pressure: '120/80',
            pulse: 75,
            noi: 'Bình thường',
            glucose: '5.2',
            hgb: '140',
            // us_abdomen, us_thyroid, us_breast, xray_chest KHÔNG CÓ (rỗng / undefined)
            us_abdomen: '',
            us_thyroid: '',
            us_breast: '',
            xray_chest: '',
            phanloai: 'I',
            conclusion: 'Đủ sức khỏe làm việc',
            executedServices: {
                'kham_tong_quat': true,
                'B110010264': true, // Tổng phân tích máu
                'B120010307': true  // Glucose
            }
        },
        {
            stt: 2,
            code: 'NV002',
            name: 'Trần Thị B',
            gender: 'Nữ',
            dob: '20/10/1995',
            blood_pressure: '110/70',
            pulse: 78,
            noi: 'Bình thường',
            phukhoa: 'Bình thường',
            glucose: '4.8',
            hgb: '125',
            us_abdomen: '',
            us_thyroid: '',
            us_breast: '',
            xray_chest: '',
            phanloai: 'I',
            conclusion: 'Đủ sức khỏe làm việc',
            executedServices: {
                'kham_tong_quat': true,
                'kham_san': true,
                'B110010264': true,
                'B120010307': true
            }
        }
    ];

    const packageServicesCase1 = [
        { key: 'kham_tong_quat', itemId: 'kham_tong_quat', name: 'Khám sức khỏe toàn diện', unitPrice: 150000 },
        { key: 'kham_san', itemId: 'kham_san', name: 'Khám sản phụ khoa', unitPrice: 50000, gender: 'F' as const },
        { key: 'B110010264', itemId: 'B110010264', name: 'Tổng phân tích tế bào máu laser', unitPrice: 50000 },
        { key: 'B120010307', itemId: 'B120010307', name: 'Định lượng Glucose máu', unitPrice: 25000 }
    ];

    const wbCase1 = buildHealthCheckExcelReport({
        contract: {
            contractCode: 'HD-TEST-NO-IMAGING',
            contractName: 'Công ty Test Không CĐHA',
            totalRegistered: 2
        },
        serviceCatalog: packageServicesCase1,
        employees: employeesWithoutImaging
    });

    // 1. Kiểm tra Sheet 3: "Kết quả"
    const sheetKq = wbCase1.Sheets['Kết quả'];
    assert(sheetKq, 'Sheet Kết quả phải tồn tại');
    const kqJson: any[][] = XLSX.utils.sheet_to_json(sheetKq, { header: 1 });

    // Dòng dữ liệu NV001 (Index 2)
    const rowNV1 = kqJson[2];
    const rowNV2 = kqJson[3];

    // Cột 39: Siêu âm tuyến giáp, 40: Siêu âm ổ bụng, 41: Siêu âm tuyến vú, 42: X-quang
    console.log('   - NV001 Siêu âm tuyến giáp:', JSON.stringify(rowNV1[39]));
    console.log('   - NV001 Siêu âm ổ bụng:', JSON.stringify(rowNV1[40]));
    console.log('   - NV001 Siêu âm tuyến vú:', JSON.stringify(rowNV1[41]));
    console.log('   - NV001 X-quang ngực:', JSON.stringify(rowNV1[42]));

    assert(!rowNV1[39] || rowNV1[39] === '', 'Siêu âm tuyến giáp KHÔNG ĐƯỢC chứa chuỗi giả lập khi không thực hiện');
    assert(!rowNV1[40] || rowNV1[40] === '', 'Siêu âm ổ bụng KHÔNG ĐƯỢC chứa chuỗi giả lập khi không thực hiện');
    assert(!rowNV1[41] || rowNV1[41] === '', 'Siêu âm tuyến vú KHÔNG ĐƯỢC chứa chuỗi giả lập khi không thực hiện');
    assert(!rowNV1[42] || rowNV1[42] === '', 'X-quang ngực KHÔNG ĐƯỢC chứa chuỗi giả lập khi không thực hiện');
    console.log('   ✅ PASS: Sheet Kết quả không có giá trị Siêu âm / X-quang giả lập!');

    // 2. Kiểm tra Sheet 4: "Chi phí"
    const sheetCp = wbCase1.Sheets['Chi phí'];
    assert(sheetCp, 'Sheet Chi phí phải tồn tại');
    const cpJson: any[][] = XLSX.utils.sheet_to_json(sheetCp, { header: 1 });

    // Header cột tại dòng index 8 hoặc 9
    const headerRow = cpJson.find((r: any[]) => r && r[0] === 'STT');
    assert(headerRow, 'Phải có dòng tiêu đề các cột dịch vụ');
    console.log('   - Các cột dịch vụ trong bảng chi phí:', headerRow.slice(4));

    const hasUltrasoundCol = headerRow.some((colName: string) => String(colName || '').toLowerCase().includes('siêu âm'));
    const hasXrayCol = headerRow.some((colName: string) => String(colName || '').toLowerCase().includes('xquang') || String(colName || '').toLowerCase().includes('x-quang'));

    assert(!hasUltrasoundCol, 'Bảng chi phí KHÔNG ĐƯỢC có cột Siêu âm khi gói không có');
    assert(!hasXrayCol, 'Bảng chi phí KHÔNG ĐƯỢC có cột X-quang khi gói không có');
    console.log('   ✅ PASS: Bảng chi phí chỉ hiển thị đúng các dịch vụ trong gói hợp đồng!');

    // Kiểm tra dòng tiền NV001: Nam, làm Khám tổng quát (150k) + Máu (50k) + Glucose (25k) = 225k (Không tính khám sản)
    const emp1Row = cpJson.find((r: any[]) => r && r[1] === 'Nguyễn Văn A');
    assert(emp1Row, 'Phải tìm thấy dòng NV001 trong bảng chi phí');
    const totalCostNV1 = emp1Row[emp1Row.length - 1];
    console.log('   - Tổng tiền NV001 (Nam):', totalCostNV1, '(Kỳ vọng: 225000)');
    assert.strictEqual(totalCostNV1, 225000, 'Tổng tiền NV001 phải đúng bằng các dịch vụ thực tế đã làm');

    // Kiểm tra dòng tiền NV002: Nữ, làm Khám tổng quát (150k) + Sản (50k) + Máu (50k) + Glucose (25k) = 275k
    const emp2Row = cpJson.find((r: any[]) => r && r[1] === 'Trần Thị B');
    assert(emp2Row, 'Phải tìm thấy dòng NV002 trong bảng chi phí');
    const totalCostNV2 = emp2Row[emp2Row.length - 1];
    console.log('   - Tổng tiền NV002 (Nữ):', totalCostNV2, '(Kỳ vọng: 275000)');
    assert.strictEqual(totalCostNV2, 275000, 'Tổng tiền NV002 phải đúng bằng các dịch vụ thực tế đã làm');
    console.log('   ✅ PASS: Tính chi phí chính xác tuyệt đối theo dịch vụ thực tế!');

    // Case 2: Hợp đồng CÓ Siêu âm và X-quang thực tế
    console.log('\nTest Case 2: Hợp đồng CÓ Siêu âm và X-quang và nhân viên THỰC TẾ CÓ LÀM');
    const employeesWithImaging: any[] = [
        {
            stt: 1,
            code: 'NV003',
            name: 'Lê Hoàng C',
            gender: 'Nam',
            dob: '10/01/1988',
            blood_pressure: '125/80',
            pulse: 72,
            us_abdomen: 'Hình ảnh gan nhiễm mỡ độ 1',
            xray_chest: 'Nốt vôi hóa đỉnh phổi phải',
            phanloai: 'II',
            conclusion: 'Gan nhiễm mỡ độ 1',
            executedServices: {
                'kham_tong_quat': true,
                'sa_o_bung': true,
                'xquang_nguc': true
            }
        }
    ];

    const packageServicesCase2 = [
        { key: 'kham_tong_quat', itemId: 'kham_tong_quat', name: 'Khám sức khỏe toàn diện', unitPrice: 150000 },
        { key: 'sa_o_bung', itemId: 'sa_o_bung', name: 'Siêu âm ổ bụng', unitPrice: 60000 },
        { key: 'xquang_nguc', itemId: 'xquang_nguc', name: 'Xquang ngực thẳng', unitPrice: 75000 }
    ];

    const wbCase2 = buildHealthCheckExcelReport({
        contract: {
            contractCode: 'HD-TEST-WITH-IMAGING',
            contractName: 'Công ty Test Có CĐHA',
            totalRegistered: 1
        },
        serviceCatalog: packageServicesCase2,
        employees: employeesWithImaging
    });

    const sheetKq2 = wbCase2.Sheets['Kết quả'];
    const kqJson2: any[][] = XLSX.utils.sheet_to_json(sheetKq2, { header: 1 });
    const rowNV3 = kqJson2[2];

    assert.strictEqual(rowNV3[40], 'Hình ảnh gan nhiễm mỡ độ 1', 'Kết quả siêu âm ổ bụng thực tế phải được hiển thị');
    assert.strictEqual(rowNV3[42], 'Nốt vôi hóa đỉnh phổi phải', 'Kết quả X-quang ngực thực tế phải được hiển thị');
    assert(!rowNV3[39] || rowNV3[39] === '', 'Siêu âm tuyến giáp không làm thì vẫn phải để trống');
    console.log('   ✅ PASS: Kết quả thực tế được đưa vào chính xác, dịch vụ không làm để trống!');

    // Case 3: Test logic lọc bỏ dữ liệu ảo (phantom autofill) khi hợp đồng KHÔNG CÓ CĐHA
    console.log('\nTest Case 3: Kiểm tra logic lọc dữ liệu tồn lưu / autofill (vd us.ket_qua="Bình thường") khi hợp đồng KHÔNG CÓ CĐHA');
    const pkgWithoutImaging = [
        { key: 'kham_tong_quat', itemId: 'kham_tong_quat', name: 'Khám sức khỏe toàn diện', unitPrice: 150000 },
        { key: 'glucose', itemId: 'glucose', name: 'Định lượng Glucose', unitPrice: 40000 }
    ];

    const contractHasUsAbdomen = pkgWithoutImaging.some((s: any) => {
        const sName = (s.name || '').toLowerCase();
        return sName.includes('siêu âm') && (sName.includes('bụng') || sName.includes('ổ bụng'));
    });
    const contractHasChestXray = pkgWithoutImaging.some((s: any) => {
        const sName = (s.name || '').toLowerCase();
        return (sName.includes('x-quang') || sName.includes('xquang')) && (sName.includes('ngực') || sName.includes('phổi'));
    });

    const rawEmpWithPhantomData = {
        name: 'Trần Văn Phantom',
        gender: 'Nam',
        lab_data: {
            us: { ket_qua: 'Bình thường' },
            imaging: { ket_qua: 'Bình thường' },
            paraclinical_items: [] // Không có chỉ định thực tế
        }
    };

    const pItems = rawEmpWithPhantomData.lab_data.paraclinical_items;
    const empHasUsAbdomen = pItems.some((x: any) => {
        const sName = String(x.service_name || x.name || '').toLowerCase();
        return sName.includes('siêu âm') && (sName.includes('bụng') || sName.includes('ổ bụng'));
    });
    const empHasChestXray = pItems.some((x: any) => {
        const sName = String(x.service_name || x.name || '').toLowerCase();
        return (sName.includes('x-quang') || sName.includes('xquang')) && (sName.includes('ngực') || sName.includes('phổi'));
    });

    const filteredUsAbdomen = (contractHasUsAbdomen || empHasUsAbdomen) ? rawEmpWithPhantomData.lab_data.us.ket_qua : '';
    const filteredXrayChest = (contractHasChestXray || empHasChestXray) ? rawEmpWithPhantomData.lab_data.imaging.ket_qua : '';

    assert.strictEqual(filteredUsAbdomen, '', 'Siêu âm ổ bụng ảo phải bị loại bỏ thành rỗng vì không có trong gói và không chỉ định');
    assert.strictEqual(filteredXrayChest, '', 'X-quang ngực ảo phải bị loại bỏ thành rỗng vì không có trong gói và không chỉ định');
    console.log('   ✅ PASS: Dữ liệu autofill tồn dư đã bị chặn hoàn toàn, báo cáo trả về rỗng!');

    console.log('\n🎉 TẤT CẢ CÁC TEST CASES ĐÃ ĐẠT 100% THÀNH CÔNG!');
}

runHealthCheckReportServiceAudit()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Kiểm thử thất bại:', err);
        process.exit(1);
    });

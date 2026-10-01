import assert from 'assert';
import { ContractsController } from '../src/controllers/health-check/contracts.controller';

async function testApiContractsIntegration() {
    console.log('🧪 BẮT ĐẦU KIỂM THỬ API getContractReportSummary VỚI DỮ LIỆU THỰC TẾ\n');
    const ctrl = new ContractsController();

    // Test HĐ 159: Hợp đồng có cấu hình 3 dịch vụ trong hms_exm_servicepackage (Demodex, Đơn bào, Chụp bàng quang - KHÔNG CÓ Siêu âm ổ bụng, KHÔNG CÓ X-quang ngực)
    const req159: any = { params: { id: '159' }, query: {} };
    let json159: any = null;
    const res159: any = {
        json: (data: any) => { json159 = data; return res159; },
        status: (code: number) => { console.log('Status code 159:', code); return res159; }
    };

    await ctrl.getContractReportSummary(req159, res159);
    assert(json159 && json159.success, 'API getContractReportSummary cho HĐ 159 phải thành công');
    assert(Array.isArray(json159.packageServices), 'API phải trả về packageServices');
    console.log('HĐ 159 - Danh mục gói dịch vụ trả về:');
    json159.packageServices.forEach((s: any) => {
        console.log(`   - [${s.itemId}] ${s.name} (Đơn giá: ${s.unitPrice})`);
    });

    const hasChestXray = json159.packageServices.some((s: any) => s.name?.toLowerCase().includes('x-quang ngực') || s.name?.toLowerCase().includes('xquang ngực'));
    const hasAbdominalUltrasound = json159.packageServices.some((s: any) => s.name?.toLowerCase().includes('siêu âm ổ bụng'));
    assert(!hasChestXray, 'Gói HĐ 159 không được chứa X-quang ngực');
    assert(!hasAbdominalUltrasound, 'Gói HĐ 159 không được chứa Siêu âm ổ bụng');
    console.log('✅ PASS: HĐ 159 không chứa Siêu âm ổ bụng hoặc X-quang ngực!');

    // Kiểm tra nhân viên của HĐ 159
    const emp = json159.employees[0];
    if (emp) {
        console.log(`\nKiểm tra nhân viên ${emp.name} (Mã: ${emp.code}):`);
        console.log(`   - Siêu âm ổ bụng: "${emp.us_abdomen}"`);
        console.log(`   - X-quang: "${emp.xray_chest}"`);
        console.log(`   - Dịch vụ thực hiện (executedServices):`, emp.executedServices);
        assert(!emp.us_abdomen || emp.us_abdomen === '', 'us_abdomen phải rỗng khi nhân viên không làm siêu âm');
        assert(!emp.xray_chest || emp.xray_chest === '', 'xray_chest phải rỗng khi nhân viên không làm x-quang ngực');
        console.log('✅ PASS: Dữ liệu CĐHA của nhân viên không có kết quả giả lập!');
    }

    console.log('\n🎉 KIỂM THỬ TÍCH HỢP API THÀNH CÔNG 100%!');
}

testApiContractsIntegration()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Kiểm thử API thất bại:', err);
        process.exit(1);
    });

import notificationService from '../src/services/notification.service';
import smsTemplateService from '../src/services/sms-template.service';

async function runSMSFullFlowTestSuite() {
    console.log('====================================================');
    console.log('🚀 RUNNING COMPREHENSIVE SMS FLOW TEST SUITE');
    console.log('====================================================\n');

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition: boolean, testName: string) {
        if (condition) {
            console.log(`  ✅ PASSED: ${testName}`);
            passedCount++;
        } else {
            console.error(`  ❌ FAILED: ${testName}`);
            failedCount++;
        }
    }

    // =========================================================================
    // TEST CASE 1: Single Specialty Registration SMS
    // =========================================================================
    console.log('📌 TEST CASE 1: Single Specialty Registration SMS Formatting');
    const singleData = {
        patientName: 'NGUYỄN VĂN CHÍNH',
        phone: '0912345678',
        date: '07/08/2026',
        time: '07:20',
        bookingId: 'BK161516',
        queueNumber: '15',
        receptNo: '15',
        specialtyName: 'Khám đầu mặt cổ,tuyến giáp',
        roomName: 'Phòng Khám Đầu - Mặt - Cổ',
        deptId: 'KB',
        patientType: 'DV'
    };

    const formattedSingle = notificationService.formatMessage(
        '[VIMES] Chuc mung {patientName}! Lich kham vao {date} luc {time} CK: {specialtyName} ({roomName}) da duoc duyet. STT: {queueNumber}.',
        singleData
    );

    assert(formattedSingle.includes('NGUYỄN VĂN CHÍNH'), 'Single specialty: Patient name replaced correctly');
    assert(formattedSingle.includes('07/08/2026'), 'Single specialty: Date replaced correctly');
    assert(formattedSingle.includes('Khám đầu mặt cổ,tuyến giáp'), 'Single specialty: Specialty name replaced correctly');
    assert(formattedSingle.includes('Phòng Khám Đầu - Mặt - Cổ'), 'Single specialty: Room name replaced correctly');
    assert(formattedSingle.includes('STT: 15'), 'Single specialty: Queue number replaced correctly');

    // =========================================================================
    // TEST CASE 2: Multi-Specialty Registration (2 Specialties Parameter Isolation)
    // =========================================================================
    console.log('\n📌 TEST CASE 2: Multi-Specialty (2 Specialties) Isolation & Formatting');
    const spec1Data = {
        patientName: 'TRẦN THỊ AN',
        phone: '0987654321',
        date: '08/08/2026',
        time: '08:00',
        bookingId: 'BK200001',
        queueNumber: '21',
        specialtyName: 'Khám Mắt',
        roomName: 'Phòng 21',
        deptId: 'MAT',
        patientType: 'BH'
    };

    const spec2Data = {
        patientName: 'TRẦN THỊ AN',
        phone: '0987654321',
        date: '08/08/2026',
        time: '09:30',
        bookingId: 'BK200002',
        queueNumber: '35',
        specialtyName: 'Khám Tai Mũi Họng',
        roomName: 'Phòng 35',
        deptId: 'TMH',
        patientType: 'BH'
    };

    const smsSpec1 = notificationService.formatMessage(
        '[VIMES] Ban {name} dat kham {specialtyName} ({roomName}) ngay {date} luc {time}. STT: {receptNo}.',
        spec1Data
    );

    const smsSpec2 = notificationService.formatMessage(
        '[VIMES] Ban {name} dat kham {specialtyName} ({roomName}) ngay {date} luc {time}. STT: {receptNo}.',
        spec2Data
    );

    assert(smsSpec1.includes('Khám Mắt') && smsSpec1.includes('Phòng 21') && smsSpec1.includes('STT: 21'), 'Multi-specialty 1: Room 21 & Eye specialty accurate');
    assert(smsSpec2.includes('Khám Tai Mũi Họng') && smsSpec2.includes('Phòng 35') && smsSpec2.includes('STT: 35'), 'Multi-specialty 2: Room 35 & ENT specialty accurate');
    assert(!smsSpec2.includes('Phòng 21') && !smsSpec2.includes('Khám Mắt'), 'Multi-specialty 2: NO data overwriting from Specialty 1');

    // =========================================================================
    // TEST CASE 3: Multi-Specialty Registration (3 Specialties Parameter Isolation)
    // =========================================================================
    console.log('\n📌 TEST CASE 3: Multi-Specialty (3 Specialties) Scope Isolation');
    const spec3_1 = { patientName: 'BÙI VĂN B', date: '09/08/2026', time: '08:00', specialtyName: 'Khoa Ngoại', roomName: 'Phòng 10', queueNumber: '10' };
    const spec3_2 = { patientName: 'BÙI VĂN B', date: '09/08/2026', time: '09:00', specialtyName: 'Khoa Nội', roomName: 'Phòng 20', queueNumber: '20' };
    const spec3_3 = { patientName: 'BÙI VĂN B', date: '09/08/2026', time: '10:00', specialtyName: 'Khoa Nhi', roomName: 'Phòng 30', queueNumber: '30' };

    const sms3_1 = notificationService.formatMessage('[VIMES] {name}: {specialtyName} - {roomName} STT:{queueNumber}', spec3_1);
    const sms3_2 = notificationService.formatMessage('[VIMES] {name}: {specialtyName} - {roomName} STT:{queueNumber}', spec3_2);
    const sms3_3 = notificationService.formatMessage('[VIMES] {name}: {specialtyName} - {roomName} STT:{queueNumber}', spec3_3);

    assert(sms3_1.includes('Khoa Ngoại') && sms3_1.includes('Phòng 10'), '3-Specialties Spec 1: Correct isolation');
    assert(sms3_2.includes('Khoa Nội') && sms3_2.includes('Phòng 20'), '3-Specialties Spec 2: Correct isolation');
    assert(sms3_3.includes('Khoa Nhi') && sms3_3.includes('Phòng 30'), '3-Specialties Spec 3: Correct isolation');

    // =========================================================================
    // TEST CASE 4: Full Placeholder Alias Expansion Test
    // =========================================================================
    console.log('\n📌 TEST CASE 4: Full Placeholder Alias Expansion Test');
    const fullAliasTemplate = 'Tên: {name} | Bệnh nhân: {patientName} | Ngày: {date} = {bookingDate} | Giờ: {time} = {bookingTime} | CK: {specialty} = {specialtyName} | Phòng: {roomName} | STT: {queueNumber} = {receptNo}';
    const aliasData = {
        name: 'PHẠM VĂN NGHIỆM',
        date: '10/08/2026',
        time: '14:00',
        specialtyName: 'Chấn Thương Chỉnh Hình',
        roomName: 'Phòng mổ 2',
        receptNo: '88',
        bookingId: '9999'
    };

    const expandedMessage = notificationService.formatMessage(fullAliasTemplate, aliasData);
    assert(expandedMessage.includes('Tên: PHẠM VĂN NGHIỆM | Bệnh nhân: PHẠM VĂN NGHIỆM'), 'Alias: {name} & {patientName} both expanded');
    assert(expandedMessage.includes('Ngày: 10/08/2026 = 10/08/2026'), 'Alias: {date} & {bookingDate} both expanded');
    assert(expandedMessage.includes('Giờ: 14:00 = 14:00'), 'Alias: {time} & {bookingTime} both expanded');
    assert(expandedMessage.includes('CK: Chấn Thương Chỉnh Hình = Chấn Thương Chỉnh Hình'), 'Alias: {specialty} & {specialtyName} both expanded');
    assert(expandedMessage.includes('STT: 88 = 88'), 'Alias: {queueNumber} & {receptNo} both expanded');

    // =========================================================================
    // SUMMARY REPORT
    // =========================================================================
    console.log('\n====================================================');
    console.log(`📊 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} TESTS`);
    console.log('====================================================');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runSMSFullFlowTestSuite();

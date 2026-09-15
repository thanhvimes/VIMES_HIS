import test from 'node:test';
import assert from 'node:assert/strict';
import settingsService from '../src/services/settings.service';

// Override settingsService.getValue before importing notificationService so channel checks always pass
settingsService.getValue = async (key: string, defaultValue: any = true) => {
    if (key.startsWith('notification_')) {
        return true as any;
    }
    return (defaultValue !== null && defaultValue !== undefined ? defaultValue : true) as any;
};

import notificationService, { NotificationData } from '../src/services/notification.service';

test('Multi-specialty SMS Registration Test Suite (1, 2, 3 Chuyên khoa)', async (t) => {

    // =========================================================================
    // TEST CASE 1: ĐĂNG KÝ 1 CHUYÊN KHOA
    // =========================================================================
    await t.test('Case 1: Bệnh nhân đăng ký 1 chuyên khoa duy nhất', async () => {
        const regData: NotificationData = {
            patientName: 'Trần Văn B',
            date: '10/08/2026',
            time: '08:00',
            specialtyName: 'Tai Mũi Họng',
            roomName: 'Phòng 105',
            queueNumber: '01',
            deptId: 'TMH',
            patientType: 'DV'
        };

        const res = await notificationService.sendSMS('0912345678', 'booking_confirmation', regData);
        assert.equal(res.success, true);
        assert.match(res.message, /Phòng 105/);
        assert.match(res.message, /Trần Văn B/);

        console.log('✅ [1 CK] SMS Message:\n' + res.message);
    });

    // =========================================================================
    // TEST CASE 2: ĐĂNG KÝ 2 CHUYÊN KHOA (KIỂM TRA CÁCH LY PHÒNG KHÁM)
    // =========================================================================
    await t.test('Case 2: Bệnh nhân đăng ký 2 chuyên khoa liên tiếp', async () => {
        const patientRegistrations: NotificationData[] = [
            {
                patientName: 'Nguyễn Văn A',
                date: '10/08/2026',
                time: '08:30',
                specialtyName: 'Tim mạch',
                roomName: 'Phòng 21',
                queueNumber: '05',
                deptId: 'TIM',
                patientType: 'DV'
            },
            {
                patientName: 'Nguyễn Văn A',
                date: '10/08/2026',
                time: '09:30',
                specialtyName: 'Mắt',
                roomName: 'Phòng 35',
                queueNumber: '12',
                deptId: 'MAT',
                patientType: 'DV'
            }
        ];

        const sentSMSList: string[] = [];

        for (const regData of patientRegistrations) {
            const res = await notificationService.sendSMS('0987654321', 'booking_confirmation', regData);
            assert.equal(res.success, true);
            sentSMSList.push(res.message);
        }

        // Đảm bảo SMS 1 chính xác Phòng 21 và KHÔNG chứa Phòng 35
        assert.match(sentSMSList[0], /Phòng 21/);
        assert.doesNotMatch(sentSMSList[0], /Phòng 35/);

        // Đảm bảo SMS 2 chính xác Phòng 35 và KHÔNG bị đè bởi Phòng 21
        assert.match(sentSMSList[1], /Phòng 35/);
        assert.doesNotMatch(sentSMSList[1], /Phòng 21/);

        console.log('✅ [2 CK] SMS 1:\n' + sentSMSList[0]);
        console.log('✅ [2 CK] SMS 2:\n' + sentSMSList[1]);
    });

    // =========================================================================
    // TEST CASE 3: ĐĂNG KÝ 3 CHUYÊN KHOA TRỞ LÊN
    // =========================================================================
    await t.test('Case 3: Bệnh nhân đăng ký 3 chuyên khoa liên tiếp', async () => {
        const patientRegistrations: NotificationData[] = [
            {
                patientName: 'Lê Thị C',
                date: '10/08/2026',
                time: '08:00',
                specialtyName: 'Tim mạch',
                roomName: 'Phòng 21',
                queueNumber: '03',
                deptId: 'TIM',
                patientType: 'BH'
            },
            {
                patientName: 'Lê Thị C',
                date: '10/08/2026',
                time: '09:15',
                specialtyName: 'Mắt',
                roomName: 'Phòng 35',
                queueNumber: '08',
                deptId: 'MAT',
                patientType: 'BH'
            },
            {
                patientName: 'Lê Thị C',
                date: '10/08/2026',
                time: '10:30',
                specialtyName: 'Da liễu',
                roomName: 'Phòng 402',
                queueNumber: '15',
                deptId: 'DL',
                patientType: 'BH'
            }
        ];

        const sentSMSList: string[] = [];

        for (const regData of patientRegistrations) {
            const res = await notificationService.sendSMS('0933445566', 'booking_confirmation', regData);
            assert.equal(res.success, true);
            sentSMSList.push(res.message);
        }

        // Đảm bảo cả 3 SMS độc lập tuyệt đối dữ liệu Phòng khám và Số thứ tự
        assert.match(sentSMSList[0], /Phòng 21/);
        assert.match(sentSMSList[0], /STT khám bệnh là: 03/);
        assert.doesNotMatch(sentSMSList[0], /Phòng 35/);
        assert.doesNotMatch(sentSMSList[0], /Phòng 402/);

        assert.match(sentSMSList[1], /Phòng 35/);
        assert.match(sentSMSList[1], /STT khám bệnh là: 08/);
        assert.doesNotMatch(sentSMSList[1], /Phòng 21/);
        assert.doesNotMatch(sentSMSList[1], /Phòng 402/);

        assert.match(sentSMSList[2], /Phòng 402/);
        assert.match(sentSMSList[2], /STT khám bệnh là: 15/);
        assert.doesNotMatch(sentSMSList[2], /Phòng 21/);
        assert.doesNotMatch(sentSMSList[2], /Phòng 35/);

        console.log('✅ [3 CK] SMS 1:\n' + sentSMSList[0]);
        console.log('✅ [3 CK] SMS 2:\n' + sentSMSList[1]);
        console.log('✅ [3 CK] SMS 3:\n' + sentSMSList[2]);
    });

});

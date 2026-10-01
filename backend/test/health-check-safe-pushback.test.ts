import test from 'node:test';
import assert from 'node:assert/strict';
import { hisIntegrationController } from '../src/controllers/health-check/his-integration';

test('SAFE PUSHBACK & READ-ONLY INTEGRATION TESTS', async (t) => {

    await t.test('1. pushbackClinicalAndConclusion protects other doctors rooms and past exam dates in hms_exam', async () => {
        const executedQueries: { sql: string; params?: any[] }[] = [];
        
        // Giả lập phiếu khám hms_exam thuộc khoa Ngoại, do BS. pxthu phụ trách từ ngày 2026-08-16
        const pastExamDate = '2026-08-16 07:33:01';
        const mockClient = {
            query: async (sql: string, params?: any[]) => {
                executedQueries.push({ sql, params });
                
                // Mock hms_doc
                if (sql.includes('FROM hms_doc')) {
                    return {
                        rows: [{
                            hd_docno: 2600001,
                            hd_patientno: 12345,
                            hd_status: 'O',
                            hd_enddate: null,
                            hd_conclusion: null,
                            hd_result: null
                        }]
                    };
                }
                
                // Mock sys_user
                if (sql.includes('FROM sys_user')) {
                    return { rows: [{ su_deptid: 'SN' }] };
                }

                // Mock hms_exam: tìm thấy phiếu khám của BS. pxthu khoa Ngoại đang mở ('P')
                if (sql.includes('FROM hms_exam')) {
                    return {
                        rows: [{
                            he_docno: 2600001,
                            he_receptidx: 99901,
                            he_status: 'P',
                            he_doctor: 'pxthu',
                            he_deptid: 'NGOAI',
                            he_examdate: pastExamDate
                        }]
                    };
                }

                // Mock disease_hist & conclusion check
                if (sql.includes('FROM hms_disease_hist') || sql.includes('FROM hms_exm_conclusion')) {
                    return { rows: [] };
                }

                return { rows: [], rowCount: 1 };
            }
        };

        // Bác sĩ Nội khoa KSK (pdnghiep) thực hiện đồng bộ kết luận KSK
        await hisIntegrationController.pushbackClinicalAndConclusion(
            mockClient,
            2600001,
            {
                clinical_exam: {
                    internal: 'Nội khoa: Đau bụng thượng vị, ấn tức'
                }
            },
            {
                fitness_class: 'Loại 1',
                diagnosis: '[K29.1] Viêm dạ dày cấp tính khác'
            },
            'pdnghiep',
            'BS. Phạm Duy Nghiệp'
        );

        // Kiểm tra các câu lệnh UPDATE thực thi:
        // TUYỆT ĐỐI KHÔNG có câu lệnh UPDATE hms_exam nào được thực thi vì phiếu này thuộc về BS. pxthu khoa Ngoại!
        const examUpdates = executedQueries.filter(q => q.sql.includes('UPDATE hms_exam'));
        assert.equal(examUpdates.length, 0, 'Tuyệt đối không được UPDATE đè phiếu khám hms_exam của bác sĩ chuyên khoa khác');

        // Trong khi đó, kết luận KSK vẫn được lưu chuẩn vào hms_exm_conclusion
        const conclInserts = executedQueries.filter(q => q.sql.includes('INSERT INTO hms_exm_conclusion'));
        assert.equal(conclInserts.length, 1, 'Kết luận KSK phải được lưu đầy đủ vào bảng hms_exm_conclusion');

        // Và đóng đợt khám trong hms_doc
        const docUpdates = executedQueries.filter(q => q.sql.includes('UPDATE hms_doc'));
        assert.equal(docUpdates.length, 1, 'Đợt khám hms_doc phải được cập nhật kết luận');
    });

    await t.test('2. pushbackClinicalAndConclusion preserves past exam date even when updating conclusion doctors room', async () => {
        const executedQueries: { sql: string; params?: any[] }[] = [];
        const pastExamDate = '2026-08-16 07:33:01';
        
        const mockClient = {
            query: async (sql: string, params?: any[]) => {
                executedQueries.push({ sql, params });
                
                if (sql.includes('FROM hms_doc')) {
                    return {
                        rows: [{
                            hd_docno: 2600002,
                            hd_patientno: 12346,
                            hd_status: 'O',
                            hd_enddate: null
                        }]
                    };
                }
                if (sql.includes('FROM sys_user')) {
                    return { rows: [{ su_deptid: 'KSK' }] };
                }
                // Phiếu khám thuộc phòng KSK hoặc do chính pdnghiep khám
                if (sql.includes('FROM hms_exam')) {
                    return {
                        rows: [{
                            he_docno: 2600002,
                            he_receptidx: 99902,
                            he_status: 'P',
                            he_doctor: 'pdnghiep',
                            he_deptid: 'KSK',
                            he_examdate: pastExamDate
                        }]
                    };
                }
                return { rows: [], rowCount: 1 };
            }
        };

        await hisIntegrationController.pushbackClinicalAndConclusion(
            mockClient,
            2600002,
            { clinical_exam: { internal: 'Bình thường' } },
            { fitness_class: 'Loại 1', diagnosis: 'Đủ sức khỏe làm việc' },
            'pdnghiep',
            'BS. Phạm Duy Nghiệp'
        );

        const examUpdates = executedQueries.filter(q => q.sql.includes('UPDATE hms_exam'));
        assert.equal(examUpdates.length, 1, 'Phiếu khám KSK của chính bác sĩ được phép cập nhật');
        
        // Kiểm tra câu lệnh UPDATE hms_exam bảo toàn ngày khám cũ:
        // he_examdate = COALESCE(he_examdate, ...) chứ không bị ép gán cứng CURRENT_TIMESTAMP
        assert.match(examUpdates[0].sql, /he_examdate = COALESCE\(he_examdate,/);
        assert.match(examUpdates[0].sql, /he_doctor = COALESCE\(he_doctor,/);
    });

    await t.test('3. getHisPatient is strictly read-only and does not invoke pushbackClinicalAndConclusion', async () => {
        let pushbackCalled = false;
        const originalPushback = (hisIntegrationController as any).pushbackClinicalAndConclusion;
        (hisIntegrationController as any).pushbackClinicalAndConclusion = async () => {
            pushbackCalled = true;
        };

        try {
            const mockReq: any = {
                params: { identifier: '26292291' },
                query: {}
            };
            let jsonResult: any = null;
            const mockRes: any = {
                status: (code: number) => mockRes,
                json: (data: any) => { jsonResult = data; return mockRes; }
            };

            await hisIntegrationController.getHisPatient(mockReq, mockRes);
            assert.ok(jsonResult, 'getHisPatient trả về dữ liệu bệnh nhân');
            assert.equal(pushbackCalled, false, 'getHisPatient TUYỆT ĐỐI không được gọi pushbackClinicalAndConclusion');
        } finally {
            (hisIntegrationController as any).pushbackClinicalAndConclusion = originalPushback;
        }
    });

    await t.test('4. seedFromHis is strictly read-only towards HIS Core', async () => {
        let pushbackCalled = false;
        const originalPushback = (hisIntegrationController as any).pushbackClinicalAndConclusion;
        (hisIntegrationController as any).pushbackClinicalAndConclusion = async () => {
            pushbackCalled = true;
        };

        try {
            const mockReq: any = {
                body: { contractId: 1, limit: 10, offset: 0 },
                user: { id: 1, username: 'admin' }
            };
            let jsonResult: any = null;
            const mockRes: any = {
                status: (code: number) => mockRes,
                json: (data: any) => { jsonResult = data; return mockRes; }
            };

            await hisIntegrationController.seedFromHis(mockReq, mockRes);
            assert.equal(pushbackCalled, false, 'seedFromHis TUYỆT ĐỐI không được gọi pushbackClinicalAndConclusion');
        } finally {
            (hisIntegrationController as any).pushbackClinicalAndConclusion = originalPushback;
        }
    });

});

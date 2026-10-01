import test from 'node:test';
import assert from 'node:assert/strict';
import { findValue, generateXmlPayload } from '../src/controllers/health-check/xml-generator';

test('findValue prioritizes kq_ho_hap and adult specialty findings over nhi_ho_hap', () => {
    // Test 1: kq_ho_hap exists alongside nhi_ho_hap = "Bình thường"
    const src1 = {
        clinical: {
            clinical_exam: {
                nhi_ho_hap: 'Bình thường',
                kq_ho_hap: 'Lồng ngực cân đối di động theo nhịp thở. Rì rào phế nang êm dịu 2 phế trường.'
            }
        }
    };
    assert.equal(
        findValue('NOI_KHOA_HO_HAP', src1),
        'Lồng ngực cân đối di động theo nhịp thở. Rì rào phế nang êm dịu 2 phế trường.'
    );

    // Test 2: In Minor tag, kq_ho_hap must still be prioritized over default nhi_ho_hap
    assert.equal(
        findValue('NHI_KHOA_HO_HAP', src1),
        'Lồng ngực cân đối di động theo nhịp thở. Rì rào phế nang êm dịu 2 phế trường.'
    );

    // Test 3: Circular / Dict order check - even if nhi_ho_hap is first inserted key in object
    const src2 = {
        nhi_ho_hap: 'Bình thường',
        kq_ho_hap: 'Tiếng thở thanh khí phế quản rõ.'
    };
    assert.equal(findValue('NOI_KHOA_HO_HAP', src2), 'Tiếng thở thanh khí phế quản rõ.');
    assert.equal(findValue('NHI_KHOA_HO_HAP', src2), 'Tiếng thở thanh khí phế quản rõ.');
});

test('findValue prioritizes all clinical specialty fields over nhi_* fields', () => {
    const src = {
        clinical_exam: {
            kq_tim_mach: 'Mỏm tim đập KLS V đường giữa đòn trái. Nhịp tim đều.',
            nhi_tuan_hoan: 'Bình thường',
            noi_khoa_tieu_hoa: 'Bụng mềm, không chướng, gan lách không to.',
            nhi_tieu_hoa: 'Bình thường',
            kq_tiet_nieu: 'Hố thận 2 bên không dày. Chạm thận âm tính.',
            nhi_tiet_nieu: 'Bình thường',
            kq_than_kinh: 'Hiện chưa phát hiện dấu hiệu liệt thần kinh sọ.',
            nhi_than_kinh: 'Bình thường',
            kq_tam_than: 'Hiện tại chưa phát hiện dấu hiệu bệnh lý tâm thần.',
            nhi_tam_than: 'Bình thường'
        }
    };

    // Adult tags
    assert.equal(findValue('NOI_KHOA_TUAN_HOAN', src), 'Mỏm tim đập KLS V đường giữa đòn trái. Nhịp tim đều.');
    assert.equal(findValue('NOI_KHOA_TIEU_HOA', src), 'Bụng mềm, không chướng, gan lách không to.');
    assert.equal(findValue('NOI_KHOA_THAN_TN_SD', src), 'Hố thận 2 bên không dày. Chạm thận âm tính.');
    assert.equal(findValue('NOI_KHOA_THAN_KINH', src), 'Hiện chưa phát hiện dấu hiệu liệt thần kinh sọ.');
    assert.equal(findValue('NOI_KHOA_TAM_THAN', src), 'Hiện tại chưa phát hiện dấu hiệu bệnh lý tâm thần.');

    // Minor tags
    assert.equal(findValue('NHI_KHOA_TUAN_HOAN', src), 'Mỏm tim đập KLS V đường giữa đòn trái. Nhịp tim đều.');
    assert.equal(findValue('NHI_KHOA_TIEU_HOA', src), 'Bụng mềm, không chướng, gan lách không to.');
    assert.equal(findValue('NHI_KHOA_THAN_TN_SD', src), 'Hố thận 2 bên không dày. Chạm thận âm tính.');
    assert.equal(findValue('NHI_KHOA_THAN_KINH', src), 'Hiện chưa phát hiện dấu hiệu liệt thần kinh sọ.');
    assert.equal(findValue('NHI_KHOA_TAM_THAN', src), 'Hiện tại chưa phát hiện dấu hiệu bệnh lý tâm thần.');
});

test('findValue safely falls back to nhi_* when kq_* is empty', () => {
    const srcFallback = {
        clinical_exam: {
            kq_ho_hap: '',
            nhi_ho_hap: 'Bình thường',
            kq_tim_mach: null,
            nhi_tuan_hoan: 'Bình thường'
        }
    };
    assert.equal(findValue('NOI_KHOA_HO_HAP', srcFallback), 'Bình thường');
    assert.equal(findValue('NHI_KHOA_HO_HAP', srcFallback), 'Bình thường');
    assert.equal(findValue('NOI_KHOA_TUAN_HOAN', srcFallback), 'Bình thường');
    assert.equal(findValue('NHI_KHOA_TUAN_HOAN', srcFallback), 'Bình thường');
});

test('generateXmlPayload for Adult (Mẫu 3) embeds specialty findings instead of nhi_* "Bình thường"', () => {
    const master = {
        patient_name: 'NGUYỄN VĂN AN',
        dob: '1990-05-15',
        gender: 'Nam',
        cccd: '001090012345',
        doc_no: 'KSK-TEST-ADULT-01',
        created_at: '2026-09-15T08:00:00Z'
    };

    const clinical = {
        clinical_exam: {
            kq_ho_hap: 'Lồng ngực cân đối di động theo nhịp thở. Rì rào phế nang êm dịu 2 phế trường.',
            nhi_ho_hap: 'Bình thường',
            kq_tim_mach: 'Mỏm tim đập KLS V đường giữa đòn trái. Nhịp tim đều, T1 T2 rõ.',
            nhi_tuan_hoan: 'Bình thường',
            noi_khoa_tieu_hoa: 'Bụng mềm, không chướng, gan lách không to.',
            nhi_tieu_hoa: 'Bình thường',
            kq_tiet_nieu: 'Hố thận 2 bên không dày. Chạm thận âm tính.',
            nhi_tiet_nieu: 'Bình thường',
            kq_than_kinh: 'Hiện chưa phát hiện dấu hiệu liệt thần kinh sọ.',
            nhi_than_kinh: 'Bình thường',
            kq_tam_than: 'Hiện tại chưa phát hiện dấu hiệu bệnh lý tâm thần.',
            nhi_tam_than: 'Bình thường',
            noi_khoa_ho_hap_pl: '1',
            noi_khoa_tuan_hoan_pl: '1',
            noi_khoa_tieu_hoa_pl: '1',
            noi_khoa_than_tietnieu_pl: '1',
            noi_khoa_than_kinh_pl: '1',
            noi_khoa_tam_than_pl: '1'
        }
    };

    const lab = {
        blood_test: { hemoglobin: '145', glycemia: '5.2' }
    };

    const conclusion = {
        fitness_class: '1',
        diagnosis: 'Sức khỏe loại I'
    };

    const xml = generateXmlPayload('3', master, clinical, lab, conclusion);

    // Verify correct XML TYPE
    assert.match(xml, /<TYPE>Adult<\/TYPE>/);

    // Verify specialty clinical exam fields are used
    assert.match(xml, /<NOI_KHOA_HO_HAP>Lồng ngực cân đối di động theo nhịp thở\. Rì rào phế nang êm dịu 2 phế trường\.<\/NOI_KHOA_HO_HAP>/);
    assert.match(xml, /<NOI_KHOA_TUAN_HOAN>Mỏm tim đập KLS V đường giữa đòn trái\. Nhịp tim đều, T1 T2 rõ\.<\/NOI_KHOA_TUAN_HOAN>/);
    assert.match(xml, /<NOI_KHOA_TIEU_HOA>Bụng mềm, không chướng, gan lách không to\.<\/NOI_KHOA_TIEU_HOA>/);
    assert.match(xml, /<NOI_KHOA_THAN_TN_SD>Hố thận 2 bên không dày\. Chạm thận âm tính\.<\/NOI_KHOA_THAN_TN_SD>/);
    assert.match(xml, /<NOI_KHOA_THAN_KINH>Hiện chưa phát hiện dấu hiệu liệt thần kinh sọ\.<\/NOI_KHOA_THAN_KINH>/);
    assert.match(xml, /<NOI_KHOA_TAM_THAN>Hiện tại chưa phát hiện dấu hiệu bệnh lý tâm thần\.<\/NOI_KHOA_TAM_THAN>/);

    // Verify default "Bình thường" was NOT mistakenly picked
    assert.doesNotMatch(xml, /<NOI_KHOA_HO_HAP>Bình thường<\/NOI_KHOA_HO_HAP>/);
    assert.doesNotMatch(xml, /<NOI_KHOA_TUAN_HOAN>Bình thường<\/NOI_KHOA_TUAN_HOAN>/);
    assert.doesNotMatch(xml, /<NOI_KHOA_THAN_TN_SD>Bình thường<\/NOI_KHOA_THAN_TN_SD>/);
});

test('generateXmlPayload for Minor (Mẫu 2) embeds specialty findings instead of default nhi_* "Bình thường"', () => {
    const master = {
        patient_name: 'TRẦN THỊ BẢO ANH',
        dob: '2010-09-20',
        gender: 'Nữ',
        cccd: '001310054321',
        doc_no: 'KSK-TEST-MINOR-02',
        created_at: '2026-09-15T08:00:00Z'
    };

    const clinical = {
        clinical_exam: {
            kq_ho_hap: 'Phổi thông khí đều 2 bên, không rale.',
            nhi_ho_hap: 'Bình thường',
            kq_tim_mach: 'Tim nhịp đều 82 ck/phút, không âm bệnh lý.',
            nhi_tuan_hoan: 'Bình thường',
            noi_khoa_tieu_hoa: 'Bụng mềm, không điểm đau khu trú.',
            nhi_tieu_hoa: 'Bình thường',
            kq_tiet_nieu: 'Tiểu tiện bình thường, thận không to.',
            nhi_tiet_nieu: 'Bình thường',
            kq_than_kinh: 'Tri giác tốt, 12 đôi dây TK sọ bình thường.',
            nhi_than_kinh: 'Bình thường',
            kq_tam_than: 'Tâm lý phát triển bình thường theo lứa tuổi.',
            nhi_tam_than: 'Bình thường'
        }
    };

    const lab = {};
    const conclusion = {
        fitness_class: '1',
        diagnosis: 'Đủ sức khỏe học tập'
    };

    const xml = generateXmlPayload('2', master, clinical, lab, conclusion);

    // Verify correct XML TYPE
    assert.match(xml, /<TYPE>Minor<\/TYPE>/);

    // Verify specialty clinical exam fields are used in Minor tags
    assert.match(xml, /<NHI_KHOA_HO_HAP>Phổi thông khí đều 2 bên, không rale\.<\/NHI_KHOA_HO_HAP>/);
    assert.match(xml, /<NHI_KHOA_TUAN_HOAN>Tim nhịp đều 82 ck\/phút, không âm bệnh lý\.<\/NHI_KHOA_TUAN_HOAN>/);
    assert.match(xml, /<NHI_KHOA_TIEU_HOA>Bụng mềm, không điểm đau khu trú\.<\/NHI_KHOA_TIEU_HOA>/);
    assert.match(xml, /<NHI_KHOA_THAN_TN_SD>Tiểu tiện bình thường, thận không to\.<\/NHI_KHOA_THAN_TN_SD>/);
    assert.match(xml, /<NHI_KHOA_THAN_KINH>Tri giác tốt, 12 đôi dây TK sọ bình thường\.<\/NHI_KHOA_THAN_KINH>/);
    assert.match(xml, /<NHI_KHOA_TAM_THAN>Tâm lý phát triển bình thường theo lứa tuổi\.<\/NHI_KHOA_TAM_THAN>/);

    // Verify default "Bình thường" was NOT mistakenly picked
    assert.doesNotMatch(xml, /<NHI_KHOA_HO_HAP>Bình thường<\/NHI_KHOA_HO_HAP>/);
    assert.doesNotMatch(xml, /<NHI_KHOA_TUAN_HOAN>Bình thường<\/NHI_KHOA_TUAN_HOAN>/);
});

test('mergeClinicalData and XML generation properly synchronize Tuần hoàn, Hô hấp, Da liễu and overwrite stale aliases', async () => {
    const { mergeClinicalData } = await import('../src/services/health-check-merge.service');

    // Existing state from HIS/DB with old/stale data in alias fields
    const existingDbClinical = {
        clinical_exam: {
            noi_khoa_tuan_hoan: 'Tiếng T1 T2 mờ, nhịp chậm 55 l/p',
            tim_mach: 'Tiếng T1 T2 mờ, nhịp chậm 55 l/p',
            noi_khoa_ho_hap: 'Rale ẩm rải rác đáy phổi',
            ho_hap: 'Rale ẩm rải rác đáy phổi',
            dermatology: 'Viêm da cơ địa dị ứng',
            kham_da_lieu: 'Viêm da cơ địa dị ứng'
        }
    };

    // Incoming action from autofill: sets kq_tim_mach, kq_ho_hap, kq_da_lieu
    const incomingAutofill = {
        clinical_exam: {
            kq_tim_mach: 'Bình thường',
            kq_ho_hap: 'Bình thường',
            kq_da_lieu: 'Da sạch, không sẹo lồi, không nấm ngứa'
        }
    };

    const merged = mergeClinicalData(existingDbClinical, incomingAutofill);

    // 1. Verify all Tuần hoàn aliases are synchronized to 'Bình thường'
    assert.equal(merged.clinical_exam.kq_tim_mach, 'Bình thường');
    assert.equal(merged.clinical_exam.tim_mach, 'Bình thường');
    assert.equal(merged.clinical_exam.noi_khoa_tuan_hoan, 'Bình thường');
    assert.equal(merged.clinical_exam.tuan_hoan, 'Bình thường');
    assert.equal(merged.clinical_exam.circulatory, 'Bình thường');

    // 2. Verify all Hô hấp aliases are synchronized to 'Bình thường'
    assert.equal(merged.clinical_exam.kq_ho_hap, 'Bình thường');
    assert.equal(merged.clinical_exam.ho_hap, 'Bình thường');
    assert.equal(merged.clinical_exam.noi_khoa_ho_hap, 'Bình thường');
    assert.equal(merged.clinical_exam.respiratory, 'Bình thường');
    assert.equal(merged.clinical_exam.kq_lam_sang_ho_hap, 'Bình thường');

    // 3. Verify all Da liễu aliases are synchronized to 'Da sạch, không sẹo lồi, không nấm ngứa'
    assert.equal(merged.clinical_exam.kq_da_lieu, 'Da sạch, không sẹo lồi, không nấm ngứa');
    assert.equal(merged.clinical_exam.dermatology, 'Da sạch, không sẹo lồi, không nấm ngứa');
    assert.equal(merged.clinical_exam.kham_da_lieu, 'Da sạch, không sẹo lồi, không nấm ngứa');
    assert.equal(merged.clinical_exam.da_lieu, 'Da sạch, không sẹo lồi, không nấm ngứa');

    // 4. Verify findValue for XML generation produces consistent values
    assert.equal(findValue('NOI_KHOA_TUAN_HOAN', merged), 'Bình thường');
    assert.equal(findValue('NOI_KHOA_HO_HAP', merged), 'Bình thường');
    assert.equal(findValue('DA_LIEU', merged), 'Da sạch, không sẹo lồi, không nấm ngứa');
});


import { query, transaction } from '../src/config/database';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';

async function seed10TestPatients() {
    console.log('🚀 Đang khởi tạo 10 bệnh nhân mẫu cho Module Khám sức khỏe...');

    const timestamp = Date.now().toString().slice(-4);
    const today = new Date().toISOString().slice(0, 10);

    const testPatients = [
        {
            patient_id: `900101${timestamp}`,
            patient_name: 'NGUYỄN VĂN AN',
            cccd: `037095001${timestamp}`,
            dob: '1995-05-12',
            gender: 'Nam',
            doc_no: `KSK-2026-901${timestamp}`,
            his_doc_no: `26001${timestamp}`,
            form_type: '3',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'signed',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '172',
                weight: '68',
                bmi: '23.0',
                blood_pressure: '120/80',
                pulse: '76',
                temperature: '36.6',
                respiration: '18',
                kham_the_luc_pl: '1',
                noi_khoa_tuan_hoan: 'Tim đều, T1 T2 rõ, không tiếng thổi bệnh lý',
                noi_khoa_ho_hap: 'Rì rào phế nang êm dịu 2 phế trường, không rale',
                noi_khoa_tieu_hoa: 'Bụng mềm, không chướng, gan lách không to',
                kham_mat: 'Thị lực 10/10 hai mắt, không tật khúc xạ',
                kham_tai_mui_hong: 'Tai màng nhĩ sáng, mũi thông, họng sạch',
                kham_rang_ham_mat: 'Răng đều tốt, không sâu răng',
                kham_ngoai_khoa: 'Cơ xương khớp bình thường, vận động tốt',
                kham_da_lieu: 'Da niêm mạc hồng hào, không tổn thương',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '1',
                tsgd_ma_benh: 'I10',
                tsbt_mac_benh: '0',
                tsbt_dang_dieu_tri_benh: '0',
                tsbt_benh_tim: '0',
                tsbt_tang_huyet_ap: '0',
                tsbt_dai_thao_duong: '0'
            },
            lab: {
                blood_test: { hemoglobin: '145', glycemia: '5.1', chi_so_hc: '4.8', chi_so_bach_cau: '6.5', chi_so_tieu_cau: '230' },
                urine_test: { protein: 'Âm tính', duong: 'Âm tính' },
                imaging: { ket_qua: 'Hình ảnh tim phổi trong giới hạn bình thường' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích tế bào máu ngoại vi', value: 'Bình thường', unit: 'Lần', description: 'Các chỉ số HC, BC, TC bình thường', conclusion: 'Bình thường' },
                    { service_code: 'B1100468', index_code: 'B1100468', service_name: 'Định lượng Glucose máu', value: '5.1', unit: 'mmol/L', description: 'Đường huyết lúc đói', conclusion: 'Bình thường' },
                    { service_code: 'B1100469', index_code: 'B1100469', service_name: 'Chụp X-quang ngực thẳng', value: 'Bình thường', unit: 'Lần', description: 'Phế trường sáng đều', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ sức khỏe công tác và học tập',
                doctor_name: 'BS.CKI Nguyễn Văn Hùng',
                doctor_id: 'bs_hung'
            }
        },
        {
            patient_id: `900102${timestamp}`,
            patient_name: 'TRẦN THỊ MAI',
            cccd: `037198002${timestamp}`,
            dob: '1998-09-20',
            gender: 'Nữ',
            doc_no: `KSK-2026-902${timestamp}`,
            his_doc_no: `26002${timestamp}`,
            form_type: '3',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'unsigned',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '160',
                weight: '50',
                bmi: '19.5',
                blood_pressure: '110/70',
                pulse: '78',
                temperature: '36.5',
                respiration: '18',
                kham_the_luc_pl: '1',
                noi_khoa_tuan_hoan: 'Bình thường',
                noi_khoa_ho_hap: 'Bình thường',
                kham_san_phu_khoa: 'Cơ quan sinh dục ngoài bình thường',
                kham_mat: 'Mắt phải 10/10, Mắt trái 10/10',
                kham_tai_mui_hong: 'Bình thường',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '0',
                tsbt_mac_benh: '0',
                tsbt_dang_dieu_tri_benh: '0'
            },
            lab: {
                blood_test: { hemoglobin: '128', glycemia: '4.8' },
                urine_test: { protein: 'Âm tính' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích máu', value: '128 g/L', unit: 'g/L', description: 'Hemoglobin bình thường', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ điều kiện sức khỏe làm việc',
                doctor_name: 'BS. Lê Thị Nga',
                doctor_id: 'bs_nga'
            }
        },
        {
            patient_id: `900103${timestamp}`,
            patient_name: 'LÊ VĂN BÌNH',
            cccd: `037088003${timestamp}`,
            dob: '1988-11-03',
            gender: 'Nam',
            doc_no: `KSK-2026-903${timestamp}`,
            his_doc_no: `26003${timestamp}`,
            form_type: 'driver',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'signed',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '168',
                weight: '65',
                bmi: '23.0',
                blood_pressure: '125/80',
                pulse: '80',
                temperature: '36.7',
                respiration: '19',
                kham_the_luc_pl: '1',
                noi_khoa_tam_than: 'Bình thường, tâm thần ổn định',
                noi_khoa_than_kinh: 'Phản xạ gân xương bình thường, không run tay',
                khong_kinh_hai_mat: '10/10',
                thi_truong_ngang_haimat: 'Bình thường',
                thi_truong_dung_haimat: 'Bình thường',
                sac_giac: 'Bình thường, nhận biết tốt 3 màu cơ bản',
                tai_trai_noi_thuong: '5m',
                tai_phai_noi_thuong: '5m',
                hang_lai_xe: 'B2',
                kq_xn_ma_tuy: 'Âm tính (4 loại ma túy)',
                ket_qua_xn_nong_do_con: '0.0 mg/L',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsbt_tai_bien: '0',
                tsbt_mat_y_thuc: '0',
                tsbt_roi_loan_giac_ngu: '0',
                tsbt_ma_tuy: '0',
                tsbt_ruou_thuong_xuyen: '0'
            },
            lab: {
                kq_xn_ma_tuy: 'Âm tính',
                nong_do_con_mau: '0.0',
                paraclinical_items: [
                    { service_code: 'XN_MATUY_01', index_code: 'MT01', service_name: 'Xét nghiệm ma túy (Morphin/Heroin/Amphetamine/THC)', value: 'Âm tính', unit: 'Test', description: 'Âm tính', conclusion: 'Bình thường' },
                    { service_code: 'XN_CON_01', index_code: 'CON01', service_name: 'Xét nghiệm nồng độ cồn trong máu', value: '0.0', unit: 'mg/100ml', description: 'Không phát hiện cồn', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ điều kiện sức khỏe lái xe hạng B2',
                doctor_name: 'BS. Trịnh Quốc Tuấn',
                doctor_id: 'bs_tuan'
            }
        },
        {
            patient_id: `900104${timestamp}`,
            patient_name: 'PHẠM MINH ĐỨC',
            cccd: `037210004${timestamp}`,
            dob: '2010-03-15',
            gender: 'Nam',
            doc_no: `KSK-2026-904${timestamp}`,
            his_doc_no: `26004${timestamp}`,
            form_type: '2',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'unsigned',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '155',
                weight: '44',
                bmi: '18.3',
                blood_pressure: '105/65',
                pulse: '82',
                temperature: '36.5',
                respiration: '20',
                kham_the_luc_pl: '1',
                nhi_khoa_tuan_hoan: 'Tim đều rõ',
                nhi_khoa_ho_hap: 'Phổi thông khí tốt',
                nhi_khoa_tieu_hoa: 'Bụng mềm',
                kham_mat: 'Thị lực 10/10 hai mắt',
                kham_tai_mui_hong: 'Không viêm',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '0',
                tsbt_mac_benh: '0',
                tiem_chung_bcg: '1',
                tiem_chung_vgb: '1',
                tiem_chung_soi: '1'
            },
            lab: {
                blood_test: { hemoglobin: '132' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích máu', value: 'Bình thường', unit: 'Lần', description: 'Bình thường', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ điều kiện sức khỏe học tập',
                doctor_name: 'BS. Vũ Thùy Linh',
                doctor_id: 'bs_linh'
            }
        },
        {
            patient_id: `900105${timestamp}`,
            patient_name: 'BÉ NGUYỄN GIA HÂN',
            cccd: `037322005${timestamp}`,
            dob: '2022-06-10',
            gender: 'Nữ',
            doc_no: `KSK-2026-905${timestamp}`,
            his_doc_no: `26005${timestamp}`,
            form_type: '1',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'signed',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '98',
                weight: '14.5',
                bmi: '15.1',
                blood_pressure: '95/60',
                pulse: '98',
                temperature: '36.8',
                respiration: '24',
                kham_the_luc_pl: '1',
                mau_sac_da: '0',
                long_ban_tay: '0',
                thop: '0',
                hinh_dang_dau: '0',
                van_dong_co: '0',
                vi_tri_hai_mat: '0',
                dap_ung_am_thanh: '0',
                hinh_dang_mieng: '0',
                nghe_phoi: '0',
                tieng_tim: '0',
                gan_lach_to: '0',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                ts_tiep_xuc_lao: '0',
                tiem_chung_bcg: '1',
                tiem_chung_vgb: '1',
                tiem_chung_bh_hg_uv: '1',
                tiem_chung_bai_liet: '1',
                tiem_chung_soi: '1',
                tiem_chung_vnnb_b: '1'
            },
            lab: {
                paraclinical_items: []
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Trẻ phát triển thể lực và tâm thần vận động bình thường theo lứa tuổi',
                doctor_name: 'BS.CKI Hoàng Mỹ Dung',
                doctor_id: 'bs_dung'
            }
        },
        {
            patient_id: `900106${timestamp}`,
            patient_name: 'HOÀNG VĂN THẮNG',
            cccd: `037075006${timestamp}`,
            dob: '1975-01-25',
            gender: 'Nam',
            doc_no: `KSK-2026-906${timestamp}`,
            his_doc_no: `26006${timestamp}`,
            form_type: '3',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'unsigned',
            send_status: 'Unsent',
            barcode_printed: 'N',
            clinical: {
                height: '165',
                weight: '72',
                bmi: '26.4',
                blood_pressure: '135/85',
                pulse: '84',
                temperature: '36.6',
                respiration: '18',
                kham_the_luc_pl: '2',
                noi_khoa_tuan_hoan: 'Tim T1 T2 nghe rõ, huyết áp giai đoạn tiền tăng huyết áp',
                noi_khoa_ho_hap: 'Bình thường',
                noi_khoa_tieu_hoa: 'Bụng hơi béo bè, gan lách không sờ thấy',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '1',
                tsgd_ma_benh: 'E11',
                tsbt_mac_benh: '1',
                tsbt_ma_benh: 'K29',
                tsbt_dang_dieu_tri_benh: '1',
                tsbt_ten_thuoc_lieu_luong: 'Gastro 20mg'
            },
            lab: {
                blood_test: { hemoglobin: '142', glycemia: '5.8', cholesterol: '5.6', triglycerid: '2.1' },
                urine_test: { protein: 'Âm tính' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích tế bào máu', value: '142 g/L', unit: 'g/L', description: 'Bình thường', conclusion: 'Bình thường' },
                    { service_code: 'B1100468', index_code: 'B1100468', service_name: 'Định lượng Glucose máu', value: '5.8', unit: 'mmol/L', description: 'Đường huyết bình thường', conclusion: 'Bình thường' },
                    { service_code: 'B1100470', index_code: 'B1100470', service_name: 'Định lượng Cholesterol toàn phần', value: '5.6', unit: 'mmol/L', description: 'Tăng nhẹ mỡ máu', conclusion: 'Bất thường nhẹ' }
                ]
            },
            conclusion: {
                fitness_class: '2',
                diagnosis: 'Thừa cân độ 1, Tăng mỡ máu nhẹ. Cần điều chỉnh chế độ ăn uống và vận động',
                doctor_name: 'BS.CKI Nguyễn Văn Hùng',
                doctor_id: 'bs_hung'
            }
        },
        {
            patient_id: `900107${timestamp}`,
            patient_name: 'ĐỖ THỊ NGỌC ÁNH',
            cccd: `037192007${timestamp}`,
            dob: '1992-04-18',
            gender: 'Nữ',
            doc_no: `KSK-2026-907${timestamp}`,
            his_doc_no: `26007${timestamp}`,
            form_type: '3',
            contract_id: null,
            exam_status: 'InProgress',
            signature_status: 'unsigned',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '158',
                weight: '48',
                bmi: '19.2',
                blood_pressure: '110/70',
                pulse: '75',
                temperature: '36.5',
                respiration: '18',
                kham_the_luc_pl: '1',
                noi_khoa_tuan_hoan: 'Đã khám - Bình thường',
                noi_khoa_ho_hap: 'Đã khám - Bình thường',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '0',
                tsbt_mac_benh: '0'
            },
            lab: {
                blood_test: { hemoglobin: '125', glycemia: '4.9' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích tế bào máu', value: '', unit: 'Lần', description: '', conclusion: '' }
                ]
            },
            conclusion: {
                fitness_class: '',
                diagnosis: '',
                doctor_name: '',
                doctor_id: ''
            }
        },
        {
            patient_id: `900108${timestamp}`,
            patient_name: 'VŨ ĐÌNH TRỌNG',
            cccd: `037083008${timestamp}`,
            dob: '1983-08-30',
            gender: 'Nam',
            doc_no: `KSK-2026-908${timestamp}`,
            his_doc_no: `26008${timestamp}`,
            form_type: 'driver',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'signed',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '170',
                weight: '70',
                bmi: '24.2',
                blood_pressure: '120/80',
                pulse: '78',
                temperature: '36.6',
                respiration: '18',
                kham_the_luc_pl: '1',
                noi_khoa_tam_than: 'Bình thường',
                noi_khoa_than_kinh: 'Bình thường',
                khong_kinh_hai_mat: '10/10',
                sac_giac: 'Bình thường',
                hang_lai_xe: 'C',
                kq_xn_ma_tuy: 'Âm tính',
                ket_qua_xn_nong_do_con: '0.0 mg/L',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsbt_tai_bien: '0',
                tsbt_ma_tuy: '0',
                tsbt_ruou_thuong_xuyen: '0'
            },
            lab: {
                kq_xn_ma_tuy: 'Âm tính',
                nong_do_con_mau: '0.0',
                paraclinical_items: [
                    { service_code: 'XN_MATUY_01', index_code: 'MT01', service_name: 'Xét nghiệm ma túy 4 chất', value: 'Âm tính', unit: 'Test', description: 'Âm tính', conclusion: 'Bình thường' },
                    { service_code: 'XN_CON_01', index_code: 'CON01', service_name: 'Xét nghiệm nồng độ cồn', value: '0.0', unit: 'mg/100ml', description: '0.0', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ điều kiện sức khỏe lái xe hạng C',
                doctor_name: 'BS. Trịnh Quốc Tuấn',
                doctor_id: 'bs_tuan'
            }
        },
        {
            patient_id: `900109${timestamp}`,
            patient_name: 'BÙI THỊ HƯƠNG',
            cccd: `037199009${timestamp}`,
            dob: '1999-12-05',
            gender: 'Nữ',
            doc_no: `KSK-2026-909${timestamp}`,
            his_doc_no: `26009${timestamp}`,
            form_type: '3',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'signed',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '162',
                weight: '52',
                bmi: '19.8',
                blood_pressure: '115/75',
                pulse: '76',
                temperature: '36.5',
                respiration: '18',
                kham_the_luc_pl: '1',
                noi_khoa_tuan_hoan: 'Bình thường',
                noi_khoa_ho_hap: 'Bình thường',
                kham_mat: '10/10 hai mắt',
                kham_tai_mui_hong: 'Bình thường',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '0',
                tsbt_mac_benh: '0'
            },
            lab: {
                blood_test: { hemoglobin: '130', glycemia: '4.7' },
                urine_test: { protein: 'Âm tính' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích tế bào máu', value: '130 g/L', unit: 'g/L', description: 'Bình thường', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ điều kiện sức khỏe làm việc',
                doctor_name: 'BS. Lê Thị Nga',
                doctor_id: 'bs_nga'
            }
        },
        {
            patient_id: `900110${timestamp}`,
            patient_name: 'ĐẶNG TIẾN DŨNG',
            cccd: `037090010${timestamp}`,
            dob: '1990-07-14',
            gender: 'Nam',
            doc_no: `KSK-2026-910${timestamp}`,
            his_doc_no: `26010${timestamp}`,
            form_type: '3',
            contract_id: null,
            exam_status: 'Done',
            signature_status: 'signed',
            send_status: 'Unsent',
            barcode_printed: 'Y',
            clinical: {
                height: '175',
                weight: '72',
                bmi: '23.5',
                blood_pressure: '120/80',
                pulse: '74',
                temperature: '36.6',
                respiration: '18',
                kham_the_luc_pl: '1',
                noi_khoa_tuan_hoan: 'Bình thường',
                noi_khoa_ho_hap: 'Bình thường',
                kham_mat: '10/10 hai mắt',
                kham_tai_mui_hong: 'Bình thường',
                funding_source: '9',
                target_group: '14'
            },
            history: {
                tsgd_mac_benh: '0',
                tsbt_mac_benh: '0'
            },
            lab: {
                blood_test: { hemoglobin: '150', glycemia: '5.2' },
                urine_test: { protein: 'Âm tính' },
                imaging: { ket_qua: 'Tim phổi bình thường' },
                paraclinical_items: [
                    { service_code: 'B1100467', index_code: 'B1100467', service_name: 'Tổng phân tích tế bào máu ngoại vi', value: '150 g/L', unit: 'g/L', description: 'Bình thường', conclusion: 'Bình thường' },
                    { service_code: 'B1100468', index_code: 'B1100468', service_name: 'Định lượng Glucose máu', value: '5.2', unit: 'mmol/L', description: 'Bình thường', conclusion: 'Bình thường' }
                ]
            },
            conclusion: {
                fitness_class: '1',
                diagnosis: 'Đủ điều kiện sức khỏe công tác',
                doctor_name: 'BS.CKI Nguyễn Văn Hùng',
                doctor_id: 'bs_hung'
            }
        }
    ];

    let count = 0;
    for (const p of testPatients) {
        try {
            await transaction(async (client) => {
                await client.query(`DELETE FROM health_check_masters WHERE doc_no = $1 OR cccd = $2`, [p.doc_no, p.cccd]);

                const clinicalData = { ...p.clinical, history_data: p.history };
                const labData = p.lab;
                const conclusionData = p.conclusion;

                const generatedXml = generateXmlPayload(
                    p.form_type,
                    {
                        patient_id: p.patient_id,
                        patient_name: p.patient_name,
                        cccd: p.cccd,
                        dob: p.dob,
                        gender: p.gender,
                        doc_no: p.doc_no,
                        matinh_cu_tru: '237',
                        maxa_cu_tru: '23713348',
                        created_at: new Date().toISOString()
                    },
                    clinicalData,
                    labData,
                    conclusionData
                );

                const masterRes = await client.query(`
                    INSERT INTO health_check_masters (
                        patient_id, patient_name, cccd, dob, gender, 
                        doc_no, his_doc_no, form_type, 
                        signature_status, send_status, barcode_printed,
                        xml_data, created_by, created_by_name, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, 
                        $6, $7, $8, 
                        $9, $10, $11,
                        $12, 'admin', 'Quản trị hệ thống', NOW(), NOW()
                    ) RETURNING id
                `, [
                    p.patient_id, p.patient_name, p.cccd, p.dob, p.gender,
                    p.doc_no, p.his_doc_no, p.form_type,
                    p.signature_status, p.send_status, p.barcode_printed,
                    generatedXml
                ]);

                const masterId = masterRes.rows[0].id;

                await client.query(`
                    INSERT INTO health_check_details (
                        master_id, clinical_data, lab_data, conclusion_data, created_at, updated_at
                    ) VALUES (
                        $1, $2::jsonb, $3::jsonb, $4::jsonb, NOW(), NOW()
                    )
                `, [
                    masterId,
                    JSON.stringify(clinicalData),
                    JSON.stringify(labData),
                    JSON.stringify(conclusionData)
                ]);

                count++;
                console.log(` ✅ Đã tạo hồ sơ: [${p.doc_no}] - ${p.patient_name} (Mẫu ${p.form_type})`);
            });
        } catch (err) {
            console.error(` ❌ Lỗi khi tạo BN ${p.patient_name}:`, err);
        }
    }

    console.log(`\n🎉 Hoàn thành tạo ${count}/10 bệnh nhân mẫu thành công!`);
    process.exit(0);
}

seed10TestPatients();

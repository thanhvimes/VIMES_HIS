// ==================== PRINTABLE FORM VIEW ====================
// File: modules/health-check-sync/forms/PrintForm.tsx

import React from 'react';
import { createPortal } from 'react-dom';
import { useSystemStore } from '../../../stores/useSystemStore';

interface PrintFormProps {
    document: any;
    onClose: () => void;
}

const PrintForm: React.FC<PrintFormProps> = ({ document, onClose }) => {
    const { hospitalName, parentOrg, fetchBrandingSettings, brandingLoaded } = useSystemStore();

    // Create portal container directly under document.body to avoid parent layout overflow hidden constraints
    const [portalContainer] = React.useState(() => {
        const div = window.document.createElement('div');
        div.className = 'print-portal-container';
        return div;
    });

    React.useEffect(() => {
        window.document.body.appendChild(portalContainer);
        return () => {
            window.document.body.removeChild(portalContainer);
        };
    }, [portalContainer]);

    React.useEffect(() => {
        if (!brandingLoaded) {
            fetchBrandingSettings();
        }
    }, [brandingLoaded, fetchBrandingSettings]);

    const handlePrint = () => {
        window.print();
    };

    if (!document) return null;

    const getFormTitle = (type: string) => {
        const names: Record<string, string> = {
            '1': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (TRẺ EM 6 - 18 TUỔI)',
            '2': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (NGƯỜI TRÊN 18 TUỔI)',
            '3': 'SỔ KHÁM SỨC KHỎE CHO NGƯỜI LÁI XE',
            '4': 'GIẤY KHÁM SỨC KHỎE NHÂN VIÊN ĐƯỜNG SẮT',
            '5': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ CHO THUYỀN VIÊN',
            '6': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ TRÊN 0 - 2 THÁNG',
            '7': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 2 - 3 THÁNG',
            '8': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 4 - 6 THÁNG',
            '9': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 7 - 9 THÁNG',
            '10': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 10 - 12 THÁNG',
            '11': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 13 - 18 THÁNG',
            '12': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 19 - 24 THÁNG',
            '13': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 2 - 6 TUỔI',
            '14': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH 3 THÁNG - 6 TUỔI',
            '15': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH LỚP 1 - LỚP 5',
            '16': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH LỚP 6 - LỚP 9',
            '17': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH LỚP 10 - LỚP 12',
        };
        return names[type] || `GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (MẪU ${type})`;
    };

    const clinical = document.clinical_data || {};
    const clinicalExam = clinical.clinical_exam || {};
    const extra = clinical.extra || {};
    const lab = document.lab_data || {};
    const conclusion = document.conclusion_data || {};

    const isChild = parseInt(document.form_type, 10) >= 6 && parseInt(document.form_type, 10) <= 13;
    const isStudent = document.form_type === '1' || (parseInt(document.form_type, 10) >= 14 && parseInt(document.form_type, 10) <= 17);
    const paraclinicalItems = lab.paraclinical_items || [];

    return createPortal(
        <div className="print-wrapper fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 overflow-auto py-8 px-4 print:p-0 print:bg-white select-text">
            <style>{`
                @media screen {
                    .a4-sheet {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 20mm;
                        margin: 0 auto 2rem auto;
                        background: white;
                        color: black;
                        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                        border-radius: 4px;
                    }
                }
                @media print {
                    /* Completely hide the main application shell from printing to allow multi-page flow and clear background colors */
                    #root {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        background-color: white !important;
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-portal-container {
                        display: block !important;
                        position: static !important;
                        overflow: visible !important;
                        height: auto !important;
                        width: 100% !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-wrapper {
                        position: static !important;
                        overflow: visible !important;
                        height: auto !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    .a4-sheet {
                        width: 100% !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        background: transparent !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Hide scrollbars on all elements in print mode */
                    * {
                        scrollbar-width: none !important;
                    }
                    *::-webkit-scrollbar {
                        display: none !important;
                    }
                }
                .a4-page-content {
                    font-family: "Times New Roman", Times, serif !important;
                    line-height: 1.5;
                    font-size: 13.5px;
                    color: black;
                    text-rendering: optimizeLegibility !important;
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                    font-variant-ligatures: common-ligatures !important;
                }
                /* Enforce Times New Roman for all children within the document for consistent Vietnamese rendering */
                .a4-page-content, 
                .a4-page-content * {
                    font-family: "Times New Roman", Times, serif !important;
                }
                .a4-table {
                    border-collapse: collapse;
                    width: 100%;
                }
                .a4-table th, .a4-table td {
                    border: 1px solid black !important;
                    padding: 6px 8px;
                    text-align: center;
                }
            `}</style>
            
            {/* Control Panel (Hidden during printing) */}
            <div className="mb-6 max-w-4xl mx-auto p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center print:hidden no-print shadow-sm font-sans">
                <div>
                    <span className="text-sm font-sans font-bold text-slate-800 dark:text-white block">Chế độ xem trước in ấn A4 chuẩn</span>
                    <span className="text-xs font-sans text-slate-500 dark:text-slate-400">Thiết kế theo quy chuẩn QĐ 1551/QĐ-BYT Bộ Y Tế. Đã tối ưu hóa hiển thị phông chữ & dấu tiếng Việt.</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-bold rounded-lg text-slate-700 dark:text-slate-200 font-sans transition">
                        Quay lại
                    </button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition font-sans">
                        In biểu mẫu
                    </button>
                </div>
            </div>

            {/* A4 Content Container */}
            <div className="a4-sheet a4-page-content select-text">
                
                {/* Quốc hiệu tiêu ngữ */}
                <div className="flex justify-between items-start leading-tight mb-8">
                    <div className="text-center w-[330px]">
                        <span className="text-[12px] uppercase block font-normal">{parentOrg || 'SỞ Y TẾ THÀNH PHỐ HÀ NỘI'}</span>
                        <strong className="text-[13px] uppercase block font-bold mt-0.5">{hospitalName || 'PHÒNG KHÁM ĐA KHOA vCLINIC'}</strong>
                        <span className="text-[11px] block mt-0.5">Mã cơ sở: 15124</span>
                        <div className="border-t border-black w-28 mx-auto mt-1.5"></div>
                    </div>
                    <div className="text-center w-[330px]">
                        <strong className="text-[13px] uppercase block font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                        <strong className="text-[12px] block font-bold mt-0.5">Độc lập - Tự do - Hạnh phúc</strong>
                        <div className="border-t border-black w-36 mx-auto mt-1.5"></div>
                    </div>
                </div>

                {/* Tiêu đề chính */}
                <div className="text-center my-6">
                    <h2 className="text-lg font-bold uppercase tracking-wide">{getFormTitle(document.form_type)}</h2>
                    <p className="text-xs italic mt-1">Số hồ sơ liên thông: {document.doc_no}</p>
                </div>

                {/* Phần I: Thông tin hành chính */}
                <div className="space-y-1.5 mb-6">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-3 text-[14px]">I. THÔNG TIN HÀNH CHÍNH</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13.5px]">
                        <div>Họ và tên: <strong className="uppercase">{document.patient_name}</strong></div>
                        <div>Số định danh (CCCD/HC): <strong>{document.cccd || '................................'}</strong></div>
                        <div>Ngày sinh: <strong>{document.dob ? new Date(document.dob).toLocaleDateString('vi-VN') : '.../../....'}</strong></div>
                        <div>Giới tính: <strong>{document.gender}</strong></div>
                        <div>Dân tộc: <strong>{clinical.ethnic === '01' ? 'Kinh' : 'Khác'}</strong></div>
                        <div>Số điện thoại: <strong>{clinical.phone || '................................'}</strong></div>
                        <div className="col-span-2">Địa chỉ thường trú: <strong>{clinical.address || '................................................................'}</strong></div>
                        <div>Nhóm máu: <strong>{clinical.blood_group || 'O'}</strong></div>
                        <div>Lượt khám: <strong>{document.doc_no}</strong></div>
                    </div>

                    {/* Đặc thù mẫu biểu */}
                    {(isStudent || isChild || document.form_type === '3' || document.form_type === '4' || document.form_type === '5') && (
                        <div className="mt-3 p-3 border border-black grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                            {isStudent && (
                                <>
                                    <div>Người giám hộ: <strong>{extra.nguoi_giam_ho || 'N/A'}</strong></div>
                                    <div>CCCD người giám hộ: <strong>{extra.so_cccd_ngh || 'N/A'}</strong></div>
                                </>
                            )}
                            {isChild && (
                                <>
                                    <div>Người đi cùng trẻ: <strong>{extra.ho_ten_nguoi_di_cung || 'N/A'}</strong></div>
                                    <div>CCCD người đi cùng: <strong>{extra.so_cccd_nguoi_di_cung || 'N/A'}</strong></div>
                                    <div className="col-span-2">Quan hệ: <strong>{extra.moi_quan_he_voi_tre === '1' ? 'Cha' : extra.moi_quan_he_voi_tre === '2' ? 'Mẹ' : 'Khác'}</strong></div>
                                </>
                            )}
                            {document.form_type === '3' && (
                                <div className="col-span-2">Đề nghị khám sức khỏe lái xe hạng: <strong>{extra.hang_lai_xe || 'B2'}</strong></div>
                            )}
                            {document.form_type === '4' && (
                                <>
                                    <div>Chức danh: <strong>{extra.chuc_danh || 'N/A'}</strong></div>
                                    <div>Nơi công tác: <strong>{extra.noi_cong_tac || 'N/A'}</strong></div>
                                    <div className="col-span-2">Đạt chuẩn chạy tàu: <strong>{extra.railway_fit === '1' ? 'Đủ điều kiện' : 'Không đủ điều kiện'}</strong></div>
                                </>
                            )}
                            {document.form_type === '5' && (
                                <>
                                    <div>Vị trí làm việc: <strong>{extra.vi_tri_lam_viec || 'N/A'}</strong></div>
                                    <div>Bộ phận: <strong>{extra.bo_phan_lam_viec || 'N/A'}</strong></div>
                                    <div className="col-span-2">Khả năng đi biển / Chịu sóng: <strong>{extra.offshore_exp === '1' ? 'Đạt' : 'Không đạt'}</strong></div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Phần II: Tiền sử bệnh */}
                <div className="space-y-1.5 mb-6">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-3 text-[14px]">II. TIỀN SỬ BỆNH VÀ TIÊM CHỦNG</h3>
                    {document.form_type === '3' ? (
                        <div className="text-[13.5px]">
                            <span className="font-bold">Tiền sử bệnh lái xe:</span>{' '}
                            <strong>
                                {[
                                    extra.ts_than_kinh_chan_thuong_dau ? 'Chấn thương đầu' : '',
                                    extra.ts_benh_mat_giam_thi_luc ? 'Bệnh mắt' : '',
                                    extra.ts_benh_tai_giam_nghe ? 'Bệnh tai thính lực' : '',
                                    extra.ts_benh_tim_mach ? 'Bệnh tim mạch' : '',
                                    extra.ts_tang_huyet_ap ? 'Tăng huyết áp' : '',
                                    extra.ts_dai_thao_duong ? 'Đái tháo đường' : '',
                                    extra.ts_benh_tam_than ? 'Bệnh tâm thần' : ''
                                ].filter(Boolean).join(', ') || 'Không phát hiện bất thường trong 5 năm qua'}
                            </strong>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13.5px]">
                            <div>Tiêm chủng BCG (Lao): <strong>{extra.tiem_chung_bcg === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                            <div>Tiêm chủng Sởi: <strong>{extra.tiem_chung_soi === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                            <div>Tiêm chủng Bại liệt: <strong>{extra.tiem_chung_bai_liet === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                            <div>Viêm gan B: <strong>{extra.tiem_chung_vgb === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                        </div>
                    )}
                    <div className="mt-2 text-[13.5px] space-y-1">
                        <div>Tiền sử bệnh gia đình: <strong>{extra.tsgd_mac_benh === '1' ? `Có tiền sử bệnh bẩm sinh/truyền nhiễm (Mã ICD: ${extra.tsgd_ma_benh || 'N/A'})` : 'Không phát hiện bất thường'}</strong></div>
                        <div>Tiền sử bệnh bản thân: <strong>{extra.tsbt_ma_benh ? `Đang theo dõi bệnh mã ICD: ${extra.tsbt_ma_benh} (Phát hiện năm ${extra.tsbt_nam_phat_hien_benh || 'N/A'})` : 'Không có tiền sử bệnh mãn tính'}</strong></div>
                    </div>
                </div>

                {/* Phần III: Kết quả thể lực */}
                <div className="space-y-2 mb-6">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-3 text-[14px]">III. KẾT QUẢ KHÁM THỂ LỰC</h3>
                    <table className="a4-table text-[13px] mt-2">
                        <thead>
                            <tr className="bg-slate-100 font-bold">
                                <th className="py-2">Chiều cao</th>
                                <th className="py-2">Cân nặng</th>
                                <th className="py-2">BMI</th>
                                <th className="py-2">Mạch</th>
                                <th className="py-2">Huyết áp</th>
                                {isChild && (
                                    <>
                                        <th className="py-2">Vòng đầu</th>
                                        <th className="py-2">Vòng ngực</th>
                                    </>
                                )}
                                {document.form_type === '5' && (
                                    <>
                                        <th className="py-2">Lực bóp tay</th>
                                        <th className="py-2">Lực kéo lưng</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-medium">
                                <td className="py-2">{clinical.examination?.height || '...'} cm</td>
                                <td className="py-2">{clinical.examination?.weight || '...'} kg</td>
                                <td className="py-2 font-bold">{clinical.examination?.bmi || '...'}</td>
                                <td className="py-2">{clinical.examination?.pulse || '...'} lần/phút</td>
                                <td className="py-2">{clinical.examination?.blood_pressure || '...'} mmHg</td>
                                {isChild && (
                                    <>
                                        <td className="py-2">{extra.vong_ddau || 'N/A'} cm</td>
                                        <td className="py-2">{extra.vong_nguc || 'N/A'} cm</td>
                                    </>
                                )}
                                {document.form_type === '5' && (
                                    <>
                                        <td className="py-2">{extra.luc_bop_tay_thuan || 'N/A'} / {extra.luc_bop_tay_khong_thuan || 'N/A'} kg</td>
                                        <td className="py-2">{extra.luc_keo_lung || 'N/A'} kg</td>
                                    </>
                                )}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Phần IV: Khám lâm sàng */}
                <div className="space-y-2 mb-6">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-3 text-[14px]">IV. KẾT QUẢ KHÁM LÂM SÀNG</h3>
                    {isChild ? (
                        <table className="a4-table text-[13px] mt-2">
                            <thead>
                                <tr className="bg-slate-100 font-bold">
                                    <th className="w-12 py-1.5">STT</th>
                                    <th className="text-left px-3 py-1.5">Nội dung khám</th>
                                    <th className="px-3 py-1.5">Kết quả khám</th>
                                    <th className="w-36 py-1.5">Bác sĩ khám</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-1.5">1</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Khám tuần hoàn</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.nhi_tuan_hoan || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">2</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Khám hô hấp</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.nhi_ho_hap || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">3</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Khám tiêu hóa</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.nhi_tieu_hoa || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">4</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Thần kinh - Tâm thần</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.nhi_than_kinh || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">5</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Mốc phát triển tinh thần vận động</td>
                                    <td className="px-3 py-1.5 text-left">{extra.milestone_check === '1' ? 'Đạt' : 'Cần theo dõi sát'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <table className="a4-table text-[13px] mt-2">
                            <thead>
                                <tr className="bg-slate-100 font-bold">
                                    <th className="w-12 py-1.5">STT</th>
                                    <th className="text-left px-3 py-1.5">Nội dung khám</th>
                                    <th className="px-3 py-1.5">Kết quả khám</th>
                                    <th className="w-36 py-1.5">Bác sĩ khám</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-1.5">1</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Nội khoa (Tuần hoàn, Hô hấp, Tiêu hóa)</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.internal || 'Bình thường, tim phổi tốt'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">2</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Khám mắt (Thị lực)</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.eye || 'Mắt phải 10/10, Mắt trái 10/10'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">3</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Khám tai - mũi - họng (Thính lực)</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.ent || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">4</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Khám răng - hàm - mặt</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.dental || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">5</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Ngoại khoa &amp; Da liễu</td>
                                    <td className="px-3 py-1.5 text-left">{clinicalExam.external || 'Bình thường'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                {document.gender === 'Nữ' && (
                                    <tr>
                                        <td className="py-1.5">6</td>
                                        <td className="text-left px-3 py-1.5 font-bold">Khám sản phụ khoa (Nữ)</td>
                                        <td className="px-3 py-1.5 text-left">{clinicalExam.gynecology || 'Bình thường'}</td>
                                        <td className="py-1.5"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Phần V: Cận lâm sàng */}
                <div className="space-y-2 mb-6">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-3 text-[14px]">V. KẾT QUẢ CẬN LÂM SÀNG</h3>
                    {paraclinicalItems.length === 0 ? (
                        <table className="a4-table text-[13px] mt-2">
                            <thead>
                                <tr className="bg-slate-100 font-bold">
                                    <th className="w-12 py-1.5">STT</th>
                                    <th className="text-left px-3 py-1.5">Nội dung khám / Xét nghiệm</th>
                                    <th className="px-3 py-1.5">Kết quả</th>
                                    <th className="w-36 py-1.5">Bác sĩ khám</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-1.5">1</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Hemoglobin (Huyết sắc tố)</td>
                                    <td className="px-3 py-1.5 text-center font-bold">{lab.blood_test?.hemoglobin || '140'} g/L</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">2</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Đường huyết (Glycemia)</td>
                                    <td className="px-3 py-1.5 text-center font-bold">{lab.blood_test?.glycemia || '5.2'} mmol/L</td>
                                    <td className="py-1.5"></td>
                                </tr>
                                <tr>
                                    <td className="py-1.5">3</td>
                                    <td className="text-left px-3 py-1.5 font-bold">Protein niệu (Nước tiểu)</td>
                                    <td className="px-3 py-1.5 text-center font-bold">{lab.urine_test?.protein || 'Âm tính'}</td>
                                    <td className="py-1.5"></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="space-y-4">
                            {/* Group XN: Xét nghiệm */}
                            {paraclinicalItems.some(item => item.type === 'XN') && (
                                <div>
                                    <h4 className="font-bold text-[13px] italic mb-1">1. Các xét nghiệm (Máu, nước tiểu, chất kích thích...)</h4>
                                    <table className="a4-table text-[13px]">
                                        <thead>
                                            <tr className="bg-slate-100 font-bold">
                                                <th className="w-12 py-1">STT</th>
                                                <th className="text-left px-3 py-1">Tên xét nghiệm</th>
                                                <th className="px-3 py-1 w-32">Kết quả</th>
                                                <th className="px-3 py-1 w-24">Đơn vị</th>
                                                <th className="px-3 py-1 w-28">Kết luận</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const cleanSubitem = (sub: any) => (sub || '').trim().toUpperCase();
                                                const filteredAndSorted = paraclinicalItems
                                                    .filter((item: any) => item.type === 'XN')
                                                    .sort((a: any, b: any) => {
                                                        const groupA = a.group_id || '';
                                                        const groupB = b.group_id || '';
                                                        const compareGroup = groupA.localeCompare(groupB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (compareGroup !== 0) return compareGroup;

                                                        const orderA = a.order_id || '';
                                                        const orderB = b.order_id || '';
                                                        const compareOrder = orderA.localeCompare(orderB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (compareOrder !== 0) return compareOrder;

                                                        const pLineA = Number(a.parent_line !== undefined && a.parent_line !== null ? a.parent_line : (a.line_no || 999999));
                                                        const pLineB = Number(b.parent_line !== undefined && b.parent_line !== null ? b.parent_line : (b.line_no || 999999));
                                                        if (pLineA !== pLineB) return pLineA - pLineB;

                                                        const isAsubParent = cleanSubitem(a.subitem) === 'Y';
                                                        const isBsubParent = cleanSubitem(b.subitem) === 'Y';
                                                        const pCodeA = (isAsubParent ? (a.service_code || '') : (a.parent_code || a.service_code || '')).trim();
                                                        const pCodeB = (isBsubParent ? (b.service_code || '') : (b.parent_code || b.service_code || '')).trim();
                                                        const comparePCode = pCodeA.localeCompare(pCodeB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (comparePCode !== 0) return comparePCode;

                                                        const isParentA = isAsubParent ? 0 : 1;
                                                        const isParentB = isBsubParent ? 0 : 1;
                                                        if (isParentA !== isParentB) return isParentA - isParentB;

                                                        const lineA = Number(a.line_no || 999999);
                                                        const lineB = Number(b.line_no || 999999);
                                                        if (lineA !== lineB) return lineA - lineB;

                                                        const nameA = a.service_name || '';
                                                        const nameB = b.service_name || '';
                                                        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                                                    });

                                                const groups: { name: string, items: any[] }[] = [];
                                                filteredAndSorted.forEach((item: any) => {
                                                    const name = item.group_name || 'Chưa phân nhóm';
                                                    let g = groups.find(x => x.name === name);
                                                    if (!g) {
                                                        g = { name, items: [] };
                                                        groups.push(g);
                                                    }
                                                    g.items.push(item);
                                                });

                                                let globalIndex = 0;

                                                return groups.map((g) => {
                                                    let lastParentCode = '';
                                                    return (
                                                        <React.Fragment key={g.name}>
                                                            <tr className="bg-slate-50 font-bold">
                                                                <td colSpan={5} className="text-left px-3 py-1.5 border-y border-slate-300">
                                                                    {g.name === 'Chưa phân nhóm' ? 'Chưa phân nhóm (Dịch vụ tự thêm)' : g.name}
                                                                </td>
                                                            </tr>
                                                            {g.items.flatMap((item: any) => {
                                                                const elements = [];
                                                                const cleanItemSubitem = (item.subitem || '').trim().toUpperCase();
                                                                const isParent = cleanItemSubitem === 'Y';
                                                                const hasParent = item.parent_name && !isParent;
                                                                const currentParentCode = (isParent ? (item.service_code || '') : (hasParent ? (item.parent_code || '') : '')).trim();
                                                                const currentParentName = isParent ? item.service_name : (hasParent ? item.parent_name : '');

                                                                if (currentParentCode && currentParentCode !== lastParentCode) {
                                                                    lastParentCode = currentParentCode;
                                                                    elements.push(
                                                                        <tr key={`parent-${currentParentCode}`} className="bg-sky-50/30 font-bold">
                                                                            <td colSpan={5} className="text-left px-3 py-1.5 border-y border-slate-200">
                                                                                <strong>{currentParentName}</strong>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                }

                                                                if (isParent) {
                                                                    return elements;
                                                                }

                                                                globalIndex++;
                                                                elements.push(
                                                                    <tr key={item.service_code || globalIndex}>
                                                                        <td className="py-1">{globalIndex}</td>
                                                                        <td className="text-left px-3 py-1 font-bold">
                                                                            {hasParent && <span className="text-slate-400 font-mono text-[11px] mr-1.5 pl-4">↳</span>}
                                                                            {item.service_name}
                                                                        </td>
                                                                        <td className="px-3 py-1 text-center font-bold">{item.value}</td>
                                                                        <td className="px-3 py-1 text-center">{item.unit || '-'}</td>
                                                                        <td className="px-3 py-1 text-center">{item.conclusion || 'Bình thường'}</td>
                                                                    </tr>
                                                                );
                                                                return elements;
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Group HA: Chẩn đoán hình ảnh */}
                            {paraclinicalItems.some(item => item.type === 'HA') && (
                                <div>
                                    <h4 className="font-bold text-[13px] italic mb-1">2. Chẩn đoán hình ảnh (X-quang, Siêu âm...)</h4>
                                    <table className="a4-table text-[13px]">
                                        <thead>
                                            <tr className="bg-slate-100 font-bold">
                                                <th className="w-12 py-1">STT</th>
                                                <th className="text-left px-3 py-1">Tên dịch vụ</th>
                                                <th className="px-3 py-1">Mô tả / Kết luận</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const filteredAndSorted = paraclinicalItems
                                                    .filter((item: any) => item.type === 'HA')
                                                    .sort((a: any, b: any) => {
                                                        const groupA = a.group_id || '';
                                                        const groupB = b.group_id || '';
                                                        const compareGroup = groupA.localeCompare(groupB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (compareGroup !== 0) return compareGroup;
                                                        
                                                        const orderA = a.order_id || '';
                                                        const orderB = b.order_id || '';
                                                        const compareOrder = orderA.localeCompare(orderB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (compareOrder !== 0) return compareOrder;

                                                        const nameA = a.service_name || '';
                                                        const nameB = b.service_name || '';
                                                        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                                                    });

                                                const groups: { name: string, items: any[] }[] = [];
                                                filteredAndSorted.forEach((item: any) => {
                                                    const name = item.group_name || 'Chưa phân nhóm';
                                                    let g = groups.find(x => x.name === name);
                                                    if (!g) {
                                                        g = { name, items: [] };
                                                        groups.push(g);
                                                    }
                                                    g.items.push(item);
                                                });

                                                let globalIndex = 0;

                                                return groups.map((g) => (
                                                    <React.Fragment key={g.name}>
                                                        <tr className="bg-slate-50 font-bold">
                                                            <td colSpan={3} className="text-left px-3 py-1.5 border-y border-slate-300">
                                                                {g.name === 'Chưa phân nhóm' ? 'Chưa phân nhóm (Dịch vụ tự thêm)' : g.name}
                                                            </td>
                                                        </tr>
                                                        {g.items.map((item: any) => {
                                                            globalIndex++;
                                                            return (
                                                                <tr key={item.service_code || globalIndex}>
                                                                    <td className="py-1">{globalIndex}</td>
                                                                    <td className="text-left px-3 py-1 font-bold">{item.service_name}</td>
                                                                    <td className="px-3 py-1 text-left">
                                                                        {item.description ? `${item.description}. ` : ''}
                                                                        <strong>{item.conclusion || item.value || 'Chưa phát hiện bất thường'}</strong>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Group TD: Thăm dò chức năng */}
                            {paraclinicalItems.some(item => item.type === 'TD') && (
                                <div>
                                    <h4 className="font-bold text-[13px] italic mb-1">3. Thăm dò chức năng (Điện tim, Chức năng hô hấp...)</h4>
                                    <table className="a4-table text-[13px]">
                                        <thead>
                                            <tr className="bg-slate-100 font-bold">
                                                <th className="w-12 py-1">STT</th>
                                                <th className="text-left px-3 py-1">Tên dịch vụ</th>
                                                <th className="px-3 py-1">Mô tả / Kết luận</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const filteredAndSorted = paraclinicalItems
                                                    .filter((item: any) => item.type === 'TD')
                                                    .sort((a: any, b: any) => {
                                                        const groupA = a.group_id || '';
                                                        const groupB = b.group_id || '';
                                                        const compareGroup = groupA.localeCompare(groupB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (compareGroup !== 0) return compareGroup;
                                                        
                                                        const orderA = a.order_id || '';
                                                        const orderB = b.order_id || '';
                                                        const compareOrder = orderA.localeCompare(orderB, undefined, { numeric: true, sensitivity: 'base' });
                                                        if (compareOrder !== 0) return compareOrder;

                                                        const nameA = a.service_name || '';
                                                        const nameB = b.service_name || '';
                                                        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                                                    });

                                                const groups: { name: string, items: any[] }[] = [];
                                                filteredAndSorted.forEach((item: any) => {
                                                    const name = item.group_name || 'Chưa phân nhóm';
                                                    let g = groups.find(x => x.name === name);
                                                    if (!g) {
                                                        g = { name, items: [] };
                                                        groups.push(g);
                                                    }
                                                    g.items.push(item);
                                                });

                                                let globalIndex = 0;

                                                return groups.map((g) => (
                                                    <React.Fragment key={g.name}>
                                                        <tr className="bg-slate-50 font-bold">
                                                            <td colSpan={3} className="text-left px-3 py-1.5 border-y border-slate-300">
                                                                {g.name === 'Chưa phân nhóm' ? 'Chưa phân nhóm (Dịch vụ tự thêm)' : g.name}
                                                            </td>
                                                        </tr>
                                                        {g.items.map((item: any) => {
                                                            globalIndex++;
                                                            return (
                                                                <tr key={item.service_code || globalIndex}>
                                                                    <td className="py-1">{globalIndex}</td>
                                                                    <td className="text-left px-3 py-1 font-bold">{item.service_name}</td>
                                                                    <td className="px-3 py-1 text-left">
                                                                        {item.description ? `${item.description}. ` : ''}
                                                                        <strong>{item.conclusion || item.value || 'Chưa phát hiện bất thường'}</strong>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Phần VI: Kết luận sức khỏe */}
                <div className="space-y-1.5 mb-8 text-[13.5px]">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-3 text-[14px]">VI. KẾT LUẬN SỨC KHỎE CHUNG</h3>
                    <div>Phân loại sức khỏe chung: <strong className="text-[14px]">Loại {conclusion.fitness_class || 'I'}</strong> (Theo phân loại của Bộ Y tế)</div>
                    <div className="mt-1">Chẩn đoán y khoa / Ghi chú: <strong className="italic text-[14px]">{conclusion.diagnosis || 'Đủ sức khỏe học tập, làm việc'}</strong></div>
                    <div className="mt-1">Các vấn đề cần lưu ý khác: <span className="italic">{conclusion.cac_van_de_luu_y || 'Không'}</span></div>
                </div>

                {/* Phần chữ ký */}
                <div className="flex justify-between items-start mt-12 px-6 text-[13.5px]">
                    <div className="text-center w-48">
                        <strong>NGƯỜI LẬP HỒ SƠ</strong><br/>
                        <span className="italic text-[11px] font-normal">(Ký, ghi rõ họ tên)</span>
                        <div className="h-20"></div>
                        <span className="font-bold text-[12px] text-slate-500 block">Hệ thống vClinic</span>
                    </div>
                    <div className="text-center w-64 flex flex-col items-center">
                        <strong>BÁC SĨ KẾT LUẬN</strong><br/>
                        <span className="italic text-[11px] font-normal">(Ký tên và đóng dấu số)</span>
                        {document.signature_status === 'Signed' ? (
                            <div className="my-3 p-2 border border-green-600 rounded bg-green-50/50 text-[11px] font-bold text-green-700 leading-tight text-left w-full shadow-sm max-w-[240px]">
                                <div className="flex items-center gap-1 mb-1 text-green-800 font-sans">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="font-sans">SIGNED DIGITALLY</span>
                                </div>
                                By: {hospitalName || 'Phòng khám đa khoa vClinic'}<br/>
                                Time: {document.updated_at ? new Date(document.updated_at).toLocaleString('vi-VN') : '2026-06-03'}
                            </div>
                        ) : (
                            <div className="h-20"></div>
                        )}
                        <span className="font-bold text-[14px] mt-1">{conclusion.doctor_name || 'BS. Nguyễn Văn A'}</span>
                    </div>
                </div>
            </div>
        </div>,
        portalContainer
    );
};

export default PrintForm;

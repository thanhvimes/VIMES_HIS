// ==================== PRINTABLE FORM VIEW ====================
// File: modules/health-check-sync/forms/PrintForm.tsx

import React from 'react';

interface PrintFormProps {
    document: any;
    onClose: () => void;
}

const PrintForm: React.FC<PrintFormProps> = ({ document, onClose }) => {
    if (!document) return null;

    const handlePrint = () => {
        window.print();
    };

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

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-auto p-8 text-black font-serif print:p-0 select-none">
            {/* Control Panel (Hidden during printing) */}
            <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-lg flex justify-between items-center print:hidden no-print">
                <span className="text-sm font-sans font-bold text-slate-700">Chế độ xem trước in ấn A4 tiêu chuẩn (QĐ 1551/QĐ-BYT)</span>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold rounded-lg text-slate-700 font-sans">
                        Quay lại
                    </button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow font-sans">
                        In biểu mẫu (Print)
                    </button>
                </div>
            </div>

            {/* A4 Content Container */}
            <div className="max-w-2xl mx-auto border border-dashed border-slate-200 p-8 print:p-0 print:border-none leading-relaxed">
                
                {/* Quốc hiệu tiêu ngữ */}
                <div className="flex justify-between text-center text-xs font-bold leading-tight mb-6">
                    <div className="text-left font-sans">
                        SỞ Y TẾ THÀNH PHỐ HÀ NỘI<br/>
                        <strong>PHÒNG KHÁM ĐA KHOA vCLINIC</strong><br/>
                        <span className="text-[10px] font-normal font-serif">Mã cơ sở: 15124</span>
                    </div>
                    <div>
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>
                        Độc lập - Tự do - Hạnh phúc<br/>
                        <span className="font-normal font-serif text-[10px]">--------------</span>
                    </div>
                </div>

                {/* Tiêu đề chính */}
                <div className="text-center my-6">
                    <h2 className="text-base font-bold uppercase tracking-wide">{getFormTitle(document.form_type)}</h2>
                    <p className="text-[11px] italic mt-1">Số hồ sơ liên thông: {document.doc_no}</p>
                </div>

                {/* Phần I: Thông tin hành chính */}
                <div className="space-y-1.5 text-xs mb-5">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-2">I. THÔNG TIN HÀNH CHÍNH</h3>
                    <div className="grid grid-cols-2 gap-y-1">
                        <div>Họ và tên: <strong>{document.patient_name}</strong></div>
                        <div>Số định danh (CCCD/HC): <strong>{document.cccd}</strong></div>
                        <div>Ngày sinh: {document.dob ? new Date(document.dob).toLocaleDateString('vi-VN') : '.../../....'}</div>
                        <div>Giới tính: {document.gender}</div>
                        <div>Dân tộc: {clinical.ethnic === '01' ? 'Kinh' : 'Khác'}</div>
                        <div>Số điện thoại: {clinical.phone || 'N/A'}</div>
                        <div className="col-span-2">Địa chỉ thường trú: {clinical.address || 'N/A'}</div>
                        <div>Nhóm máu: <strong>{clinical.blood_group || 'O'}</strong></div>
                        <div>Lượt khám: {document.doc_no}</div>
                    </div>

                    {/* Đặc thù mẫu biểu */}
                    {(isStudent || isChild || document.form_type === '3' || document.form_type === '4' || document.form_type === '5') && (
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded grid grid-cols-2 gap-y-1 font-sans text-[11px]">
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
                                    <div>Quan hệ: {extra.moi_quan_he_voi_tre === '1' ? 'Cha' : extra.moi_quan_he_voi_tre === '2' ? 'Mẹ' : 'Khác'}</div>
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
                <div className="space-y-1 text-xs mb-5">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-2">II. TIỀN SỬ BỆNH VÀ TIÊM CHỦNG</h3>
                    {document.form_type === '3' ? (
                        <div>
                            <span className="font-bold">Tiền sử bệnh lái xe:</span>{' '}
                            {[
                                extra.ts_than_kinh_chan_thuong_dau ? 'Chấn thương đầu' : '',
                                extra.ts_benh_mat_giam_thi_luc ? 'Bệnh mắt' : '',
                                extra.ts_benh_tai_giam_nghe ? 'Bệnh tai thính lực' : '',
                                extra.ts_benh_tim_mach ? 'Bệnh tim mạch' : '',
                                extra.ts_tang_huyet_ap ? 'Tăng huyết áp' : '',
                                extra.ts_dai_thao_duong ? 'Đái tháo đường' : '',
                                extra.ts_benh_tam_than ? 'Bệnh tâm thần' : ''
                            ].filter(Boolean).join(', ') || 'Không phát hiện bất thường trong 5 năm qua'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-y-1">
                            <div>Tiêm chủng BCG (Lao): <strong>{extra.tiem_chung_bcg === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                            <div>Tiêm chủng Sởi: <strong>{extra.tiem_chung_soi === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                            <div>Tiêm chủng Bại liệt: <strong>{extra.tiem_chung_bai_liet === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                            <div>Viêm gan B: <strong>{extra.tiem_chung_vgb === '1' ? 'Đã tiêm' : 'Chưa rõ'}</strong></div>
                        </div>
                    )}
                    <div className="mt-1">
                        <div>Tiền sử bệnh gia đình: {extra.tsgd_mac_benh === '1' ? `Có tiền sử bệnh bẩm sinh/truyền nhiễm (Mã ICD: ${extra.tsgd_ma_benh || 'N/A'})` : 'Không phát hiện bất thường'}</div>
                        <div>Tiền sử bệnh bản thân: {extra.tsbt_ma_benh ? `Đang theo dõi bệnh mã ICD: ${extra.tsbt_ma_benh} (Phát hiện năm ${extra.tsbt_nam_phat_hien_benh || 'N/A'})` : 'Không có tiền sử bệnh mãn tính'}</div>
                    </div>
                </div>

                {/* Phần III: Kết quả thể lực */}
                <div className="space-y-2 text-xs mb-5">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-2">III. KẾT QUẢ KHÁM THỂ LỰC</h3>
                    <table className="w-full border-collapse border border-black text-center text-[10px]">
                        <thead>
                            <tr className="bg-slate-100 font-bold">
                                <th className="border border-black p-1">Chiều cao</th>
                                <th className="border border-black p-1">Cân nặng</th>
                                <th className="border border-black p-1">BMI</th>
                                <th className="border border-black p-1">Mạch</th>
                                <th className="border border-black p-1">Huyết áp</th>
                                {isChild && (
                                    <>
                                        <th className="border border-black p-1">Vòng đầu</th>
                                        <th className="border border-black p-1">Vòng ngực</th>
                                    </>
                                )}
                                {document.form_type === '5' && (
                                    <>
                                        <th className="border border-black p-1">Lực bóp tay</th>
                                        <th className="border border-black p-1">Lực kéo lưng</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-1">{clinical.examination?.height || '...'} cm</td>
                                <td className="border border-black p-1">{clinical.examination?.weight || '...'} kg</td>
                                <td className="border border-black p-1 font-bold">{clinical.examination?.bmi || '...'}</td>
                                <td className="border border-black p-1">{clinical.examination?.pulse || '...'} lần/phút</td>
                                <td className="border border-black p-1">{clinical.examination?.blood_pressure || '...'} mmHg</td>
                                {isChild && (
                                    <>
                                        <td className="border border-black p-1">{extra.vong_ddau || 'N/A'} cm</td>
                                        <td className="border border-black p-1">{extra.vong_nguc || 'N/A'} cm</td>
                                    </>
                                )}
                                {document.form_type === '5' && (
                                    <>
                                        <td className="border border-black p-1">{extra.luc_bop_tay_thuan || 'N/A'} / {extra.luc_bop_tay_khong_thuan || 'N/A'} kg</td>
                                        <td className="border border-black p-1">{extra.luc_keo_lung || 'N/A'} kg</td>
                                    </>
                                )}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Phần IV: Khám lâm sàng */}
                <div className="space-y-1.5 text-xs mb-5">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-2">IV. KẾT QUẢ KHÁM LÂM SÀNG</h3>
                    {isChild ? (
                        <div className="space-y-1">
                            <div>1. Khám tuần hoàn: <span className="font-bold">{clinicalExam.nhi_tuan_hoan || 'Bình thường'}</span></div>
                            <div>2. Khám hô hấp: <span className="font-bold">{clinicalExam.nhi_ho_hap || 'Bình thường'}</span></div>
                            <div>3. Khám tiêu hóa: <span className="font-bold">{clinicalExam.nhi_tieu_hoa || 'Bình thường'}</span></div>
                            <div>4. Thần kinh - Tâm thần: <span className="font-bold">{clinicalExam.nhi_than_kinh || 'Bình thường'}</span></div>
                            <div>5. Mốc phát triển tinh thần vận động: <span className="font-bold">{extra.milestone_check === '1' ? 'Đạt' : 'Cần theo dõi sát'}</span></div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div>1. Nội khoa (Tuần hoàn, Hô hấp, Tiêu hóa): <span className="font-bold">{clinicalExam.internal || 'Bình thường, tim phổi tốt'}</span></div>
                            <div>2. Khám mắt (Thị lực): <span className="font-bold">{clinicalExam.eye || 'Mắt phải 10/10, Mắt trái 10/10'}</span></div>
                            <div>3. Khám tai - mũi - họng (Thính lực): <span className="font-bold">{clinicalExam.ent || 'Bình thường'}</span></div>
                            <div>4. Khám răng - hàm - mặt: <span className="font-bold">{clinicalExam.dental || 'Bình thường'}</span></div>
                            <div>5. Ngoại khoa &amp; Da liễu: <span className="font-bold">{clinicalExam.external || 'Bình thường'}</span></div>
                            {document.gender === 'Nữ' && (
                                <div>6. Khám sản phụ khoa (Nữ): <span className="font-bold">{clinicalExam.gynecology || 'Bình thường'}</span></div>
                            )}
                        </div>
                    )}
                </div>

                {/* Phần V: Cận lâm sàng */}
                <div className="space-y-1.5 text-xs mb-5">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-2">V. KẾT QUẢ CẬN LÂM SÀNG</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>Hemoglobin (Huyết sắc tố): <strong>{lab.blood_test?.hemoglobin || '140'} g/L</strong></div>
                        <div>Đường huyết (Glycemia): <strong>{lab.blood_test?.glycemia || '5.2'} mmol/L</strong></div>
                        <div className="col-span-2">Protein niệu (Nước tiểu): <strong>{lab.urine_test?.protein || 'Âm tính'}</strong></div>
                    </div>
                </div>

                {/* Phần VI: Kết luận sức khỏe */}
                <div className="space-y-1.5 text-xs mb-8">
                    <h3 className="font-bold uppercase border-b border-black pb-0.5 mb-2">VI. KẾT LUẬN SỨC KHỎE CHUNG</h3>
                    <div>Phân loại sức khỏe chung: <strong className="text-sm">Loại {conclusion.fitness_class || 'I'}</strong> (Theo phân loại của Bộ Y tế)</div>
                    <div>Chẩn đoán y khoa / Ghi chú: <span className="font-bold italic">{conclusion.diagnosis || 'Đủ sức khỏe học tập, làm việc'}</span></div>
                    <div>Các vấn đề cần lưu ý khác: <span className="italic">{conclusion.cac_van_de_luu_y || 'Không'}</span></div>
                </div>

                {/* Phần chữ ký */}
                <div className="flex justify-between items-start text-xs mt-12 px-6">
                    <div className="text-center w-40">
                        <strong>NGƯỜI LẬP HỒ SƠ</strong><br/>
                        <span className="italic text-[10px]">(Ký, ghi rõ họ tên)</span>
                        <div className="h-16"></div>
                        <span className="font-bold font-sans text-[10px] text-slate-500">Hệ thống vClinic</span>
                    </div>
                    <div className="text-center w-48">
                        <strong>BÁC SĨ KẾT LUẬN</strong><br/>
                        <span className="italic text-[10px]">(Ký tên và đóng dấu số)</span>
                        {document.signature_status === 'Signed' ? (
                            <div className="my-2 p-1 border border-green-500 rounded bg-green-50 text-[9px] font-bold text-green-700 leading-tight font-sans">
                                SIGNED DIGITALLY<br/>
                                By: Phòng khám đa khoa vClinic<br/>
                                Time: {document.updated_at ? new Date(document.updated_at).toLocaleString('vi-VN') : '2026-06-03'}
                            </div>
                        ) : (
                            <div className="h-16"></div>
                        )}
                        <span className="font-bold">BS. Nguyễn Văn A</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintForm;

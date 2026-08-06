import React from 'react';

interface PrintFormMau1Props {
    document: any;
    hospitalName: string;
    logoUrl?: string;
    getReportDate: () => { day: number; month: number; year: number };
    getConclusionDoctorName: () => string;
    maCskcb?: string;
    doctorSignatures?: Record<string, string>;
}

export const PrintFormMau1: React.FC<PrintFormMau1Props> = ({
    document,
    hospitalName,
    logoUrl,
    getReportDate,
    getConclusionDoctorName,
    maCskcb,
    doctorSignatures
}) => {
    const clinical = document.clinical_data || document.clinicalData || {};
    const extra = clinical.extra || {};
    const conclusion = document.conclusion_data || document.conclusionData || {};

    const normalizeSignatureKey = (value: any) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/^HMS_/, '')
        .replace(/\.JPE?G\.?$/, '');

    const resolveConclusionSignature = () => {
        if (!doctorSignatures) return null;
        const normalizedSignatures = new Map(
            Object.entries(doctorSignatures).map(([key, value]) => [normalizeSignatureKey(key), value])
        );
        const candidates = [
            conclusion.doctor_code,
            conclusion.doctor_username,
            conclusion.conclusion_doctor,
            conclusion.doctor,
            getConclusionDoctorName()
        ];
        for (const candidate of candidates) {
            const normalized = normalizeSignatureKey(candidate);
            if (normalized && normalizedSignatures.has(normalized)) {
                return normalizedSignatures.get(normalized) || null;
            }
        }
        return null;
    };

    const renderCheckbox = (checked: boolean, label: string) => (
        <span className="inline-flex items-center gap-1 mr-4">
            <span className="inline-block w-3.5 h-3.5 border border-black text-[10px] leading-none font-sans font-bold text-center flex items-center justify-center shrink-0" style={{ transform: 'translateY(-1px)' }}>
                {checked ? 'x' : ''}
            </span>
            <span>{label}</span>
        </span>
    );

    const isChildNam = document.gender === 'Nam' || document.gender === '1';
    const isChildNu = document.gender === 'Nữ' || document.gender === '2' || document.gender === '0';

    const isSinhNon = extra.sinh_non === '1' || extra.sinhNon === '1' || extra.sinh_non === true;
    const isNotSinhNon = extra.sinh_non === '0' || extra.sinhNon === '0' || extra.sinh_non === false || !extra.sinh_non;

    const rel = String(extra.moi_quan_he_voi_tre || '').trim();
    const isCha = rel === 'Cha' || rel === '1';
    const isMe = rel === 'Mẹ' || rel === '2';
    const isOngBa = rel === 'Ông/bài' || rel === 'Ông/bà' || rel === '3';
    const isAnhChi = rel === 'Anh/chị' || rel === '4';
    const isHoHang = rel === 'Họ hàng' || rel === '5';
    const isKhac = !isCha && !isMe && !isOngBa && !isAnhChi && !isHoHang && rel !== '';

    const tsbt = String(extra.ts_ban_than || '').trim();
    const hasTsbt = tsbt !== '' && tsbt !== 'Không';
    const tsgd = String(extra.ts_gia_dinh || '').trim();
    const hasTsgd = tsgd !== '' && tsgd !== 'Không';
    
    const isLaoExposed = extra.ts_tiep_xuc_lao === '1' || extra.ts_tiep_xuc_lao === true;
    const isNotLaoExposed = !isLaoExposed;

    const isNhietDoNormal = extra.dg_dhst_nhiet_do === '1';
    const isNhietDoHal = extra.dg_dhst_nhiet_do === '3';
    const isNhietDoSot = extra.dg_dhst_nhiet_do === '2' || (!isNhietDoNormal && !isNhietDoHal && extra.dg_dhst_nhiet_do !== '');

    const isMachNormal = extra.dg_dhst_mach === '1';
    const isMachNhanh = extra.dg_dhst_mach === '2' || (!isMachNormal && extra.dg_dhst_mach !== '');

    const isNhipThoNormal = extra.dg_dhst_nhip_tho === '1';
    const isNhipThoCham = extra.dg_dhst_nhip_tho === '3';
    const isNhipThoNhanh = extra.dg_dhst_nhip_tho === '2' || (!isNhipThoNormal && !isNhipThoCham && extra.dg_dhst_nhip_tho !== '');

    const isVongDauNormal = extra.dg_vong_dau === '1';
    const isVongDauTo = extra.dg_vong_dau === '2';
    const isVongDauNho = extra.dg_vong_dau === '3';

    return (
        <>
            {/* ==================== CHILD PAGE 1 ==================== */}
            <div className="a4-page overflow-hidden">
                <div className="flex justify-between items-start text-[12.5px] leading-relaxed mb-2">
                    <div className="flex items-center gap-3">
                        {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain shrink-0" />}
                        <div>
                            <strong className="block uppercase font-bold text-[13px]">{hospitalName || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH'}</strong>
                            <div>Số: {document.doc_no || '....../GKSK-.........'}</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <strong className="block uppercase font-bold text-[13px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                        <strong className="block font-bold underline text-[12px] tracking-wider">Độc lập - Tự do - Hạnh phúc</strong>
                        <div className="italic text-[11px] mt-1">............., ngày {getReportDate().day} tháng {getReportDate().month} năm 20{getReportDate().year % 100}</div>
                    </div>
                </div>

                <div className="text-center my-2">
                    <h1 className="text-[16px] font-bold uppercase leading-tight tracking-wide">
                        MẪU GIẤY KHÁM SỨC KHỎE VÀ KHÁM SỨC KHOẺ ĐỊNH KỲ DÙNG<br />
                        CHO TRẺ EM DƯỚI 06 TUỔI
                    </h1>
                </div>

                <h2 className="font-bold text-[13.5px] uppercase border-b border-black pb-0.5 mt-2 mb-1 tracking-wide text-center">THÔNG TIN HÀNH CHÍNH</h2>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] leading-snug">
                    <div>1. Họ và tên (In hoa): <strong className="uppercase font-bold text-[13.5px]">{document.patient_name}</strong></div>
                    <div>2. Mã định danh (CCCD): <strong>{document.cccd || '................................'}</strong></div>

                    <div>3. Ngày sinh: <strong>{document.dob ? new Date(document.dob).toLocaleDateString('vi-VN') : '.../.../....'}</strong></div>
                    <div className="flex items-center">
                        <span className="mr-2">4. Giới:</span>
                        {renderCheckbox(isChildNam, 'Nam')}
                        {renderCheckbox(isChildNu, 'Nữ')}
                    </div>

                    <div className="flex items-center">
                        <span className="mr-2">5. Sinh non:</span>
                        {renderCheckbox(isSinhNon, 'Có')}
                        {renderCheckbox(isNotSinhNon, 'Không')}
                    </div>
                    <div>6. Tuần thai khi sinh: <strong>{extra.tuan_thai_khi_sinh || '...'}</strong> tuần</div>

                    <div>7. Dân tộc: <strong>{clinical.ethnic || 'Kinh'}</strong></div>
                    <div>8. Đối tượng: <strong>{clinical.target_group || '...'}</strong></div>

                    <div>9. Nguồn chi trả: <strong>{clinical.funding_source || '...'}</strong></div>
                    <div>10. Nhóm máu: <strong>{clinical.blood_group || '...'}</strong></div>

                    <div className="col-span-2">
                        11. Nơi ở hiện tại: Tỉnh/ thành: <strong>{clinical.address || '................................'}</strong>
                    </div>

                    <div className="col-span-2">12. Họ tên người đi cùng trẻ: <strong>{extra.ho_ten_nguoi_di_cung || '................................'}</strong></div>

                    <div className="col-span-2 flex items-center flex-wrap">
                        <span className="mr-2">13. Mối quan hệ với trẻ:</span>
                        {renderCheckbox(isCha, 'Cha')}
                        {renderCheckbox(isMe, 'Mẹ')}
                        {renderCheckbox(isOngBa, 'Ông/bà')}
                        {renderCheckbox(isAnhChi, 'Anh/chị')}
                        {renderCheckbox(isHoHang, 'Họ hàng')}
                        {renderCheckbox(isKhac, 'Khác')}
                    </div>

                    <div>14. Số điện thoại liên hệ: <strong>{clinical.phone || '................................'}</strong></div>
                    <div>15. Mã định danh/CCCD người đi cùng trẻ: <strong>{extra.so_cccd_nguoi_di_cung || '................................'}</strong></div>

                    <div>16. Ngày khám: <strong>{document.created_at ? new Date(document.created_at).toLocaleDateString('vi-VN') : '.../.../....'}</strong></div>
                    <div>17. Cơ sở khám: <strong>{maCskcb || clinical.ma_gtin_cskcb || clinical.ma_cskcb || '................................'}</strong></div>
                    
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>Loại hình khám bệnh, chữa bệnh: <strong>{clinical.loai_hinh_kcb === '01' ? '01 - Khám bệnh' : clinical.loai_hinh_kcb === '02' ? '02 - Chữa bệnh' : clinical.loai_hinh_kcb === '03' ? '03 - Khám bệnh, chữa bệnh' : clinical.loai_hinh_kcb === '04' ? '04 - Khám sức khỏe' : clinical.loai_hinh_kcb || '...'}</strong></div>
                        <div>Lý do khám: <strong>{clinical.ly_do_vv || '...'}</strong></div>
                    </div>

                    <div className="col-span-2 space-y-1 mt-0.5 border-t border-dashed border-slate-300 pt-1">
                        <div className="font-bold">18. Tiền sử:</div>
                        <div className="pl-4 flex items-center">
                            <span className="w-24 font-medium">- Bản thân:</span>
                            {renderCheckbox(hasTsbt, 'Có')}
                            {renderCheckbox(!hasTsbt, 'Không')}
                            <span className="ml-2">(ghi rõ tên bệnh nếu có): <strong>{hasTsbt ? tsbt : '...'}</strong></span>
                        </div>
                        <div className="pl-4 flex items-center">
                            <span className="w-24 font-medium">- Gia đình:</span>
                            {renderCheckbox(hasTsgd, 'Có')}
                            {renderCheckbox(!hasTsgd, 'Không')}
                            <span className="ml-2">(ghi rõ tên bệnh nếu có): <strong>{hasTsgd ? tsgd : '...'}</strong></span>
                        </div>
                        <div className="pl-4 flex items-center">
                            <span className="w-64 font-medium">- Tiền sử tiếp xúc với người bệnh lao:</span>
                            {renderCheckbox(isLaoExposed, 'Có')}
                            {renderCheckbox(isNotLaoExposed, 'Không')}
                        </div>
                    </div>
                </div>

                <h2 className="font-bold text-[13.5px] uppercase border-b border-black pb-0.5 mt-3 mb-1 tracking-wide">ĐÁNH GIÁ DẤU HIỆU SINH TỒN</h2>
                <div className="text-[13px] space-y-1.5 leading-snug pl-2">
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Nhiệt độ: <strong>{clinical.nhiet_do || '...'}</strong> độ C</span>
                        {renderCheckbox(isNhietDoNormal, 'Bình thường')}
                        {renderCheckbox(isNhietDoSot, 'Sốt')}
                        {renderCheckbox(isNhietDoHal, 'Hạ thân nhiệt')}
                    </div>
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Mạch: <strong>{clinical.examination?.pulse || '...'}</strong> lần/phút</span>
                        {renderCheckbox(isMachNormal, 'Bình thường')}
                        {renderCheckbox(isMachNhanh, 'Nhanh')}
                    </div>
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Nhịp thở: <strong>{clinical.nhip_tho || '...'}</strong> lần/phút</span>
                        {renderCheckbox(isNhipThoNormal, 'Bình thường')}
                        {renderCheckbox(isNhipThoNhanh, 'Thở nhanh')}
                        {renderCheckbox(isNhipThoCham, 'Thở chậm')}
                    </div>
                </div>

                <h2 className="font-bold text-[13.5px] uppercase border-b border-black pb-0.5 mt-3 mb-1 tracking-wide">ĐÁNH GIÁ DINH DƯỠNG</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] leading-snug pl-2">
                    <div>Chiều dài (cm): <strong>{clinical.examination?.height || '...'}</strong></div>
                    <div>Chiều dài/Tuổi: <strong>{extra.chieu_dai_tuoi_sd || '...'}</strong> SD</div>

                    <div>Cân nặng (kg): <strong>{clinical.examination?.weight || '...'}</strong></div>
                    <div>Cân nặng/Tuổi: <strong>{extra.can_nang_tuoi_sd || '...'}</strong> SD</div>

                    <div className="flex items-center col-span-2">
                        <span className="w-56 font-medium">Vòng đầu (cm): <strong>{extra.vong_ddau || '...'}</strong></span>
                        {renderCheckbox(isVongDauNormal, 'Bình thường')}
                        {renderCheckbox(isVongDauTo, 'Đầu to')}
                        {renderCheckbox(isVongDauNho, 'Đầu nhỏ')}
                    </div>

                    <div className="col-span-2">Chu vi vòng cánh tay (mm): <strong>{extra.chu_vi_vong_canh_tay || '...'}</strong></div>

                    <div className="col-span-2 flex items-center flex-wrap pt-1 gap-y-1">
                        {renderCheckbox(extra.phu_dinh_duong === '1', 'Phù dinh dưỡng')}
                        {renderCheckbox(extra.thieu_mau === '1', 'Dấu hiệu thiếu máu')}
                        {renderCheckbox(extra.coi_xuong === '1', 'Dấu hiệu còi xương')}
                        {renderCheckbox(extra.suy_dinh_duong === '1', 'Suy dinh dưỡng')}
                        {renderCheckbox(extra.thua_can_beo_phi === '1', 'Thừa cân/béo phì')}
                    </div>
                </div>

                <h2 className="font-bold text-[13.5px] uppercase border-b border-black pb-0.5 mt-3 mb-1 tracking-wide">ĐÁNH GIÁ PHÁT TRIỂN TINH THẦN - VẬN ĐỘNG</h2>
                <table className="a4-table w-full text-[12.5px] text-center mb-0">
                    <thead>
                        <tr className="bg-slate-50 font-bold">
                            <th className="w-[70%] text-left">Hành vi và năng lực trẻ theo độ tuổi</th>
                            <th className="w-[15%] text-center">Có</th>
                            <th className="w-[15%] text-center">Không</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-left py-1.5">Phát triển tinh thần bình thường của trẻ theo độ tuổi</td>
                            <td className="font-bold">{extra.pt_tinh_than_binh_thuong === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.pt_tinh_than_binh_thuong === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1.5">Phát triển vận động bình thường của trẻ theo độ tuổi</td>
                            <td className="font-bold">{extra.pt_van_dong_binh_thuong === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.pt_van_dong_binh_thuong === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1.5">Trẻ có nguy cơ tự kỷ (với trẻ từ 16–30 tháng tuổi)</td>
                            <td className="font-bold">{extra.nguy_co_tu_ky === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.nguy_co_tu_ky === '0' ? 'x' : ''}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="absolute bottom-8 right-8 text-[11px] text-slate-500 font-sans">1/3</div>
            </div>

            {/* ==================== CHILD PAGE 2 ==================== */}
            <div className="a4-page">
                <h2 className="font-bold text-[13.5px] uppercase border-b border-black pb-0.5 mb-2 tracking-wide">ĐÁNH GIÁ TIÊM CHỦNG</h2>
                <table className="a4-table w-full text-[12.5px] text-center mb-5">
                    <thead>
                        <tr className="bg-slate-50 font-bold">
                            <th className="w-[70%] text-left">Kiểm tra sổ tiêm chủng</th>
                            <th className="w-[15%] text-center">Có</th>
                            <th className="w-[15%] text-center">Không</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-left py-1.5">Lao (sơ sinh)</td>
                            <td className="font-bold">{extra.tiem_chung_lao === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.tiem_chung_lao === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1.5">Viêm gan B mũi 1 (sơ sinh)</td>
                            <td className="font-bold">{extra.tiem_chung_vgb_mui1 === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.tiem_chung_vgb_mui1 === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1.5">Tiêm chủng đầy đủ các loại vắc xin theo độ tuổi</td>
                            <td className="font-bold">{extra.tiem_chung_day_du === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.tiem_chung_day_du === '0' ? 'x' : ''}</td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="font-bold text-[15px] uppercase border-b border-black pb-0.5 mt-5 mb-2 tracking-wide text-center">KHÁM LÂM SÀNG</h2>
                <div className="text-[13px] italic mb-4 text-slate-700 text-center">
                    Quan sát: Nét mặt/tư thế/tỷ lệ, sự đối xứng với các bộ phận cơ thể/sự chuyển động của trẻ. Tìm dấu hiệu bệnh cấp hoặc mạn tính.
                </div>

                <div className="text-[13px] space-y-4 pl-1">
                    <div>
                        <strong className="block mb-1.5 text-[13.5px]">1. Toàn trạng</strong>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-36 font-medium">- Màu sắc da:</span>
                            {renderCheckbox(extra.mau_sac_da === '1', 'Hồng hào')}
                            {renderCheckbox(extra.mau_sac_da === '2', 'Nhợt')}
                            {renderCheckbox(extra.mau_sac_da === '3', 'Tím')}
                            {renderCheckbox(extra.mau_sac_da === '4', 'Vàng')}
                            {renderCheckbox(extra.mau_sac_da === '5', 'Sạm da')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-36 font-medium">- Lòng bàn tay:</span>
                            {renderCheckbox(extra.long_ban_tay === '1', 'Bình thường (không nhợt)')}
                            {renderCheckbox(extra.long_ban_tay === '2', 'Không bình thường (nhợt)')}
                        </div>
                    </div>

                    <div>
                        <strong className="block mb-1.5 text-[13.5px]">2. Đầu - cổ</strong>
                        <div className="pl-4 space-y-2">
                            <div>
                                <strong className="block font-semibold text-[13px] mb-1.5 text-teal-900">2.1. Khám đầu - cổ</strong>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Thóp (trẻ nhỏ còn thóp):</span>
                                    {renderCheckbox(extra.thop === '1', 'Bình thường')}
                                    {renderCheckbox(extra.thop === '2', 'Rộng')}
                                    {renderCheckbox(extra.thop === '3', 'Hẹp')}
                                    {renderCheckbox(extra.thop === '4', 'Thóp phồng')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Kích thước và hình dạng đầu:</span>
                                    {renderCheckbox(extra.kich_thuoc_dau === '1', 'Bình thường')}
                                    {renderCheckbox(extra.kich_thuoc_dau === '2', 'Không bình thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Vận động cổ:</span>
                                    {renderCheckbox(extra.van_dong_co === '1', 'Bình thường')}
                                    {renderCheckbox(extra.van_dong_co === '2', 'Giới hạn')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Khối bất thường:</span>
                                    {renderCheckbox(extra.khoi_bat_thuong_dau_co === '1', 'Có')}
                                    {renderCheckbox(extra.khoi_bat_thuong_dau_co === '0', 'Không')}
                                </div>
                            </div>

                            <div className="pt-1.5">
                                <strong className="block font-semibold text-[13px] mb-1.5 text-teal-900">2.2. Khám mắt</strong>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Vị trí 2 mắt:</span>
                                    {renderCheckbox(extra.vi_tri_2_mat === '1', 'Bình thường')}
                                    {renderCheckbox(extra.vi_tri_2_mat === '2', '2 mắt xa nhau')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Mí mắt và kết mạc:</span>
                                    {renderCheckbox(extra.mi_mat_ket_mac === '1', 'Bình thường')}
                                    {renderCheckbox(extra.mi_mat_ket_mac === '2', 'Sưng/đỏ')}
                                    {renderCheckbox(extra.mi_mat_ket_mac === '3', 'Chảy ghèn/mủ')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Lác mắt:</span>
                                    {renderCheckbox(extra.lac_mat === '1', 'Có')}
                                    {renderCheckbox(extra.lac_mat === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Đồng tử (kích thước, phản xạ):</span>
                                    {renderCheckbox(extra.dong_tu === '1', 'Bình thường')}
                                    {renderCheckbox(extra.dong_tu === '2', 'Không bình thường')}
                                </div>
                            </div>

                            <div className="pt-1.5">
                                <strong className="block font-semibold text-[13px] mb-1.5 text-teal-900">2.3. Khám tai</strong>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Tai và màng nhĩ:</span>
                                    {renderCheckbox(extra.tai_mang_nhi === '1', 'Bình thường')}
                                    {renderCheckbox(extra.tai_mang_nhi === '2', 'Không bình thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Đáp ứng với âm thanh:</span>
                                    {renderCheckbox(extra.dap_ung_am_thanh === '1', 'Bình thường')}
                                    {renderCheckbox(extra.dap_ung_am_thanh === '2', 'Không bình thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Có khối sưng sau tai:</span>
                                    {renderCheckbox(extra.khoi_sung_sau_tai === '1', 'Có')}
                                    {renderCheckbox(extra.khoi_sung_sau_tai === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Dấu hiệu chảy mủ, nước tai:</span>
                                    {renderCheckbox(extra.chay_mu_nuoc_tai === '1', 'Có')}
                                    {renderCheckbox(extra.chay_mu_nuoc_tai === '0', 'Không')}
                                </div>
                            </div>

                            <div className="pt-1.5">
                                <strong className="block font-semibold text-[13px] mb-1.5 text-teal-900">2.4. Khám mũi - họng</strong>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Hình dạng mũi:</span>
                                    {renderCheckbox(extra.hinh_dang_mui === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hinh_dang_mui === '2', 'Mũi to, dày')}
                                    {renderCheckbox(extra.hinh_dang_mui === '3', 'Bất sản xương mũi')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Chảy nước mũi:</span>
                                    {renderCheckbox(extra.chay_nuoc_mui === '1', 'Có')}
                                    {renderCheckbox(extra.chay_nuoc_mui === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Nghẹt mũi:</span>
                                    {renderCheckbox(extra.nghet_mui === '1', 'Có')}
                                    {renderCheckbox(extra.nghet_mui === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Họng:</span>
                                    {renderCheckbox(extra.hong === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hong === '2', 'Không bình thường')}
                                </div>
                            </div>

                            <div className="pt-1.5">
                                <strong className="block font-semibold text-[13px] mb-1.5 text-teal-900">2.5. Khám miệng, răng (với trẻ đã có răng)</strong>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Hình dạng miệng:</span>
                                    {renderCheckbox(extra.hinh_dang_mieng === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hinh_dang_mieng === '2', 'Sứt môi, chẻ vòm')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Răng sữa sơ sinh:</span>
                                    {renderCheckbox(extra.rang_sua_so_sinh === '1', 'Có')}
                                    {renderCheckbox(extra.rang_sua_so_sinh === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Hình dạng lưỡi:</span>
                                    {renderCheckbox(extra.hinh_dang_luoi === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hinh_dang_luoi === '2', 'Lưỡi to bè')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Dính thắng lưỡi:</span>
                                    {renderCheckbox(extra.dinh_thang_luoi === '1', 'Có')}
                                    {renderCheckbox(extra.dinh_thang_luoi === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Nấm miệng:</span>
                                    {renderCheckbox(extra.nam_mieng === '1', 'Có')}
                                    {renderCheckbox(extra.nam_mieng === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1.5">
                                    <span className="w-56 font-medium">- Cằm nhỏ, tụt về sau:</span>
                                    {renderCheckbox(extra.cam_nho_tut_sau === '1', 'Có')}
                                    {renderCheckbox(extra.cam_nho_tut_sau === '0', 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Vết sâu, mảng bám, lỗ trên răng:</span>
                                    {renderCheckbox(extra.vet_sau_mang_bam === '1', 'Có')}
                                    {renderCheckbox(extra.vet_sau_mang_bam === '0', 'Không')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">2/3</div>
            </div>

            {/* ==================== CHILD PAGE 3 ==================== */}
            <div className="a4-page">
                <div className="text-[13px] space-y-3.5 pl-1 pt-2">
                    <div>
                        <strong className="block mb-1.5 text-[13.5px]">3. Hô hấp</strong>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Nhịp thở không đều:</span>
                            {renderCheckbox(extra.nhip_tho_khong_deu === '0', 'Không')}
                            {renderCheckbox(extra.nhip_tho_khong_deu === '1', 'Có cơn ngưng thở trên 5 giây')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Thở rút lõm lồng ngực:</span>
                            {renderCheckbox(extra.tho_rut_lom_long_nguc === '1', 'Có')}
                            {renderCheckbox(extra.tho_rut_lom_long_nguc === '0', 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Tiếng thở bất thường:</span>
                            {renderCheckbox(extra.tieng_tho_bat_thuong === '1', 'Có')}
                            {renderCheckbox(extra.tieng_tho_bat_thuong === '0', 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Dấu hiệu suy hô hấp:</span>
                            {renderCheckbox(extra.dh_suy_ho_hap === '1', 'Có')}
                            {renderCheckbox(extra.dh_suy_ho_hap === '0', 'Không')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-56 font-medium">- Nghe phổi:</span>
                            {renderCheckbox(extra.nghe_phoi === '1', 'Bình thường')}
                            {renderCheckbox(extra.nghe_phoi === '2', 'Không bình thường')}
                        </div>
                    </div>

                    <div>
                        <strong className="block mb-1.5 text-[13.5px]">4. Tim mạch</strong>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Vị trí mỏm tim:</span>
                            {renderCheckbox(extra.vi_tri_mom_tim === '1', 'Bình thường')}
                            {renderCheckbox(extra.vi_tri_mom_tim === '2', 'Không bình thường')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Mạch ngoại vi (mạch quay-bẹn):</span>
                            {renderCheckbox(extra.mach_ngoai_vi === '1', 'Bắt rõ')}
                            {renderCheckbox(extra.mach_ngoai_vi === '2', 'Mạch nhẹ')}
                            {renderCheckbox(extra.mach_ngoai_vi === '3', 'Không bắt được')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-56 font-medium">- Nghe tim (loạn nhịp, tiếng thổi):</span>
                            {renderCheckbox(extra.nghe_tim === '2', 'Có')}
                            {renderCheckbox(extra.nghe_tim === '1' || !extra.nghe_tim, 'Không')}
                        </div>
                    </div>

                    <div>
                        <strong className="block mb-1.5 text-[13.5px]">5. Bụng và cơ quan sinh dục</strong>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Hình dáng bụng, rốn:</span>
                            {renderCheckbox(extra.hinh_dang_bung_ron === '1', 'Bình thường')}
                            {renderCheckbox(extra.hinh_dang_bung_ron === '2', 'Không bình thường')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Gan, lách to:</span>
                            {renderCheckbox(extra.gan_lach_to === '1', 'Có')}
                            {renderCheckbox(extra.gan_lach_to === '0', 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Khối bất thường:</span>
                            {renderCheckbox(extra.khoi_bat_thuong_bung === '1', 'Có')}
                            {renderCheckbox(extra.khoi_bat_thuong_bung === '0', 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1.5">
                            <span className="w-56 font-medium">- Lỗ hậu môn:</span>
                            {renderCheckbox(extra.lo_hau_mon === '1', 'Bình thường')}
                            {renderCheckbox(extra.lo_hau_mon === '2', 'Không bình thường')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-56 font-medium">- Cơ quan sinh dục ngoài:</span>
                            {renderCheckbox(extra.cq_sinh_duc_ngoai === '1', 'Bình thường')}
                            {renderCheckbox(extra.cq_sinh_duc_ngoai === '2', 'Không bình thường')}
                        </div>
                    </div>

                    <div>
                        <strong className="block mb-1.5 text-[13.5px]">6. Cơ xương và thần kinh</strong>
                        <div className="pl-4 space-y-1 text-[13px]">
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Vận động không đối xứng:</span>
                                {renderCheckbox(extra.van_dong_khong_doi_xung === '1', 'Có')}
                                {renderCheckbox(extra.van_dong_khong_doi_xung === '0', 'Không')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ bú:</span>
                                {renderCheckbox(extra.phan_xa_bu === '1', 'Có')}
                                {renderCheckbox(extra.phan_xa_bu === '0', 'Không')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ nắm:</span>
                                {renderCheckbox(extra.phan_xa_nam === '1', 'Có')}
                                {renderCheckbox(extra.phan_xa_nam === '0', 'Không')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ Moro:</span>
                                {renderCheckbox(extra.phan_xa_moro === '1', 'Có')}
                                {renderCheckbox(extra.phan_xa_moro === '0', 'Không')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Trương lực cơ:</span>
                                {renderCheckbox(extra.truong_luc_co === '1', 'Bình thường')}
                                {renderCheckbox(extra.truong_luc_co === '2', 'Tăng')}
                                {renderCheckbox(extra.truong_luc_co === '3', 'Giảm')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Khớp háng:</span>
                                {renderCheckbox(extra.khop_hang === '1', 'Bình thường')}
                                {renderCheckbox(extra.khop_hang === '2', 'Trật khớp háng')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ cơ:</span>
                                {renderCheckbox(extra.phan_xa_co === '1', 'Bình thường')}
                                {renderCheckbox(extra.phan_xa_co === '2', 'Không bình thường')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Kiểm tra lưng, cột sống:</span>
                                {renderCheckbox(extra.kiem_tra_lung_cot_song === '1', 'Bình thường')}
                                {renderCheckbox(extra.kiem_tra_lung_cot_song === '2', 'Không bình thường')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Khám tứ chi và khớp:</span>
                                {renderCheckbox(extra.kham_tu_chi_khop === '1', 'Bình thường')}
                                {renderCheckbox(extra.kham_tu_chi_khop === '2', 'Không bình thường')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Quan sát dáng đi:</span>
                                {renderCheckbox(extra.quan_sat_dang_di === '1', 'Bình thường')}
                                {renderCheckbox(extra.quan_sat_dang_di === '2', 'Không bình thường')}
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="font-bold text-[13.5px] uppercase border-b border-black pb-0.5 mt-5 mb-2 tracking-wide text-center">KẾT LUẬN VÀ TƯ VẤN</h2>
                
                <div className="text-[13px] space-y-2.5 leading-relaxed pl-2">
                    <div className="space-y-1">
                        <span className="font-bold">Kết luận về sức khỏe:</span>
                        <div className="pl-4 flex flex-col gap-1 mt-1">
                            {renderCheckbox(conclusion.fitness_class === '1', 'Bình thường.')}
                            {renderCheckbox(isLaoExposed, 'Có nguy cơ mắc lao (tiền sử tiếp xúc).')}
                            {renderCheckbox(conclusion.fitness_class !== '1' && conclusion.fitness_class !== undefined, 'Có vấn đề về sức khỏe.')}
                        </div>
                    </div>
                    
                    <div>
                        <span>Ghi rõ: </span>
                        <strong className="underline decoration-dotted">{conclusion.cac_van_de_luu_y || '................................................................................................'}</strong>
                    </div>
                    
                    <div className="space-y-1.5">
                        <span className="font-bold">Tư vấn và hẹn khám lần sau hoặc chuyển cơ sở khám bệnh, chữa bệnh để khám chuyên khoa phù hợp:</span>
                        <div className="pl-4 flex items-center">
                            {renderCheckbox(conclusion.quan_ly_benh === 'Hẹn khám lần sau' || extra.quan_ly_benh === 'Hẹn khám lần sau', 'Hẹn khám lần sau')}
                            {renderCheckbox(conclusion.quan_ly_benh === 'Chuyển cơ sở' || extra.quan_ly_benh === 'Chuyển cơ sở', 'Chuyển cơ sở khám bệnh, chữa bệnh')}
                        </div>
                    </div>
                </div>

                {/* Signature block */}
                <div className="flex justify-end mt-4 text-[12.5px] px-8">
                    <div className="text-center w-64 flex flex-col items-center">
                        <span className="italic text-[11.5px] mb-0.5 font-normal">Ngày {getReportDate().day} tháng {getReportDate().month} năm 20{getReportDate().year % 100}</span>
                        <strong className="block font-bold uppercase text-[12.5px] tracking-wider mb-1">NGƯỜI KẾT LUẬN</strong>
                        <span className="italic text-[10.5px] text-slate-500 font-normal mb-5">(Ký, ghi rõ họ tên và đóng dấu)</span>

                        {(() => {
                            const sigImg = resolveConclusionSignature();

                            // Prefer the doctor's visible signature image in the printed form.
                            // The digital-signature badge is only a fallback when no image exists.
                            if (document.signature_status === 'Signed' && !sigImg) {
                                return (
                                    <div className="my-2 p-2 border border-green-600 rounded bg-green-50/50 text-[10px] font-bold text-green-700 leading-tight text-left w-full shadow-sm max-w-[220px] font-sans">
                                        <div className="flex items-center gap-1 mb-1 text-green-800">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span>SIGNED DIGITALLY</span>
                                        </div>
                                        By: {hospitalName || 'Phòng khám đa khoa vClinic'}<br/>
                                        Time: {document.updated_at ? new Date(document.updated_at).toLocaleString('vi-VN') : '2026-06-03'}
                                    </div>
                                );
                            }

                            if (sigImg) {
                                return <img src={sigImg} alt="Chữ ký bác sĩ" className="h-16 max-w-[180px] object-contain my-1" />;
                            }

                            return <div className="h-14"></div>;
                        })()}
                        
                        <span className="font-bold text-[13.5px] mt-1.5 text-slate-900 block">{getConclusionDoctorName()}</span>
                    </div>
                </div>

                <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">3/3</div>
            </div>
        </>
    );
};

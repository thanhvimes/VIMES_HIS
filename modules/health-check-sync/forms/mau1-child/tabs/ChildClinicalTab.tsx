import React, { useState } from 'react';
import { useChildFormContext } from '../ChildFormContext';
import SpecialtyCard from '../../tabs/exam/SpecialtyCard';
import { toast } from 'sonner';

const ChildClinicalTab: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState('general');
    const {
        specialtyMetadata,
        lamSangQuanSat, setLamSangQuanSat,
        mauSacDa, setMauSacDa,
        longBanTay, setLongBanTay,
        thop, setThop,
        kichThuocDau, setKichThuocDau,
        vanDongCo, setVanDongCo,
        khoiBatThuongDauCo, setKhoiBatThuongDauCo,
        viTri2Mat, setViTri2Mat,
        miMatKetMac, setMiMatKetMac,
        lacMat, setLacMat,
        dongTu, setDongTu,
        taiMangNhi, setTaiMangNhi,
        dapUngAmThanh, setDapUngAmThanh,
        khoiSungSauTai, setKhoiSungSauTai,
        chayMuNuocTai, setChayMuNuocTai,
        hinhDangMui, setHinhDangMui,
        chayNuocMui, setChayNuocMui,
        nghetMui, setNghetMui,
        hong, setHong,
        hinhDangMieng, setHinhDangMieng,
        rangSuaSoSinh, setRangSuaSoSinh,
        hinhDangLuoi, setHinhDangLuoi,
        dinhThangLuoi, setDinhThangLuoi,
        namMieng, setNamMieng,
        camNhoTutSau, setCamNhoTutSau,
        vetSauMangBam, setVetSauMangBam,
        nhipThoKhongDeu, setNhipThoKhongDeu,
        thoRutLomLongNguc, setThoRutLomLongNguc,
        tiengThoBatThuong, setTiengThoBatThuong,
        dhSuyHoHap, setDhSuyHoHap,
        nghePhoi, setNghePhoi,
        viTriMomTim, setViTriMomTim,
        machNgoaiVi, setMachNgoaiVi,
        ngheTim, setNgheTim,
        hinhDangBungRon, setHinhDangBungRon,
        ganLachTo, setGanLachTo,
        khoiBatThuongBung, setKhoiBatThuongBung,
        loHauMon, setLoHauMon,
        cqSinhDucNgoai, setCqSinhDucNgoai,
        vanDongKhongDoiXung, setVanDongKhongDoiXung,
        phanXaBu, setPhanXaBu,
        phanXaNam, setPhanXaNam,
        phanXaMoro, setphanXaMoro,
        truongLucCo, setTruongLucCo,
        khopHang, setKhopHang,
        phanXaCo, setPhanXaCo,
        kiemTraLungCotSong, setKiemTraLungCotSong,
        khamTuChiKhop, setKhamTuChiKhop,
        quanSatDangDi, setQuanSatDangDi
    } = useChildFormContext();

    const tabs = [
        { id: 'general', label: '1. Toàn trạng', key: 'child_general' },
        { id: 'head_neck', label: '2.1. Đầu - cổ', key: 'child_head_neck' },
        { id: 'eye', label: '2.2. Mắt', key: 'child_eye' },
        { id: 'ear', label: '2.3. Tai', key: 'child_ear' },
        { id: 'nose_throat', label: '2.4. Mũi - họng', key: 'child_nose_throat' },
        { id: 'mouth_dental', label: '2.5. Miệng - răng', key: 'child_mouth_dental' },
        { id: 'respiratory', label: '3. Hô hấp', key: 'child_respiratory' },
        { id: 'cardiovascular', label: '4. Tim mạch', key: 'child_cardiovascular' },
        { id: 'abdomen_genital', label: '5. Bụng & Sinh dục', key: 'child_abdomen_genital' },
        { id: 'musculoskeletal_neuro', label: '6. Cơ xương & TK', key: 'child_musculoskeletal_neuro' }
    ];

    const handleTabClick = (tabId: string) => {
        if (tabId === activeSubTab) return;
        const currentTab = tabs.find(t => t.id === activeSubTab);
        if (currentTab) {
            const currentMeta = specialtyMetadata?.[currentTab.key];
            if (currentMeta?.status === 'ĐANG_KHÁM') {
                toast.warning(`Chuyên khoa "${currentTab.label}" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi chuyển sang chuyên khoa khác!`);
                return;
            }
        }
        setActiveSubTab(tabId);
    };

    const selectClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold";

    const renderSubTabContent = () => {
        switch (activeSubTab) {
            case 'general':
                return (
                    <SpecialtyCard specialtyKey="child_general" title="1. Toàn trạng">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                    Quan sát nét mặt, tư thế, tỷ lệ, đối xứng, vận động và dấu hiệu bệnh cấp/mạn tính
                                </label>
                                <textarea
                                    value={lamSangQuanSat}
                                    onChange={e => setLamSangQuanSat(e.target.value)}
                                    rows={3}
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Nhập kết quả quan sát toàn trạng..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Màu sắc da</label>
                                    <select value={mauSacDa} onChange={e => setMauSacDa(e.target.value)} className={selectClass}>
                                        <option value="1">Hồng hào</option>
                                        <option value="2">Nhợt nhạt</option>
                                        <option value="3">Vàng da</option>
                                        <option value="4">Tím tái</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Lòng bàn tay</label>
                                    <select value={longBanTay} onChange={e => setLongBanTay(e.target.value)} className={selectClass}>
                                        <option value="1">Hồng</option>
                                        <option value="2">Nhợt nhạt</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'head_neck':
                return (
                    <SpecialtyCard specialtyKey="child_head_neck" title="2.1. Đầu - cổ">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Thóp (trẻ nhỏ còn thóp)</label>
                                <select value={thop} onChange={e => setThop(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="2">Rộng</option>
                                    <option value="3">Hẹp</option>
                                    <option value="4">Thóp phồng</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Kích thước và hình dạng đầu</label>
                                <select value={kichThuocDau} onChange={e => setKichThuocDau(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="2">Đầu to</option>
                                    <option value="3">Đầu nhỏ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Vận động cổ</label>
                                <select value={vanDongCo} onChange={e => setVanDongCo(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Không bình thường (ẹo cổ, vẹo cổ...)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Khối bất thường</label>
                                <select value={khoiBatThuongDauCo} onChange={e => setKhoiBatThuongDauCo(e.target.value)} className={selectClass}>
                                    <option value="0">Không phát hiện khối bất thường</option>
                                    <option value="1">Có khối bất thường</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'eye':
                return (
                    <SpecialtyCard specialtyKey="child_eye" title="2.2. Mắt">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Vị trí 2 mắt</label>
                                <select value={viTri2Mat} onChange={e => setViTri2Mat(e.target.value)} className={selectClass}>
                                    <option value="1">Cân đối</option>
                                    <option value="0">Không cân đối (cách xa nhau, sụp mi...)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Mí mắt và kết mạc</label>
                                <select value={miMatKetMac} onChange={e => setMiMatKetMac(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường (hồng hào)</option>
                                    <option value="0">Bất thường (nhợt nhạt, viêm đỏ...)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lác mắt</label>
                                <select value={lacMat} onChange={e => setLacMat(e.target.value)} className={selectClass}>
                                    <option value="0">Không lác</option>
                                    <option value="1">Có lác mắt</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Đồng tử (kích thước, phản xạ)</label>
                                <select value={dongTu} onChange={e => setDongTu(e.target.value)} className={selectClass}>
                                    <option value="1">Đều, phản xạ ánh sáng tốt</option>
                                    <option value="0">Bất thường (giãn, không phản xạ...)</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'ear':
                return (
                    <SpecialtyCard specialtyKey="child_ear" title="2.3. Tai">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tai và màng nhĩ</label>
                                <select value={taiMangNhi} onChange={e => setTaiMangNhi(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Bất thường</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Đáp ứng với âm thanh</label>
                                <select value={dapUngAmThanh} onChange={e => setDapUngAmThanh(e.target.value)} className={selectClass}>
                                    <option value="1">Nhạy bén</option>
                                    <option value="0">Kém phản xạ với âm thanh</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Có khối sưng sau tai</label>
                                <select value={khoiSungSauTai} onChange={e => setKhoiSungSauTai(e.target.value)} className={selectClass}>
                                    <option value="0">Không có</option>
                                    <option value="1">Có khối sưng</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Dấu hiệu chảy mủ, nước tai</label>
                                <select value={chayMuNuocTai} onChange={e => setChayMuNuocTai(e.target.value)} className={selectClass}>
                                    <option value="0">Không chảy dịch</option>
                                    <option value="1">Có chảy dịch/mủ</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'nose_throat':
                return (
                    <SpecialtyCard specialtyKey="child_nose_throat" title="2.4. Mũi - họng">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Hình dạng mũi</label>
                                <select value={hinhDangMui} onChange={e => setHinhDangMui(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Tịt mũi/Bất thường</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chảy nước mũi</label>
                                <select value={chayNuocMui} onChange={e => setChayNuocMui(e.target.value)} className={selectClass}>
                                    <option value="0">Không</option>
                                    <option value="1">Có chảy dịch mũi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nghẹt mũi</label>
                                <select value={nghetMui} onChange={e => setNghetMui(e.target.value)} className={selectClass}>
                                    <option value="0">Không nghẹt</option>
                                    <option value="1">Có nghẹt mũi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Họng</label>
                                <select value={hong} onChange={e => setHong(e.target.value)} className={selectClass}>
                                    <option value="1">Sạch, không sưng đỏ</option>
                                    <option value="0">Sưng đỏ/Viêm hạt/Có mủ</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'mouth_dental':
                return (
                    <SpecialtyCard specialtyKey="child_mouth_dental" title="2.5. Miệng, răng">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Hình dạng miệng</label>
                                <select value={hinhDangMieng} onChange={e => setHinhDangMieng(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Sứt môi, hở hàm ếch...</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Răng sữa sơ sinh</label>
                                <select value={rangSuaSoSinh} onChange={e => setRangSuaSoSinh(e.target.value)} className={selectClass}>
                                    <option value="0">Không có</option>
                                    <option value="1">Có mọc răng sữa sớm</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Hình dạng lưỡi</label>
                                <select value={hinhDangLuoi} onChange={e => setHinhDangLuoi(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Lưỡi to/Lưỡi gà bất thường</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Dính thắng lưỡi</label>
                                <select value={dinhThangLuoi} onChange={e => setDinhThangLuoi(e.target.value)} className={selectClass}>
                                    <option value="0">Không dính</option>
                                    <option value="1">Có dính thắng lưỡi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nấm miệng</label>
                                <select value={namMieng} onChange={e => setNamMieng(e.target.value)} className={selectClass}>
                                    <option value="0">Không có</option>
                                    <option value="1">Có tưa miệng / nấm trắng</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Cằm nhỏ, tụt về sau</label>
                                <select value={camNhoTutSau} onChange={e => setCamNhoTutSau(e.target.value)} className={selectClass}>
                                    <option value="0">Không</option>
                                    <option value="1">Có cằm nhỏ vẹt sau</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Vết sâu, mảng bám, lỗ trên răng</label>
                                <select value={vetSauMangBam} onChange={e => setVetSauMangBam(e.target.value)} className={selectClass}>
                                    <option value="0">Không phát hiện</option>
                                    <option value="1">Có sâu răng/mảng bám đen</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'respiratory':
                return (
                    <SpecialtyCard specialtyKey="child_respiratory" title="3. Hô hấp">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp thở không đều</label>
                                <select value={nhipThoKhongDeu} onChange={e => setNhipThoKhongDeu(e.target.value)} className={selectClass}>
                                    <option value="0">Không (thở đều)</option>
                                    <option value="1">Có cơn ngừng thở/Thở không đều</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Thở rút lõm lồng ngực</label>
                                <select value={thoRutLomLongNguc} onChange={e => setThoRutLomLongNguc(e.target.value)} className={selectClass}>
                                    <option value="0">Không rút lõm</option>
                                    <option value="1">Có rút lõm lồng ngực</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tiếng thở bất thường</label>
                                <select value={tiengThoBatThuong} onChange={e => setTiengThoBatThuong(e.target.value)} className={selectClass}>
                                    <option value="0">Không</option>
                                    <option value="1">Thở khò khè/Thở rít rên...</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Dấu hiệu suy hô hấp</label>
                                <select value={dhSuyHoHap} onChange={e => setDhSuyHoHap(e.target.value)} className={selectClass}>
                                    <option value="0">Không suy hô hấp</option>
                                    <option value="1">Có dấu hiệu suy hô hấp</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nghe phổi</label>
                                <select value={nghePhoi} onChange={e => setNghePhoi(e.target.value)} className={selectClass}>
                                    <option value="1">Rì rào phế nang êm dịu, không rale</option>
                                    <option value="0">Có rale ẩm / rale rít / rale ngáy</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'cardiovascular':
                return (
                    <SpecialtyCard specialtyKey="child_cardiovascular" title="4. Tim mạch">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Vị trí mỏm tim</label>
                                <select value={viTriMomTim} onChange={e => setViTriMomTim(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường (khoang liên sườn 4-5 đường đòn trái)</option>
                                    <option value="0">Lệch hướng / Sang phải</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Mạch ngoại vi (mạch quay - bẹn)</label>
                                <select value={machNgoaiVi} onChange={e => setMachNgoaiVi(e.target.value)} className={selectClass}>
                                    <option value="1">Đều, rõ, trùng nhịp tim</option>
                                    <option value="0">Yếu/Không bắt được mạch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nghe tim (loạn nhịp, tiếng thổi)</label>
                                <select value={ngheTim} onChange={e => setNgheTim(e.target.value)} className={selectClass}>
                                    <option value="1">T1, T2 đều rõ, không tiếng thổi bệnh lý</option>
                                    <option value="0">Có tiếng thổi / Loạn nhịp tim</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'abdomen_genital':
                return (
                    <SpecialtyCard specialtyKey="child_abdomen_genital" title="5. Bụng và cơ quan sinh dục">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Hình dáng bụng, rốn</label>
                                <select value={hinhDangBungRon} onChange={e => setHinhDangBungRon(e.target.value)} className={selectClass}>
                                    <option value="1">Bụng mềm, rốn khô sạch</option>
                                    <option value="0">Bụng chướng / Thoát vị rốn / Rốn rỉ dịch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Gan, lách to</label>
                                <select value={ganLachTo} onChange={e => setGanLachTo(e.target.value)} className={selectClass}>
                                    <option value="0">Không sờ thấy gan lách to</option>
                                    <option value="1">Gan hoặc lách to dưới bờ sườn</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Khối bất thường</label>
                                <select value={khoiBatThuongBung} onChange={e => setKhoiBatThuongBung(e.target.value)} className={selectClass}>
                                    <option value="0">Không có khối u cục</option>
                                    <option value="1">Phát hiện khối u vùng bụng</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lỗ hậu môn</label>
                                <select value={loHauMon} onChange={e => setLoHauMon(e.target.value)} className={selectClass}>
                                    <option value="1">Có lỗ hậu môn thông suốt</option>
                                    <option value="0">Dị tật vô hậu môn/Bất thường</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Cơ quan sinh dục ngoài</label>
                                <select value={cqSinhDucNgoai} onChange={e => setCqSinhDucNgoai(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Bất thường (tinh hoàn ẩn, hẹp bao quy đầu...)</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            case 'musculoskeletal_neuro':
                return (
                    <SpecialtyCard specialtyKey="child_musculoskeletal_neuro" title="6. Cơ xương và thần kinh">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Vận động không đối xứng</label>
                                <select value={vanDongKhongDoiXung} onChange={e => setVanDongKhongDoiXung(e.target.value)} className={selectClass}>
                                    <option value="0">Không (vận động đối xứng bình thường)</option>
                                    <option value="1">Có bất đối xứng vận động 2 bên</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phản xạ bú</label>
                                <select value={phanXaBu} onChange={e => setPhanXaBu(e.target.value)} className={selectClass}>
                                    <option value="1">Tốt</option>
                                    <option value="0">Yếu / Không có</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phản xạ nắm</label>
                                <select value={phanXaNam} onChange={e => setPhanXaNam(e.target.value)} className={selectClass}>
                                    <option value="1">Tốt</option>
                                    <option value="0">Yếu / Không có</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phản xạ Moro</label>
                                <select value={phanXaMoro} onChange={e => setphanXaMoro(e.target.value)} className={selectClass}>
                                    <option value="1">Tốt (giật mình đối xứng)</option>
                                    <option value="0">Yếu / Bất đối xứng / Không có</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Trương lực cơ</label>
                                <select value={truongLucCo} onChange={e => setTruongLucCo(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="2">Tăng trương lực cơ</option>
                                    <option value="3">Giảm trương lực cơ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Khớp háng</label>
                                <select value={khopHang} onChange={e => setKhopHang(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường (dạng tốt, không dấu hiệu Ortolani/Barlow)</option>
                                    <option value="0">Nghi ngờ trật khớp háng bẩm sinh</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phản xạ cơ</label>
                                <select value={phanXaCo} onChange={e => setPhanXaCo(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Bất thường</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Kiểm tra lưng, cột sống</label>
                                <select value={kiemTraLungCotSong} onChange={e => setKiemTraLungCotSong(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường, không gù vẹo, không nứt đốt sống</option>
                                    <option value="0">Nứt đốt sống / Gù vẹo / Có xoang lông</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Khám tứ chi và khớp</label>
                                <select value={khamTuChiKhop} onChange={e => setKhamTuChiKhop(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường, đủ ngón, không khoèo chi</option>
                                    <option value="0">Thừa ngón/Khoèo chân/Bất thường chi</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Quan sát dáng đi (nếu trẻ đã biết đi)</label>
                                <select value={quanSatDangDi} onChange={e => setQuanSatDangDi(e.target.value)} className={selectClass}>
                                    <option value="1">Bình thường</option>
                                    <option value="0">Đi khập khiễng / Dáng đi bất thường</option>
                                </select>
                            </div>
                        </div>
                    </SpecialtyCard>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-full min-h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Sidebar Sub-tabs */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
                <div className="p-4 font-semibold text-gray-700 uppercase text-xs border-b border-gray-200">
                    Chuyên khoa khám
                </div>
                <div className="p-2 space-y-1">
                    {tabs.map(tab => {
                        const isActive = activeSubTab === tab.id;
                        const meta = specialtyMetadata?.[tab.key] || {};
                        const isApproved = meta.status === 'ĐÃ_DUYỆT';
                        const isExamining = meta.status === 'ĐANG_KHÁM';

                        let statusColor = "bg-gray-100 text-gray-600";
                        if (isApproved) statusColor = "bg-teal-100 text-teal-800 font-bold";
                        else if (isExamining) statusColor = "bg-blue-100 text-blue-800 font-bold";

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabClick(tab.id)}
                                className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-md transition-all duration-150 flex items-center justify-between gap-2 ${
                                    isActive
                                        ? 'bg-[#0f766e] text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <span className="truncate">{tab.label}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : statusColor}`}>
                                    {isApproved ? 'Đã duyệt' : isExamining ? 'Đang khám' : 'Chưa khám'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sub-tab content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {renderSubTabContent()}
            </div>
        </div>
    );
};

export default ChildClinicalTab;

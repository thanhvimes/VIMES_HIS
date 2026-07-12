import React from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';
import { SearchIcon, RefreshIcon } from '../../../../components/Icons';
import Combobox from '../../../../components/ui/Combobox';
import { FormDateInput } from '../../../../components/ui/forms';
import { CatalogItem } from '../../../../services/catalogService';
import { useSession } from '../../../../contexts/SessionContext';

const AdminTab: React.FC = () => {
    const {
        formType,
        isChild,
        isStudent,
        hisSearchQuery,
        setHisSearchQuery,
        isFetchingHis,
        hisSyncMessage,
        handleFetchHisData,
        patientId,
        setPatientId,
        patientName,
        setPatientName,
        cccd,
        setCccd,
        noCccd,
        setNoCccd,
        dob,
        setDob,
        gender,
        setGender,
        docNo,
        setDocNo,
        address,
        setAddress,
        phone,
        setPhone,
        quocTich,
        setQuocTich,
        ethnic,
        setEthnic,
        maNgheNghiep,
        setMaNgheNghiep,
        maTinhCuTru,
        setMaTinhCuTru,
        maXaCuTru,
        setMaXaCuTru,
        sinhNon,
        setSinhNon,
        tuanThai,
        setTuanThai,
        noiCongTacHienTai,
        setNoiCongTacHienTai,
        bloodGroup,
        setBloodGroup,
        targetGroup,
        setTargetGroup,
        fundingSource,
        setFundingSource,
        cccdDate,
        setCccdDate,
        cccdPlace,
        setCccdPlace,
        lyDoVv,
        setLyDoVv,
        ngayVao,
        setNgayVao,
        maGtinCskcb,
        maCskcb,
        ngayBatDauLamViecHienTai,
        setNgayBatDauLamViecHienTai,
        ngheCongViecTruocDay,
        setNgheCongViecTruocDay,
        thoiGianLamViecTruocDayNam,
        setThoiGianLamViecTruocDayNam,
        thoiGianLamViecTruocDayThang,
        setThoiGianLamViecTruocDayThang,
        tuNgayLamViecTruocDay,
        setTuNgayLamViecTruocDay,
        denNgayLamViecTruocDay,
        setDenNgayLamViecTruocDay,
        guardianName,
        setGuardianName,
        guardianCccd,
        setGuardianCccd,
        tsTiepXucLao,
        setTsTiepXucLao,
        escortName,
        setEscortName,
        escortCccd,
        setEscortCccd,
        escortRelation,
        setEscortRelation,
        conThuMay,
        setConThuMay,
        tongSoCon,
        setTongSoCon,
        maTinhCuTruNghMe,
        setMaTinhCuTruNghMe,
        maXaCuTruNghMe,
        setMaXaCuTruNghMe,
        licenseClass,
        setLicenseClass,
        chucDanh,
        setChucDanh,
        noiCongTac,
        setNoiCongTac,
        railwayFit,
        setRailwayFit,
        viTriLamViec,
        setViTriLamViec,
        boPhanLamViec,
        setBoPhanLamViec,
        offshoreExp,
        setOffshoreExp,
        chucDanhTrenTau,
        setChucDanhTrenTau,
        tenChuTau,
        setTenChuTau,
        diaChiChuTau,
        setDiaChiChuTau,
        khuVucHoatDongTau,
        setKhuVucHoatDongTau,
        provinces,
        ethnicities,
        occupations,
        nations,
        wards,
        wardsNghMe,
        workplaces,
        errors,
        setErrors,
        isLocked,
        handleAutofillTab,
        coKinhHaiMat,
        coKinhMatPhai,
        coKinhMatTrai,
        khongKinhHaiMat,
        khongKinhMatPhai,
        khongKinhMatTrai,
        sacGiac,
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        handleSubmit,
    } = useDynamicFormContext();

    const { user } = useSession();

    const safeMetadata = specialtyMetadata || {};
    const adminMetadata = { ...(safeMetadata.admin || { doctorId: '', status: 'CHUA_KHAM' }) };
    
    if (!adminMetadata.doctorId && user) {
        adminMetadata.doctorId = user.userId || '';
        adminMetadata.doctorName = user.name || '';
    }
    
    const doctorsList = doctors || [];

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...adminMetadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                admin: payload
            }));
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
            
            setSpecialtyMetadata(prev => {
                const updated = {
                    ...prev,
                    admin: payload
                };
                setTimeout(() => {
                    handleSubmit();
                }, 100);
                return updated;
            });
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                admin: payload
            }));
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                admin: payload
            }));
        }
    };

    const isTabLocked = isLocked || (adminMetadata.status !== 'ĐANG_KHÁM' && adminMetadata.status !== 'ĐÃ_KHÁM');

    const doctorColumns = [
        { key: 'id', label: 'Mã người dùng (su_userid)', width: '180px' },
        { key: 'name', label: 'Họ tên bác sĩ' }
    ];

    const renderBadge = () => {
        switch (adminMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Đã duyệt</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Chưa khám</span>;
        }
    };

    const getDriverWarnings = () => {
        if (formType !== '3' || !licenseClass) return [];
        const warnings: string[] = [];

        const parseVisual = (val: string) => {
            if (!val) return 10;
            const match = val.match(/^(\d+)\/10/);
            if (match) return parseInt(match[1]);
            const num = parseFloat(val);
            if (!isNaN(num)) return num <= 1 ? num * 10 : num;
            return 10;
        };

        const hasGlasses = coKinhHaiMat || coKinhMatPhai || coKinhMatTrai;
        const rightEye = parseVisual(hasGlasses ? coKinhMatPhai : khongKinhMatPhai);
        const leftEye = parseVisual(hasGlasses ? coKinhMatTrai : khongKinhMatTrai);

        if (licenseClass === 'A1') {
            const total = rightEye + leftEye;
            if (total < 8) {
                warnings.push("Thị lực cả hai mắt cộng lại có kính dưới 8/10 (Quy định: tối thiểu >= 8/10 đối với hạng A1).");
            }
        } else {
            const bestEye = Math.max(rightEye, leftEye);
            const worstEye = Math.min(rightEye, leftEye);
            if (bestEye < 8) {
                warnings.push("Thị lực mắt tốt có kính dưới 8/10 (Quy định: tối thiểu >= 8/10 đối với hạng B2, C, D, E, F).");
            }
            if (worstEye < 5) {
                warnings.push("Thị lực mắt kém có kính dưới 5/10 (Quy định: tối thiểu >= 5/10 đối với hạng B2, C, D, E, F).");
            }
        }

        if (sacGiac === '1' || sacGiac === '2') {
            warnings.push("Bệnh nhân bị mù màu hoặc rối loạn sắc giác đỏ - lục (Không đủ điều kiện lái xe hạng B2, C, D, E, F).");
        }

        return warnings;
    };

    const driverWarnings = getDriverWarnings();

    const commonColumns = [
        { key: 'code', label: 'Mã', width: '25%' },
        { key: 'name', label: 'Tên', width: '75%' }
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Quy trình phê duyệt & Tìm kiếm đồng bộ */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4 animate-in fade-in">
                {/* Left: Search Input (only when not locked) or Title (when locked) */}
                {!isLocked ? (
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        <div className="relative w-full sm:w-80">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-4 h-4 text-slate-400" />
                            </span>
                            <input 
                                type="text" 
                                placeholder="Tìm theo số thẻ CCCD, mã hồ sơ, số điện thoại..." 
                                value={hisSearchQuery}
                                onChange={e => setHisSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFetchHisData(); } }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleFetchHisData}
                            disabled={isFetchingHis || !hisSearchQuery}
                            className="px-3 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                            {isFetchingHis ? <RefreshIcon className="w-3.5 h-3.5 animate-spin"/> : <SearchIcon className="w-3.5 h-3.5"/>}
                            Tìm kiếm
                        </button>
                        {renderBadge()}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                            Quy trình phê duyệt Hành chính &amp; Đặc thù
                        </span>
                        {renderBadge()}
                    </div>
                )}

                {/* Right: Approval Actions */}
                <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap justify-end">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Người nhập liệu:</label>
                        <Combobox
                            value={adminMetadata.doctorId}
                            options={doctorsList}
                            columns={doctorColumns}
                            onChange={(val, item) => {
                                setSpecialtyMetadata(prev => ({
                                    ...prev,
                                    admin: {
                                        ...adminMetadata,
                                        doctorId: val,
                                        doctorName: item?.name || '',
                                        updatedAt: new Date().toISOString()
                                    }
                                }));
                            }}
                            disabled={isTabLocked}
                            placeholder="-- Chọn bác sĩ --"
                            className="w-[220px]"
                        />
                    </div>
                    
                    {adminMetadata.status === 'CHUA_KHAM' || !adminMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Khám
                        </button>
                    ) : (adminMetadata.status === 'ĐANG_KHÁM' || adminMetadata.status === 'ĐÃ_KHÁM') ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleAction('DUYỆT')}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Duyệt
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAction('THOÁT')}
                                className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Thoát
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÓA')}
                            className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 shadow-sm active:scale-95 transition cursor-pointer"
                            title="Mở khóa để sửa"
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </div>

            {hisSyncMessage && (
                <div className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2 border animate-fadeIn ${
                    hisSyncMessage.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400'
                }`}>
                    <span className="font-bold">{hisSyncMessage.type === 'success' ? '✓ Thành công:' : '⚠ Lỗi:'}</span>
                    <span>{hisSyncMessage.text}</span>
                </div>
            )}

            {driverWarnings.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl text-rose-800 dark:text-rose-400 text-xs space-y-1.5 animate-fadeIn">
                    <h5 className="font-bold flex items-center gap-1.5 uppercase text-rose-900 dark:text-rose-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Cảnh báo tiêu chuẩn sức khỏe lái xe (Hạng {licenseClass})
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 font-semibold">
                        {driverWarnings.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                        ))}
                    </ul>
                </div>
            )}

            <fieldset disabled={isTabLocked} className="space-y-6">
            {isChild ? (
                <div className="space-y-6">
                    {/* I.1. THÔNG TIN CƠ BẢN BỆNH NHÂN */}
                    <div>
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">I.1. THÔNG TIN CƠ BẢN BỆNH NHÂN</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">1. Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value.toUpperCase())} required className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-teal-700 dark:text-emerald-400 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">2. Ngày sinh <span className="text-red-500">*</span></label>
                                <FormDateInput label="" value={dob} onChange={e => setDob(e.target.value)} className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 !rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">3. Số định danh cá nhân</label>
                                <input type="text" value={cccd} onChange={e => setCccd(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Mã định danh cá nhân của trẻ" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">4. Giới tính <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-0">
                                    <button
                                        type="button"
                                        onClick={() => setGender('Nam')}
                                        className={`px-5 h-[38px] text-sm font-bold rounded-l-lg border transition-all duration-200 cursor-pointer ${gender === 'Nam' ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                    >
                                        ♂ Nam
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGender('Nữ')}
                                        className={`px-5 h-[38px] text-sm font-bold rounded-r-lg border-t border-b border-r transition-all duration-200 cursor-pointer ${gender === 'Nữ' ? 'bg-pink-500 text-white border-pink-500 shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                    >
                                        ♀ Nữ
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">5. Sinh non</label>
                                <select value={sinhNon} onChange={e => setSinhNon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Không biết</option>
                                    <option value="0">Không</option>
                                    <option value="1">Có</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">6. Tuần thai khi sinh</label>
                                <select value={tuanThai} onChange={e => setTuanThai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn tuần thai</option>
                                    {Array.from({ length: 20 }, (_, i) => 22 + i).map(week => (
                                        <option key={week} value={week}>{week} tuần</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative z-30">
                                <Combobox<CatalogItem>
                                    label="7. Dân tộc"
                                    value={String(ethnic || '')}
                                    displayValue={item => item.name}
                                    onChange={val => setEthnic(val)}
                                    options={ethnicities}
                                    columns={commonColumns}
                                    placeholder="Chọn..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">8. Đối tượng</label>
                                <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn</option>
                                    <option value="10">Trẻ em trong cơ sở giáo dục mầm non</option>
                                    <option value="14">Các đối tượng khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">9. Nguồn chi trả</label>
                                <select value={fundingSource} onChange={e => setFundingSource(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn nguồn chi trả</option>
                                    <option value="1">Ngân sách Trung ương</option>
                                    <option value="2">Ngân sách Địa phương</option>
                                    <option value="3">Quỹ Bảo hiểm y tế</option>
                                    <option value="9">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">10. Nhóm máu</label>
                                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn nhóm máu</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="AB">AB</option>
                                    <option value="O">O</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* I.2. NƠI Ở HIỆN TẠI */}
                    <div>
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">11. Nơi ở hiện tại</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative z-20">
                                <Combobox<CatalogItem>
                                    label="Tỉnh/Thành phố"
                                    value={String(maTinhCuTru || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => {
                                        setMaTinhCuTru(val);
                                        setMaXaCuTru('');
                                    }}
                                    options={provinces}
                                    columns={commonColumns}
                                    placeholder="Chọn tỉnh/thành..."
                                />
                            </div>
                            <div className="relative z-10">
                                <Combobox<CatalogItem>
                                    label="Phường/Xã"
                                    value={String(maXaCuTru || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setMaXaCuTru(val)}
                                    options={wards}
                                    columns={commonColumns}
                                    placeholder="Chọn phường/xã..."
                                    disabled={!maTinhCuTru}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Địa chỉ chi tiết</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Số nhà, thôn/xóm..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* I.3. THÔNG TIN NGƯỜI ĐI CÙNG & GIÁM HỘ */}
                    <div>
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">Thông tin người đi cùng &amp; giám hộ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">12. Họ tên người đi cùng trẻ</label>
                                <input
                                    type="text"
                                    value={escortName}
                                    onChange={e => setEscortName(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Nhập họ tên người đi cùng"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">13. Mối quan hệ với trẻ</label>
                                <select
                                    value={escortRelation}
                                    onChange={e => setEscortRelation(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                >
                                    <option value="">Chọn mối quan hệ...</option>
                                    <option value="Bố">Bố</option>
                                    <option value="Mẹ">Mẹ</option>
                                    <option value="Ông">Ông</option>
                                    <option value="Bà">Bà</option>
                                    <option value="Anh">Anh</option>
                                    <option value="Chị">Chị</option>
                                    <option value="Người giám hộ">Người giám hộ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">14. Điện thoại</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold"
                                    placeholder="Số điện thoại"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">15. Số định danh người giám hộ</label>
                                <input
                                    type="text"
                                    value={guardianCccd}
                                    onChange={e => setGuardianCccd(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold"
                                    placeholder="Số định danh người giám hộ"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* THÔNG TIN HÀNH CHÍNH NGƯỜI LỚN */}
                    <div>
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">I. THÔNG TIN HÀNH CHÍNH</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">1. Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value.toUpperCase())} required className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-teal-700 dark:text-emerald-400 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">2. Ngày sinh <span className="text-red-500">*</span></label>
                                <FormDateInput label="" value={dob} onChange={e => setDob(e.target.value)} className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 !rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">3. Giới tính <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-0">
                                    <button
                                        type="button"
                                        onClick={() => setGender('Nam')}
                                        className={`px-5 h-[38px] text-sm font-bold rounded-l-lg border transition-all duration-200 cursor-pointer ${gender === 'Nam' ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                    >
                                        ♂ Nam
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGender('Nữ')}
                                        className={`px-5 h-[38px] text-sm font-bold rounded-r-lg border-t border-b border-r transition-all duration-200 cursor-pointer ${gender === 'Nữ' ? 'bg-pink-500 text-white border-pink-500 shadow-sm' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                    >
                                        ♀ Nữ
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">4. Số điện thoại</label>
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Số điện thoại" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-500">5. Số CCCD/Hộ chiếu</label>
                                    <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                                        <input type="checkbox" checked={noCccd} onChange={e => setNoCccd(e.target.checked)} className="rounded text-teal-600 w-3.5 h-3.5" />
                                        Chưa có CCCD
                                    </label>
                                </div>
                                <input type="text" value={cccd} onChange={e => setCccd(e.target.value)} disabled={noCccd} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50 font-mono font-bold" placeholder="Số CCCD" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Ngày cấp CCCD</label>
                                <FormDateInput label="" value={cccdDate} onChange={e => setCccdDate(e.target.value)} disabled={noCccd} className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 !rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nơi cấp CCCD</label>
                                <input type="text" value={cccdPlace} onChange={e => setCccdPlace(e.target.value)} disabled={noCccd} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50" placeholder="Nơi cấp" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="relative z-30">
                                <Combobox<CatalogItem>
                                    label="6. Quốc tịch"
                                    value={String(quocTich || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setQuocTich(val)}
                                    options={nations}
                                    columns={commonColumns}
                                    placeholder="Chọn quốc tịch..."
                                />
                            </div>
                            <div className="relative z-30">
                                <Combobox<CatalogItem>
                                    label="7. Dân tộc"
                                    value={String(ethnic || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setEthnic(val)}
                                    options={ethnicities}
                                    columns={commonColumns}
                                    placeholder="Chọn dân tộc..."
                                />
                            </div>
                            <div className="relative z-30">
                                <Combobox<CatalogItem>
                                    label="8. Nghề nghiệp"
                                    value={String(maNgheNghiep || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setMaNgheNghiep(val)}
                                    options={occupations}
                                    columns={commonColumns}
                                    placeholder="Chọn nghề nghiệp..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">9. Nơi công tác hiện tại</label>
                                <input type="text" value={noiCongTacHienTai} onChange={e => setNoiCongTacHienTai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Nơi công tác" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">10. Nhóm máu</label>
                                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn nhóm máu</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="AB">AB</option>
                                    <option value="O">O</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">11. Đối tượng</label>
                                <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn đối tượng...</option>
                                    <option value="10">Trẻ em trong cơ sở giáo dục mầm non</option>
                                    <option value="14">Các đối tượng khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">12. Nguồn chi trả</label>
                                <select value={fundingSource} onChange={e => setFundingSource(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">Chọn nguồn chi trả...</option>
                                    <option value="1">Ngân sách Trung ương</option>
                                    <option value="2">Ngân sách Địa phương</option>
                                    <option value="3">Quỹ Bảo hiểm y tế</option>
                                    <option value="9">Khác</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* NƠI Ở HIỆN TẠI */}
                    <div>
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II. NƠI Ở HIỆN TẠI</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative z-20">
                                <Combobox<CatalogItem>
                                    label="Tỉnh/Thành phố"
                                    value={String(maTinhCuTru || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => {
                                        setMaTinhCuTru(val);
                                        setMaXaCuTru('');
                                    }}
                                    options={provinces}
                                    columns={commonColumns}
                                    placeholder="Chọn tỉnh/thành..."
                                />
                            </div>
                            <div className="relative z-10">
                                <Combobox<CatalogItem>
                                    label="Phường/Xã"
                                    value={String(maXaCuTru || '')}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setMaXaCuTru(val)}
                                    options={wards}
                                    columns={commonColumns}
                                    placeholder="Chọn phường/xã..."
                                    disabled={!maTinhCuTru}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Địa chỉ chi tiết</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Số nhà, thôn/xóm..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* THÔNG TIN ĐẶC THÙ THEO LOẠI HỒ SƠ */}
                    {(formType === '2' || formType === '5') && (
                        <div>
                            <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">III. THÔNG TIN ĐẶC THÙ THEO ĐỐI TƯỢNG</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {formType === '5' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Chức danh trên tàu</label>
                                            <input type="text" value={chucDanhTrenTau} onChange={e => setChucDanhTrenTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Chức danh" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Tên chủ tàu</label>
                                            <input type="text" value={tenChuTau} onChange={e => setTenChuTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Tên chủ tàu" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Địa chỉ chủ tàu</label>
                                            <input type="text" value={diaChiChuTau} onChange={e => setDiaChiChuTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Địa chỉ chủ tàu" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Khu vực hoạt động của tàu</label>
                                            <select
                                                value={khuVucHoatDongTau}
                                                onChange={e => setKhuVucHoatDongTau(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                            >
                                                <option value="">Chọn khu vực...</option>
                                                <option value="1">Trong nước</option>
                                                <option value="2">Quốc tế</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {formType === '2' && (
                                    <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">12. Họ tên người đi cùng trẻ</label>
                                            <input
                                                type="text"
                                                value={escortName}
                                                onChange={e => setEscortName(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                                placeholder="Họ tên người đi cùng"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">13. Mối quan hệ với trẻ</label>
                                            <select
                                                value={escortRelation}
                                                onChange={e => setEscortRelation(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                            >
                                                <option value="">Chọn mối quan hệ...</option>
                                                <option value="Bố">Bố</option>
                                                <option value="Mẹ">Mẹ</option>
                                                <option value="Ông">Ông</option>
                                                <option value="Bà">Bà</option>
                                                <option value="Anh">Anh</option>
                                                <option value="Chị">Chị</option>
                                                <option value="Người giám hộ">Người giám hộ</option>
                                                <option value="Khác">Khác</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">14. Điện thoại</label>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold"
                                                placeholder="Số điện thoại"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">15. Số định danh người giám hộ</label>
                                            <input
                                                type="text"
                                                value={guardianCccd}
                                                onChange={e => setGuardianCccd(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold"
                                                placeholder="Số định danh"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">16. Họ tên người giám hộ</label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={e => setGuardianName(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                                placeholder="Họ tên người giám hộ"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">17. Con thứ mấy</label>
                                            <input
                                                type="number"
                                                value={conThuMay}
                                                onChange={e => setConThuMay(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                                placeholder="VD: 1, 2..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">18. Tổng số con</label>
                                            <input
                                                type="number"
                                                value={tongSoCon}
                                                onChange={e => setTongSoCon(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                                placeholder="Tổng số con"
                                            />
                                        </div>
                                        <div className="relative z-20">
                                            <Combobox<CatalogItem>
                                                label="19. Tỉnh/Thành phố của người giám hộ"
                                                value={String(maTinhCuTruNghMe || '')}
                                                displayValue={item => item?.name || ''}
                                                onChange={val => {
                                                    setMaTinhCuTruNghMe(val);
                                                    setMaXaCuTruNghMe('');
                                                }}
                                                options={provinces}
                                                columns={commonColumns}
                                                placeholder="Chọn tỉnh/thành..."
                                            />
                                        </div>
                                        <div className="relative z-10 md:col-span-2">
                                            <Combobox<CatalogItem>
                                                label="20. Phường/Xã của người giám hộ"
                                                value={String(maXaCuTruNghMe || '')}
                                                displayValue={item => item?.name || ''}
                                                onChange={val => setMaXaCuTruNghMe(val)}
                                                options={wardsNghMe}
                                                columns={commonColumns}
                                                placeholder="Chọn phường/xã..."
                                                disabled={!maTinhCuTruNghMe}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            </fieldset>
        </div>
    );
};

export default AdminTab;

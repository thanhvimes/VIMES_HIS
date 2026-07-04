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
            {/* Action Row: Search/Sync HIS & Autofill Tab */}
            {/* Quy trình phê duyệt tab */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Hành chính &amp; Đặc thù
                    </span>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Người nhập liệu:</label>
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
                            className="min-w-[250px]"
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

            {!isTabLocked && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4">
                    <div className="flex flex-1 max-w-lg items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-4 h-4 text-slate-400" />
                            </span>
                            <input 
                                type="text" 
                                placeholder="Tìm theo số thẻ CCCD, mã hồ sơ, số điện thoại..." 
                                value={hisSearchQuery}
                                onChange={e => setHisSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFetchHisData(); } }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleFetchHisData}
                            disabled={isFetchingHis}
                            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-lg text-sm font-bold shadow-md shadow-teal-500/10 flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50 transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                            {isFetchingHis ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <SearchIcon className="w-4 h-4"/>}
                            Tìm kiếm
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleAutofillTab('admin')}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0f766e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Điền nhanh kết quả mặc định (Hành chính)
                    </button>
                </div>
            )}

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
            <div>
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">I.1. Thông tin cơ bản bệnh nhân</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh nhân</label>
                        <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-teal-700 dark:text-emerald-400 font-bold" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Họ và tên (Chữ in hoa) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={patientName} 
                            onChange={e => {
                                setPatientName(e.target.value.toUpperCase());
                                if (errors.patientName) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.patientName;
                                        return updated;
                                    });
                                }
                            }} 
                            required 
                            className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-teal-700 dark:text-emerald-400 font-bold ${errors.patientName ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} 
                            placeholder="NGUYỄN VĂN A" 
                        />
                        {errors.patientName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.patientName}</p>}
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-500">
                                Số định danh / CCCD / Hộ chiếu {!noCccd && <span className="text-red-500">*</span>}
                            </label>
                            <label className="inline-flex items-center gap-3 cursor-pointer font-normal text-slate-600 dark:text-slate-400 select-none mr-3">
                                <input
                                    type="checkbox"
                                    checked={noCccd}
                                    onChange={e => {
                                        setNoCccd(e.target.checked);
                                        if (e.target.checked) {
                                            setErrors(prev => {
                                                const updated = { ...prev };
                                                delete updated.cccd;
                                                return updated;
                                            });
                                        }
                                    }}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5 m-0 relative top-[1.5px]"
                                />
                                <span className="text-[11px] leading-none">Không sử dụng thẻ CCCD</span>
                            </label>
                        </div>
                        <input 
                            type="text" 
                            value={cccd} 
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setCccd(val);
                                if (errors.cccd) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.cccd;
                                        return updated;
                                    });
                                }
                            }} 
                            required={!noCccd} 
                            className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.cccd ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} 
                            placeholder="038090012345" 
                        />
                        {errors.cccd && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cccd}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Ngày sinh <span className="text-red-500">*</span>
                        </label>
                        <FormDateInput 
                            label=""
                            value={dob} 
                            onChange={e => {
                                setDob(e.target.value);
                                if (errors.dob) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.dob;
                                        return updated;
                                    });
                                }
                            }} 
                            required 
                            className={`w-full !p-2.5 !h-auto border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.dob ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} 
                        />
                        {errors.dob && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.dob}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Giới tính <span className="text-red-500">*</span>
                        </label>
                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                            <option value="">-- Chọn giới tính --</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Số hồ sơ liên thông (MA_LK) <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={docNo} onChange={e => setDocNo(e.target.value)} required className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">I.2. Thông tin cư trú &amp; bổ sung</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Địa chỉ thường trú</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Số điện thoại liên hệ <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            value={phone} 
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setPhone(val);
                                if (errors.phone) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.phone;
                                        return updated;
                                    });
                                }
                            }} 
                            className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.phone ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} 
                        />
                        {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.phone}</p>}
                    </div>
                    {/* Row 2: Comboboxes */}
                    <div className="relative z-30">
                        <Combobox<CatalogItem>
                            label="Quốc tịch"
                            value={String(quocTich || '')}
                            displayValue={item => item.name}
                            onChange={val => {
                                setQuocTich(val);
                                if (errors.quocTich) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.quocTich;
                                        return updated;
                                    });
                                }
                            }}
                            options={nations}
                            columns={commonColumns}
                            placeholder="Chọn..."
                            required={true}
                        />
                        {errors.quocTich && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.quocTich}</p>}
                    </div>
                    <div className="relative z-30">
                        <Combobox<CatalogItem>
                            label="Dân tộc"
                            value={String(ethnic || '')}
                            displayValue={item => item.name}
                            onChange={val => setEthnic(val)}
                            options={ethnicities}
                            columns={commonColumns}
                            placeholder="Chọn..."
                        />
                    </div>
                    <div className="relative z-30">
                        <Combobox<CatalogItem>
                            label="Nghề nghiệp"
                            value={String(maNgheNghiep || '')}
                            displayValue={item => item.name}
                            onChange={val => setMaNgheNghiep(val)}
                            options={occupations}
                            columns={commonColumns}
                            placeholder="Chọn..."
                        />
                    </div>

                    {/* Row 3: Locations and Workplace */}
                    <div className="relative z-20">
                        <Combobox<CatalogItem>
                            label="Tỉnh / TP"
                            value={String(maTinhCuTru || '')}
                            displayValue={item => item.name}
                            onChange={val => {
                                setMaTinhCuTru(val);
                                setMaXaCuTru('');
                                if (errors.maTinhCuTru) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.maTinhCuTru;
                                        return updated;
                                    });
                                }
                            }}
                            options={provinces}
                            columns={commonColumns}
                            placeholder="Chọn Tỉnh/TP..."
                            required={true}
                        />
                        {errors.maTinhCuTru && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.maTinhCuTru}</p>}
                    </div>
                    <div className="relative z-20">
                        <Combobox<CatalogItem>
                            label="Phường/Xã"
                            value={String(maXaCuTru || '')}
                            displayValue={item => item.name}
                            onChange={val => setMaXaCuTru(val)}
                            options={wards}
                            columns={commonColumns}
                            placeholder="Chọn Xã/Phường..."
                        />
                    </div>
                    <div className="relative z-20">
                        <Combobox<CatalogItem>
                            label="Nơi công tác"
                            value={String(noiCongTacHienTai || '')}
                            displayValue={item => item.name}
                            onChange={(val, item) => {
                                if (item) {
                                    setNoiCongTacHienTai(item.name);
                                } else {
                                    setNoiCongTacHienTai(String(val));
                                }
                            }}
                            options={workplaces}
                            columns={commonColumns}
                            placeholder="Chọn hoặc nhập nơi công tác..."
                        />
                    </div>

                    {/* Row 4: Blood, Target, Fund */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nhóm máu</label>
                        <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                            <option value="">-- Chọn nhóm máu --</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Đối tượng khám</label>
                        <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                            <option value="">-- Chọn đối tượng --</option>
                            <option value="1">Người cao tuổi</option>
                            <option value="2">Người khuyết tật</option>
                            <option value="3">Người thuộc hộ nghèo, cận nghèo</option>
                            <option value="4">Người có công</option>
                            <option value="5">Người mắc bệnh mạn tính</option>
                            <option value="6">Người sống tại vùng đồng bào dân tộc thiểu số và miền núi</option>
                            <option value="7">Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn</option>
                            <option value="8">Người sống tại xã đảo</option>
                            <option value="9">Người sống tại đặc khu</option>
                            <option value="10">Trẻ em trong cơ sở giáo dục mầm non</option>
                            <option value="11">Học sinh trong các cơ sở giáo dục phổ thông</option>
                            <option value="12">Sinh viên</option>
                            <option value="13">Người lao động</option>
                            <option value="14">Các đối tượng khác</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nguồn kinh phí khám</label>
                        <select value={fundingSource} onChange={e => setFundingSource(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                            <option value="">-- Chọn nguồn kinh phí --</option>
                            <option value="1">Ngân sách Trung ương</option>
                            <option value="2">Ngân sách Địa phương</option>
                            <option value="3">Quỹ Bảo hiểm y tế</option>
                            <option value="4">Người sử dụng lao động</option>
                            <option value="5">Xã hội hóa</option>
                            <option value="9">Khác</option>
                        </select>
                    </div>

                    {/* Row 5: CCCD date, CCCD place */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Ngày cấp CCCD/Hộ chiếu</label>
                        <FormDateInput label="" value={cccdDate} onChange={e => setCccdDate(e.target.value)} className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 !rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nơi cấp CCCD/Hộ chiếu</label>
                        <input type="text" value={cccdPlace} onChange={e => setCccdPlace(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Cục Cảnh sát QLHC về TTXH..." />
                    </div>

                    {/* Row 6: Reason, exam date */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Lý do khám sức khỏe</label>
                        <input type="text" value={lyDoVv} onChange={e => setLyDoVv(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Ngày khám sức khỏe</label>
                        <FormDateInput label="" value={ngayVao} onChange={e => setNgayVao(e.target.value)} className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 !rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>

                    {/* Row 7: GLN, CSKCB */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mã cơ sở y tế theo GLN (13 ký tự)</label>
                        <input type="text" value={maGtinCskcb} disabled className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed" placeholder="Mã GLN 13 số" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mã cơ sở KCB (MA_CSKCB)</label>
                        <input type="text" value={maCskcb} disabled className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed" placeholder="15124" />
                    </div>
                </div>
            </div>

            {/* Form-specific Fields */}
            {(isStudent || isChild || formType === '2' || formType === '3' || formType === '4' || formType === '5') && (
                <div>
                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4 flex items-center justify-between">
                        <span>I.3. Thông tin đặc thù biểu mẫu ({formType})</span>
                        <span className="text-[10px] normal-case font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/40">// Dữ liệu đặc thù VNeID (HIS chưa hỗ trợ)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {formType === '2' && (
                             <>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Ngày bắt đầu làm việc hiện tại</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <FormDateInput label="" value={ngayBatDauLamViecHienTai} onChange={e => setNgayBatDauLamViecHienTai(e.target.value)} className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 !rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                 </div>
                                 <div className="md:col-span-3 border-t border-dashed border-slate-200 dark:border-slate-700 my-2 pt-2">
                                     <span className="text-xs font-bold text-slate-400">QUÁ TRÌNH CÔNG TÁC TRƯỚC ĐÂY (Lịch sử nghề nghiệp 10 năm gần nhất):</span>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Nghề, công việc trước đây</label>
                                     <input type="text" value={ngheCongViecTruocDay} onChange={e => setNgheCongViecTruocDay(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: Lái xe, Cơ khí..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Thời gian làm việc (Năm / Tháng)</label>
                                     <div className="flex gap-2">
                                         <input type="number" value={thoiGianLamViecTruocDayNam} onChange={e => setThoiGianLamViecTruocDayNam(e.target.value)} className="w-1/2 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Năm (VD: 3)" />
                                         <input type="number" value={thoiGianLamViecTruocDayThang} onChange={e => setThoiGianLamViecTruocDayThang(e.target.value)} className="w-1/2 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Tháng (VD: 6)" />
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Thời gian làm việc (Từ ngày - Đến ngày)</label>
                                     <div className="flex gap-2">
                                         <FormDateInput label="" value={tuNgayLamViecTruocDay} onChange={e => setTuNgayLamViecTruocDay(e.target.value)} className="w-full !p-2 border border-slate-300 dark:border-slate-600 !rounded-lg !text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" containerClassName="w-1/2" />
                                         <FormDateInput label="" value={denNgayLamViecTruocDay} onChange={e => setDenNgayLamViecTruocDay(e.target.value)} className="w-full !p-2 border border-slate-300 dark:border-slate-600 !rounded-lg !text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" containerClassName="w-1/2" />
                                     </div>
                                 </div>
                             </>
                         )}
                         {isStudent && (
                             <>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Họ tên bố/mẹ/Người giám hộ</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>CCCD người giám hộ</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={guardianCccd} onChange={e => setGuardianCccd(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                 </div>
                             </>
                         )}

                         {isChild && (
                             <>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Họ tên người đi cùng trẻ</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={escortName} onChange={e => setEscortName(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>CCCD người đi cùng</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={escortCccd} onChange={e => setEscortCccd(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Quan hệ với trẻ</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <select value={escortRelation} onChange={e => setEscortRelation(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                         <option value="">-- Chọn quan hệ --</option>
                                         <option value="1">Cha</option>
                                         <option value="2">Mẹ</option>
                                         <option value="3">Ông/Bà</option>
                                         <option value="4">Anh/Chị</option>
                                         <option value="9">Khác</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Con thứ mấy</label>
                                     <input type="number" value={conThuMay} onChange={e => setConThuMay(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: 1" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Tổng số con</label>
                                     <input type="number" value={tongSoCon} onChange={e => setTongSoCon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: 2" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Mã Tỉnh cư trú mẹ/giám hộ</label>
                                     <input type="text" value={maTinhCuTruNghMe} onChange={e => setMaTinhCuTruNghMe(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: 01" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Mã Xã cư trú mẹ/giám hộ</label>
                                     <input type="text" value={maXaCuTruNghMe} onChange={e => setMaXaCuTruNghMe(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: 00001" />
                                 </div>
                             </>
                         )}

                         {formType === '3' && (
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                     <span>Hạng GPLX đề nghị</span>
                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                 </label>
                                 <input type="text" value={licenseClass} onChange={e => setLicenseClass(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="B2, C, D..." />
                             </div>
                         )}

                         {formType === '4' && (
                             <>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Chức danh công việc</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={chucDanh} onChange={e => setChucDanh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Lái tàu, Điều độ..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Đơn vị công tác</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={noiCongTac} onChange={e => setNoiCongTac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Đạt chuẩn đường sắt</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <select value={railwayFit} onChange={e => setRailwayFit(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                         <option value="">-- Chọn đạt chuẩn --</option>
                                         <option value="1">Đủ tiêu chuẩn nhân viên chạy tàu</option>
                                         <option value="0">Không đủ tiêu chuẩn</option>
                                     </select>
                                 </div>
                             </>
                         )}

                         {formType === '5' && (
                             <>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Vị trí làm việc</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={viTriLamViec} onChange={e => setViTriLamViec(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Thủy thủ..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Bộ phận làm việc</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <input type="text" value={boPhanLamViec} onChange={e => setBoPhanLamViec(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Boong, Máy..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                         <span>Khả năng đi biển / Chịu sóng</span>
                                         <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                     </label>
                                     <select value={offshoreExp} onChange={e => setOffshoreExp(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                         <option value="">-- Chọn khả năng --</option>
                                         <option value="1">Đạt (Sức chịu sóng tốt)</option>
                                         <option value="2">Khả năng trung bình</option>
                                         <option value="3">Kém / Say sóng nặng</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Chức danh trên tàu</label>
                                     <input type="text" value={chucDanhTrenTau} onChange={e => setChucDanhTrenTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: Đại phó..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Tên chủ tàu</label>
                                     <input type="text" value={tenChuTau} onChange={e => setTenChuTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Tên Công ty vận tải biển..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Địa chỉ chủ tàu</label>
                                     <input type="text" value={diaChiChuTau} onChange={e => setDiaChiChuTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Địa chỉ trụ sở chủ tàu..." />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">Khu vực hoạt động</label>
                                     <select value={khuVucHoatDongTau} onChange={e => setKhuVucHoatDongTau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                         <option value="">-- Chọn khu vực --</option>
                                         <option value="1">Trong nước</option>
                                         <option value="2">Quốc tế</option>
                                     </select>
                                 </div>
                             </>
                         )}
                    </div>
                </div>
            )}
            </fieldset>
        </div>
    );
};

export default AdminTab;

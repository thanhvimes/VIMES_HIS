import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../../contexts/SessionContext';
import { useCatalogs } from '../../../contexts/CatalogContext';
import {
    ExtendedFormData, emptyPatient,
    parseScannedData, getLocalDateString, CURRENT_HOSPITAL_CODE, formatDateForInput
} from '../utils/registrationUtils';
import { calculateAge } from '../../../utils/formatters';
import { apiClient } from '../../../services/apiClient';
import { CatalogItem } from '../../../services/catalogService';

// ─── Kiểu dữ liệu nội bộ ────────────────────────────────────────────────────
type FormViewMode = 'ADD' | 'EDIT' | 'VIEW';
export type RegistrationModeType = 'ADD_PATIENT' | 'ADD_DOC' | 'ADD_EXAM' | 'NONE'; // Tương ứng với DB mode

interface ToastState {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}



// ─── Hook chính ──────────────────────────────────────────────────────────────
export const useRegistration = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { userInfo } = useSession();

    // Form & UI state
    const [formData, setFormData] = useState<ExtendedFormData>(emptyPatient);
    const [mode, setMode] = useState<FormViewMode>('ADD');
    const [regMode, setRegMode] = useState<RegistrationModeType>('ADD_PATIENT'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [originalData, setOriginalData] = useState<ExtendedFormData | null>(null);
    const [toast, setToast] = useState<ToastState | null>(null);
    const [checkInResponse, setCheckInResponse] = useState<any>(null); // Lưu kết quả trả về từ BHXH

    // Access Global Catalogs
    const { 
        provinces, departments, ethnicities, occupations, 
        objects: patientObjects, examTypes, nations, 
        relationships, workplaces, roomsAll,
        getRoomsByDept, getWards
    } = useCatalogs();

    const [wards, setWards] = useState<CatalogItem[]>([]);
    const [hospitals, setHospitals] = useState<CatalogItem[]>([]);
    const [insRouteTypes, setInsRouteTypes] = useState<CatalogItem[]>([]);

    const areaOptions: CatalogItem[] = [
        { code: 'K1', name: 'K1 - Khu vực đặc biệt khó khăn' },
        { code: 'K2', name: 'K2 - Khu vực kinh tế xã hội khó khăn' },
        { code: 'K3', name: 'K3 - Khu vực sinh sống' },
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────
    const showToast = useCallback((type: ToastState['type'], message: string) => {
        setToast({ id: Date.now(), type, message });
    }, []);

    const handleInputChange = useCallback((name: string, value: any) => {
        if (name === 'regRoom') {
            // Khi chọn PHÒNG KHÁM, tự động cập nhật KHOA tương ứng từ roomsAll
            const targetRoom = roomsAll.find(r => String(r.id) === String(value));
            const newDeptId = targetRoom?.deptId || targetRoom?.dept_id;
            
            setFormData(prev => ({ 
                ...prev, 
                regRoom: value,
                regDepartment: newDeptId ? String(newDeptId) : prev.regDepartment
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, [roomsAll]);

    const handleSetRegMode = useCallback((newMode: RegistrationModeType) => {
        setRegMode(newMode);
        if (newMode === 'ADD_DOC' || newMode === 'ADD_EXAM') {
            if (userInfo?.deptId) {
                setFormData(prev => ({ ...prev, regDepartment: userInfo.deptId }));
            }
        }
    }, [userInfo]);

    // Tự động tính tuổi khi ngày sinh thay đổi
    useEffect(() => {
        if (formData.dob) {
            const age = calculateAge(formData.dob);
            if (age !== formData.age) {
                setFormData(prev => ({ ...prev, age }));
            }
        }
    }, [formData.dob]);

    const rooms = useMemo(() => {
        // Luôn sử dụng mã khoa của user nếu regDepartment chưa có
        const effectiveDept = formData.regDepartment || userInfo?.deptId;
        return getRoomsByDept(effectiveDept);
    }, [getRoomsByDept, formData.regDepartment, userInfo?.deptId]);

    // Independent clinical data not in common catalog (e.g. Hospitals is large)
    useEffect(() => {
        apiClient.get<any[]>('/reception/catalogs/hospitals').then(data => {
            setHospitals(data.map((h: any) => ({
                id: String(h.code ?? h.id ?? '').trim(),
                code: String(h.code ?? h.id ?? '').trim(),
                name: h.name
            })));
        });
        apiClient.get<CatalogItem[]>('/reception/catalogs', { id: 'sys_ma_doituong_kcb' }).then(setInsRouteTypes);
    }, []);

    // Set defaults when starting fresh
    useEffect(() => {
        if (!patientId && departments.length > 0) {
            setFormData(prev => ({
                ...prev,
                regDepartment: prev.regDepartment || userInfo?.deptId || String(departments[0]?.id ?? ''),
                regRoom: prev.regRoom || String(userInfo?.roomId || ''),
                patientType: prev.patientType || patientObjects[0]?.id || '7'
            }));
        }
    }, [patientId, departments, patientObjects, userInfo]);

    // ── 2. Load danh sách Xã/Phường khi đổi Tỉnh ─────────────────────────────
    useEffect(() => {
        if (!formData.provinceId) { setWards([]); return; }
        getWards(formData.provinceId).then(data => {
            setWards(data.map((w: any) => ({ id: String(w.id ?? ''), code: String(w.id ?? ''), name: w.name })));
        });
    }, [formData.provinceId, getWards]);

    // ── 3. Load bệnh nhân theo URL param ─────────────────────────────────────
    useEffect(() => {
        if (!patientId) { 
            setMode('ADD'); 
            setRegMode('ADD_PATIENT'); 
            setFormData(emptyPatient); // Reset form data when starting a clean registration
            setSearchQuery('');
            return; 
        }

        const load = async () => {
            setIsLoading(true);
            try {
                const found = await apiClient.get<any>(`/reception/patients/${patientId}`);
                if (found) {
                    const loaded: ExtendedFormData = {
                        ...emptyPatient,
                        ...found,
                        id: String(found.patientId || found.id || ''),
                        recordNumber: String(found.recordNumber || ''),
                        regDate: getLocalDateString(),
                        history: found.history || []
                    };
                    
                    // Smart override: If creating a new visit or exam, default to CURRENT USER's department
                    if (!loaded.recordNumber || loaded.recordNumber === '') {
                        if (userInfo?.deptId) loaded.regDepartment = userInfo.deptId;
                    } else {
                        // Default to current user's department for consistency
                        if (userInfo?.deptId) loaded.regDepartment = userInfo.deptId;
                    }

                    setFormData(loaded);
                    setOriginalData(JSON.parse(JSON.stringify(loaded)));
                    setMode('VIEW');
                    setRegMode('NONE'); 
                } else {
                    showToast('error', 'Không tìm thấy bệnh nhân');
                    navigate('/reception/register');
                }
            } catch (err: any) {
                showToast('error', 'Lỗi tải dữ liệu: ' + err.message);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [patientId]);  // eslint-disable-line

    // ═══════════════════════════════════════════════════════════════════════════
    // BƯỚC 3: XỬ LÝ QUÉT QR (CCCD / BHYT / Mã hồ sơ)
    // ═══════════════════════════════════════════════════════════════════════════
    const handleScan = useCallback(async (rawString: string): Promise<boolean> => {
        if (!rawString.trim()) return false;

        const parsed = parseScannedData(rawString.trim());
        if (parsed) {
            setFormData(prev => ({ ...prev, ...parsed.data }));
            setSearchQuery('');
            setIsLoading(true);
            try {
                const lookupParam = parsed.type === 'CCCD'
                    ? { cccd: parsed.data.identityCard }
                    : { bhyt: parsed.data.insuranceNumber };

                const lookup = await apiClient.get<{ found: boolean; type: string; data: any }>(
                    '/reception/lookup', lookupParam
                );

                if (lookup.found) {
                    const patientNo = lookup.data.patientNo;
                    const fullData = await apiClient.get<any>(`/reception/patients/${patientNo}`);
                    if (fullData) {
                        const hasActiveDocToday = !!fullData.recordNumber;
                        
                        setFormData(prev => ({
                            ...emptyPatient,
                            ...fullData,
                            ...parsed.data,
                            id: String(fullData.patientId || fullData.id || ''),
                            regDate: getLocalDateString(),
                            history: fullData.history || [],
                            // Default to current user's dept for the new action
                            regDepartment: userInfo?.deptId || fullData.regDepartment || prev.regDepartment
                        }));
                        setMode('VIEW');
                        setRegMode('NONE');
                        
                        showToast('info', `Tìm thấy BN: ${fullData.name}. Khoa tiếp đón: ${userInfo?.deptId || 'Mặc định'}`);
                    }
                } else {
                    setRegMode('ADD_PATIENT');
                    setMode('ADD');
                    showToast('success', `Đã quét ${parsed.type} — Bệnh nhân mới, vui lòng bổ sung thông tin`);
                }
            } catch (e: any) {
                showToast('error', 'Lỗi tra cứu: ' + (e.message || 'Server Error'));
            } finally {
                setIsLoading(false);
            }
            return true;
        }

        setIsLoading(true);
        try {
            const lookup = await apiClient.get<{ found: boolean; type: string; data: any }>(
                '/reception/lookup', { docNo: rawString.trim() }
            );
            if (lookup.found) {
                const docNo = lookup.data.docNo || lookup.data.patientNo;
                navigate(`/reception/register/${docNo}`);
                setSearchQuery('');
                return true;
            }
            showToast('error', `Không tìm thấy hồ sơ: "${rawString}"`);
        } catch (e: any) {
            showToast('error', 'Lỗi tìm kiếm: ' + (e.message || 'Server Error'));
        } finally {
            setIsLoading(false);
        }
        return false;
    }, [navigate, showToast]);

    // ═══════════════════════════════════════════════════════════════════════════
    // BƯỚC 4 / 5: LƯU PHIẾU KHÁM
    // ═══════════════════════════════════════════════════════════════════════════
    const handleSave = useCallback(async (): Promise<boolean> => {
        // Validation
        if (!formData.name?.trim()) {
            showToast('error', 'Vui lòng nhập Họ và tên bệnh nhân');
            return false;
        }
        if (!formData.dob) {
            showToast('error', 'Vui lòng nhập Ngày sinh bệnh nhân');
            return false;
        }
        if (!formData.gender) {
            showToast('error', 'Vui lòng chọn Giới tính');
            return false;
        }
        if (!formData.identityCard?.trim()) {
            showToast('error', 'Vui lòng nhập số CCCD/CMND');
            return false;
        }
        if (!formData.nationality) {
            showToast('error', 'Vui lòng chọn Quốc tịch');
            return false;
        }
        if (!formData.phone?.trim()) {
            showToast('error', 'Vui lòng nhập số Điện thoại');
            return false;
        }
        if (!formData.provinceId) {
            showToast('error', 'Vui lòng chọn Tỉnh / TP');
            return false;
        }

        if (!formData.regDateTime) {
            showToast('error', 'Vui lòng nhập Ngày giờ đăng ký');
            return false;
        }
        if (!formData.patientType) {
            showToast('error', 'Vui lòng chọn Đối tượng');
            return false;
        }
        if (!formData.regRoom) {
            showToast('error', 'Vui lòng chọn Phòng khám');
            return false;
        }
        if (!formData.regExamType) {
            showToast('error', 'Vui lòng chọn Loại hình khám');
            return false;
        }

        setIsSaving(true);
        try {
            let result: any;
            const payload = { ...formData, mode: regMode };

            if (regMode === 'ADD_EXAM' && formData.recordNumber) {
                // Thêm phiếu khám vào HS đang mở
                result = await apiClient.post<any>(`/reception/patients/${formData.id}/exams`, payload);
                showToast('success', 'Đã thêm phiếu đăng ký mới thành công!');
            } else if (regMode === 'ADD_DOC' && formData.id) {
                // Tiếp đón lượt mới cho BN cũ
                result = await apiClient.post<any>(`/reception/patients/${formData.id}/register`, payload);
                showToast('success', 'Đã tạo lượt khám mới thành công!');
            } else if (mode === 'EDIT' && formData.recordNumber) {
                // CẬP NHẬT thông tin lượt khám hiện tại (PUT)
                result = await apiClient.put<any>(`/reception/patients/${formData.recordNumber}`, payload);
                showToast('success', 'Đã cập nhật thông tin thành công!');
            } else if (mode === 'ADD' || regMode === 'ADD_PATIENT') {
                // Tạo mới hoàn toàn (BN mới + Tiếp đón)
                result = await apiClient.post<any>('/reception/patients', payload);
                showToast('success', 'Đã đăng ký bệnh nhân và tiếp đón thành công!');
            } else {
                // Dự phòng
                result = await apiClient.put<any>(`/reception/patients/${formData.recordNumber || formData.id}`, payload);
                showToast('success', 'Đã cập nhật thông tin!');
            }

            const dbData = result?.data || {};
            setFormData(prev => ({
                ...prev,
                id: dbData.patientNo ? String(dbData.patientNo) : prev.id,
                recordNumber: dbData.docNo ? String(dbData.docNo) : prev.recordNumber,
                receptNo: dbData.receptNo ? String(dbData.receptNo) : prev.receptNo,
            }));
            const finalData = { ...formData, ...dbData };
            setOriginalData(JSON.parse(JSON.stringify(finalData)));
            setMode('VIEW');
            setRegMode('NONE'); // Sau khi lưu, thông tin đã hoàn tất, không mặc định thêm gì
            return true;
        } catch (error: any) {
            showToast('error', `Lỗi khi lưu: ${error.message || 'Lỗi hệ thống'}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [formData, mode, regMode, showToast]);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK-IN BHXH: Kiểm tra thẻ BHYT từ cổng giám định BHXH
    // ═══════════════════════════════════════════════════════════════════════════
    const handleCheckIn = useCallback(async () => {
        if (!formData.insuranceNumber || formData.insuranceNumber.length < 10) {
            showToast('error', 'Số thẻ BHYT không hợp lệ (cần ít nhất 10 ký tự)');
            return;
        }
        setIsLoading(true);
        try {
            const birthYear = formData.dob ? parseInt(formData.dob.split('-')[0]) : 0;
            const payload = {
                cardNo: formData.insuranceNumber,
                patientName: formData.name,
                birthYear: birthYear,
                dob: formData.dob
            };
            const res = await apiClient.post<any>('/reception/insurance/check', payload);
            setCheckInResponse(res); 
            
            if (res?.success) {
                showToast('success', 'Đã lấy lời giải đáp từ cổng BHXH. Vui lòng kiểm tra và Nhấn Chấp nhận.');
            } else {
                showToast('error', res?.message || 'Không tìm thấy thông tin trên cổng BHXH');
            }
        } catch (error: any) {
            showToast('error', `Lỗi kết nối BHXH: ${error.message || 'Server Error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [formData, showToast]);

    const handleAcceptCheckIn = useCallback(() => {
        if (!checkInResponse?.success) {
            setCheckInResponse(null);
            return;
        }
        
        const info = checkInResponse.data || {};
        const regCode = (info.maDKBD || '').trim();
        const isCurrentHospital = regCode === CURRENT_HOSPITAL_CODE;
        
        // Luôn so sánh và lấy Thẻ mới nhất nếu cổng trả về (Gia hạn thẻ)
        const finalCardNo = info.newCardNo || info.cardNo || formData.insuranceNumber;
        const finalStartDate = info.startDateNew || info.startDate || formData.insuranceRegDate;
        const finalEndDate = info.endDateNew || info.endDate || formData.insuranceExp;

        const newRoute = formData.route === 'Cấp cứu' ? 'Cấp cứu'
            : (isCurrentHospital ? 'Đúng tuyến' : 'Trái tuyến');
        
        let routeType = '1.1';
        if (newRoute === 'Trái tuyến') routeType = '3.3';
        else if (newRoute === 'Cấp cứu') routeType = '2.1';

        setFormData(prev => ({
            ...prev,
            insuranceNumber: finalCardNo,
            insuranceRegCode: regCode,
            insurancePlace: regCode,
            insuranceObject: finalCardNo.substring(0, 2),
            insuranceArea: info.maKV || prev.insuranceArea,
            insuranceRegDate: finalStartDate ? formatDateForInput(finalStartDate) : prev.insuranceRegDate,
            insuranceExp: finalEndDate ? formatDateForInput(finalEndDate) : prev.insuranceExp,
            insurance5Year: info.fiveYearDate ? formatDateForInput(info.fiveYearDate) : prev.insurance5Year,
            route: newRoute,
            insuranceRouteType: routeType,
            name: prev.name || info.name,
            gender: prev.gender || (info.gender === '1' ? 'Nam' : 'Nữ'),
            address: prev.address || info.address,
        }));
        
        setCheckInResponse(null);
        showToast('success', 'Đã cập nhật thông tin thẻ mới nhất!');
    }, [checkInResponse, formData, showToast]);

    return {
        formData, setFormData, mode, setMode, regMode, setRegMode: handleSetRegMode, searchQuery, setSearchQuery,
        isSaving, isLoading, originalData, toast, setToast, checkInResponse, setCheckInResponse,
        provinces, wards, departments, rooms, ethnicities, occupations,
        examTypes, patientObjects, hospitals, insRouteTypes, areaOptions,
        nations, relationships, workplaces,
        handleInputChange, handleSave, handleScan, handleCheckIn, handleAcceptCheckIn, showToast,
        hasActiveDocToday: !!formData.recordNumber
    };
};

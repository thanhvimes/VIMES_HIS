
import React, { useState, useEffect } from 'react';
import { LayoutGrid, UserPlus, FileText, ClipboardList, Star, Video, GitBranch, CheckCircle, Activity, Wallet, MapPin, Hash, Server, Map, ListChecks, Loader2, UserCheck, Droplet } from 'lucide-react';
import { AppSettings, Department, Area, Room } from '../../types';
import { apiGetDepartments, apiGetAreas, apiGetRooms } from '../../services/apiService';

interface KioskTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
    onPreviewScreensaver?: () => void;
}

const KioskTab: React.FC<KioskTabProps> = ({ settings, onUpdate, onPreviewScreensaver }) => {
    // State danh mục động
    const [departments, setDepartments] = useState<Department[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    // State Loading
    const [isLoadingDepts, setIsLoadingDepts] = useState(false);
    const [isLoadingAreas, setIsLoadingAreas] = useState(false);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    const [enableRoomFilter, setEnableRoomFilter] = useState(false);

    // Tải Khoa và Khu vực khi mount
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingDepts(true);
            setIsLoadingAreas(true);
            try {
                const [deptsData, areasData] = await Promise.all([
                    apiGetDepartments(),
                    apiGetAreas()
                ]);
                console.log("Loaded Categories:", { departments: deptsData, areas: areasData });
                setDepartments(deptsData);
                setAreas(areasData);
            } catch (e) {
                console.error("Failed to load kiosk categories", e);
            } finally {
                setIsLoadingDepts(false);
                setIsLoadingAreas(false);
            }
        };
        loadInitialData();
    }, []);

    // Tải danh sách phòng khi areaCode thay đổi
    useEffect(() => {
        if (settings.areaCode) {
            const loadRooms = async () => {
                setIsLoadingRooms(true);
                try {
                    const roomsData = await apiGetRooms(settings.areaCode!);
                    setRooms(roomsData);
                } catch (e) {
                    console.error("Failed to load rooms", e);
                } finally {
                    setIsLoadingRooms(false);
                }
            };
            loadRooms();
        } else {
            setRooms([]);
        }
    }, [settings.areaCode]);

    // Khởi tạo trạng thái bộ lọc phòng dựa trên settings hiện tại
    useEffect(() => {
        if (settings.selectedRooms && settings.selectedRooms.length > 0) {
            setEnableRoomFilter(true);
        }
    }, [settings.selectedRooms]);

    const toggleModule = (key: keyof AppSettings['enabledModules']) => {
        onUpdate({
            ...settings,
            enabledModules: {
                ...settings.enabledModules,
                [key]: !settings.enabledModules[key]
            }
        });
    };

    const handleToggleRoom = (roomId: string) => {
        const currentSelected = settings.selectedRooms || [];
        let newSelected: string[];

        if (currentSelected.includes(roomId)) {
            newSelected = currentSelected.filter(c => c !== roomId);
        } else {
            newSelected = [...currentSelected, roomId];
        }

        onUpdate({ ...settings, selectedRooms: newSelected });
    };

    const toggleRoomFilter = () => {
        const newState = !enableRoomFilter;
        setEnableRoomFilter(newState);
        if (!newState) {
            onUpdate({ ...settings, selectedRooms: [] });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">

            {/* --- PHẦN 1: TÙY CHỈNH MENU --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h5 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                    <LayoutGrid className="text-purple-600" /> Tùy chỉnh Menu Trang chủ
                </h5>
                <p className="text-sm text-gray-500 mb-6">Bật/tắt các module chức năng hiển thị trên màn hình chính.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-blue-600 shadow-sm"><UserPlus size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Chức năng chính</p>
                                <p className="text-xs text-gray-500">Đăng ký/Lấy số</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enabledModules?.register} onChange={() => toggleModule('register')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-emerald-600 shadow-sm"><FileText size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Thanh toán viện phí</p>
                                <p className="text-xs text-gray-500">Thanh toán viện phí QR Code</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enabledModules?.payment} onChange={() => toggleModule('payment')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-emerald-600 shadow-sm"><FileText size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Tra cứu hồ sơ</p>
                                <p className="text-xs text-gray-500">Kết quả & Đơn thuốc</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enabledModules?.history} onChange={() => toggleModule('history')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-violet-600 shadow-sm"><ClipboardList size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Danh mục dịch vụ</p>
                                <p className="text-xs text-gray-500">Bảng giá niêm yết</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enabledModules?.catalog} onChange={() => toggleModule('catalog')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-amber-500 shadow-sm"><Star size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Đánh giá hài lòng</p>
                                <p className="text-xs text-gray-500">Khảo sát ý kiến</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enabledModules?.feedback} onChange={() => toggleModule('feedback')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-fuchsia-500 shadow-sm"><Video size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Giới thiệu</p>
                                <p className="text-xs text-gray-500">Video & Thông tin</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enabledModules?.intro} onChange={() => toggleModule('intro')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* --- PHẦN 2: QUY TRÌNH --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h5 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                    <GitBranch className="text-indigo-600" /> Quy trình Đăng ký
                </h5>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-lg text-indigo-600 shadow-sm"><CheckCircle size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800">Cho phép chọn Chuyên khoa</p>
                                <p className="text-xs text-gray-500">Bệnh nhân tự chọn khoa khám khi đăng ký</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.enableDepartmentSelection}
                                onChange={() => onUpdate({ ...settings, enableDepartmentSelection: !settings.enableDepartmentSelection })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* NEW: Multi-Specialty Selection Option */}
                    {settings.enableDepartmentSelection && (
                        <div className="flex items-center justify-between p-4 bg-cyan-50/50 rounded-xl border border-cyan-200 ml-8 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2.5 rounded-lg text-cyan-600 shadow-sm"><ListChecks size={20} /></div>
                                <div>
                                    <p className="font-bold text-gray-800">Chọn nhiều chuyên khoa</p>
                                    <p className="text-xs text-gray-500">Cho phép bệnh nhân chọn nhiều chuyên khoa cùng lúc</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.enableMultiSpecialtySelection}
                                    onChange={() => onUpdate({ ...settings, enableMultiSpecialtySelection: !settings.enableMultiSpecialtySelection })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PHẦN 3: LOẠI HÌNH KIOSK --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h5 className="font-bold text-gray-800 text-xl uppercase tracking-tight">Loại hình Kiosk</h5>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { id: 'RECEPTION', name: 'Tiếp đón', sub: 'Quầy Tiếp đón', icon: <UserCheck size={28} />, color: 'text-purple-600' },
                        { id: 'REGISTRATION', name: 'Lấy số Khám', sub: 'Sảnh đón tiếp', icon: <UserPlus size={28} />, color: 'text-blue-600' },
                        { id: 'EXECUTION', name: 'Lấy số CLS', sub: 'Phòng thực hiện', icon: <Video size={28} />, color: 'text-rose-600' },
                        { id: 'SAMPLING', name: 'Lấy mẫu XN', sub: 'Khu Xét nghiệm', icon: <Droplet size={28} />, color: 'text-emerald-600' },
                        { id: 'PAYMENT', name: 'Thanh toán', sub: 'Quầy Thu ngân', icon: <Wallet size={28} />, color: 'text-amber-600' },
                        { id: 'DRUG', name: 'Cấp thuốc', sub: 'Nhà thuốc BN', icon: <FileText size={28} />, color: 'text-slate-600' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => onUpdate({ ...settings, kioskType: type.id as any })}
                            className={`relative p-6 rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${settings.kioskType === type.id 
                                ? 'border-cyan-500 bg-cyan-50/30 shadow-[0_10px_25px_-5px_rgba(6,182,212,0.15)]' 
                                : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200'}`}
                        >
                            {settings.kioskType === type.id && (
                                <div className="absolute top-3 right-3 text-cyan-600 animate-scale-in">
                                    <CheckCircle size={20} fill="currentColor" className="text-white fill-cyan-500" />
                                </div>
                            )}
                            <div className={`p-4 rounded-full shadow-sm transition-all ${settings.kioskType === type.id ? 'bg-white shadow-md scale-110' : 'bg-white'}`}>
                                <span className={type.color}>{type.icon}</span>
                            </div>
                            <div className="text-center">
                                <span className={`block font-bold text-lg leading-tight ${settings.kioskType === type.id ? 'text-cyan-900' : 'text-gray-700'}`}>{type.name}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{type.sub}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Chế độ lấy số - chỉ hiển thị khi là REGISTRATION */}
                {settings.kioskType === 'REGISTRATION' && (
                    <div className="mt-10 pt-8 border-t border-gray-100 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <GitBranch size={20} className="text-emerald-600" />
                            <h6 className="font-bold text-gray-800 text-base">Chế độ lấy số</h6>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'FULL', title: '📋 Đầy đủ', desc: 'Quét CCCD → Form đăng ký → Chọn khoa → Gửi HIS' },
                                { id: 'SCAN_ONLY', title: '📱 Quét nhanh', desc: 'Quét CCCD/BHYT → Cấp số tự động (1→N)' },
                                { id: 'QUICK_BUTTONS', title: '⚡ Bấm nhanh', desc: 'Bấm nút trực tiếp → Cấp số (Nhanh / Ưu tiên)' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => onUpdate({ ...settings, registrationMode: mode.id as any })}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 ${settings.registrationMode === mode.id 
                                        ? 'border-emerald-400 bg-emerald-50/50 shadow-sm ring-4 ring-emerald-50' 
                                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'}`}
                                >
                                    <span className={`block font-bold text-base ${settings.registrationMode === mode.id ? 'text-emerald-900' : 'text-gray-700'}`}>{mode.title}</span>
                                    <span className="text-[11px] text-gray-500 leading-snug block mt-2 opacity-80">{mode.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- PHẦN 4: ĐỊNH DANH & VỊ TRÍ --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <h5 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                    <MapPin className="text-blue-600" /> Định danh & Vị trí
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Hash size={16} /> Mã Kiosk ID
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none uppercase font-mono font-bold transition-all"
                            placeholder="VD: KIOSK-N01"
                            value={settings.kioskId}
                            onChange={e => onUpdate({ ...settings, kioskId: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Server size={16} /> Khoa / Phòng ban quản lý
                            {isLoadingDepts && <Loader2 size={14} className="animate-spin text-primary ml-auto" />}
                        </label>
                        <div className="relative">
                            <select
                                className="w-full p-3 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none appearance-none bg-white font-medium transition-all"
                                value={settings.departmentCode}
                                onChange={e => {
                                    const newDeptCode = e.target.value;
                                    onUpdate({ 
                                        ...settings, 
                                        departmentCode: newDeptCode,
                                        areaCode: '', // Reset area when department changes
                                        selectedRooms: []
                                    });
                                    setEnableRoomFilter(false);
                                }}
                            >
                                <option value="">-- Chọn Khoa --</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.id})</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* --- KHU VỰC & PHÒNG --- */}
                    <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Map size={16} /> Sử dụng Phân loại Khu vực
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.useArea}
                                    onChange={() => onUpdate({ ...settings, useArea: !settings.useArea })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {settings.useArea && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                        Khu vực {isLoadingAreas && <Loader2 size={12} className="animate-spin text-primary" />}
                                    </label>
                                    <select
                                        className="w-full p-3 border border-blue-200 rounded-xl focus:border-blue-500 outline-none bg-white font-medium"
                                        value={settings.areaCode}
                                        onChange={e => {
                                            onUpdate({
                                                ...settings,
                                                areaCode: e.target.value,
                                                selectedRooms: []
                                            });
                                            setEnableRoomFilter(false);
                                        }}
                                    >
                                        <option value="">-- Chọn Khu vực --</option>
                                        {areas
                                            .filter(area => {
                                                const matches = !settings.departmentCode || area.dept_id === settings.departmentCode || !area.dept_id;
                                                return matches;
                                            })
                                            .map(area => (
                                                <option key={String(area.area_id || area.id)} value={String(area.area_id || area.id)}>
                                                    {area.area_name || area.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <ListChecks size={18} className="text-blue-600" />
                                            <span className="font-bold text-sm text-gray-700">Chọn Phòng/Quầy phục vụ cụ thể</span>
                                            {isLoadingRooms && <Loader2 size={14} className="animate-spin text-primary" />}
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer" title="Bật để chọn phòng cụ thể">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={enableRoomFilter}
                                                disabled={!settings.areaCode || isLoadingRooms}
                                                onChange={toggleRoomFilter}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                                        </label>
                                    </div>

                                    {enableRoomFilter && settings.areaCode ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
                                            {rooms.map((room) => {
                                                const isSelected = (settings.selectedRooms || []).includes(String(room.id));
                                                return (
                                                    <div
                                                        key={String(room.id)}
                                                        onClick={() => handleToggleRoom(String(room.id))}
                                                        className={`
                                                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none group
                                                        ${isSelected
                                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                                : 'bg-gray-50 border-transparent hover:bg-gray-100'}
                                                    `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                                                                {String(room.id).substring(0, 3)}
                                                            </div>
                                                            <span className={`text-sm font-bold ${isSelected ? 'text-blue-800' : 'text-gray-600'}`}>
                                                                {room.name}
                                                            </span>
                                                        </div>

                                                        <div className={`relative w-9 h-5 rounded-full transition-colors ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                            <div className={`absolute top-[2px] left-[2px] bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${isSelected ? 'translate-x-full' : 'translate-x-0'}`}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {rooms.length === 0 && !isLoadingRooms && (
                                                <p className="text-center text-gray-400 text-xs py-2">Không tìm thấy phòng nào.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50 rounded-lg">
                                            {isLoadingRooms ? "Đang tải dữ liệu..." : settings.areaCode
                                                ? "Kiosk sẽ phục vụ tất cả các phòng trong khu vực này."
                                                : "Vui lòng chọn Khu vực trước."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-bold text-gray-700">Tên hiển thị (Vị trí đặt Kiosk)</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none transition-all font-bold text-gray-800"
                            placeholder="VD: Sảnh A - Tầng 1 (Khu khám VIP)"
                            value={settings.kioskName}
                            onChange={e => onUpdate({ ...settings, kioskName: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KioskTab;

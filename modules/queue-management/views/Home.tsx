
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  LogOut, 
  ChevronRight, 
  Tv,
  Command,
  ShieldCheck,
  Activity,
  ChevronDown,
  Globe,
  Settings,
  Bell,
  Briefcase,
  Lock
} from 'lucide-react';
import { ViewState, AppSettings, KioskType } from '../types';
import { apiFetch } from '../services/apiService';
import { useSession } from '../../../contexts/SessionContext';
import { useSystemStore } from '../../../stores/useSystemStore';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Quản trị viên',
    doctor: 'Bác sĩ',
    nurse: 'Điều dưỡng',
    technician: 'Kỹ thuật viên',
    receptionist: 'Lễ tân',
    accountant: 'Kế toán',
    pharmacist: 'Dược sĩ',
    hr: 'Nhân sự',
    director: 'Ban Giám đốc',
};

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
};

interface PortalProps {
  onNavigate: (view: ViewState) => void;
  settings: AppSettings;
  onLogout: () => void;
}

const Portal: React.FC<PortalProps> = ({ onNavigate, settings, onLogout }) => {
  const { user } = useSession();
  const { hospitalName, logoUrl } = useSystemStore();
  const greeting = useMemo(() => getGreeting(), []);
  const [areas, setAreas] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('vimes_selected_area');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse vimes_selected_area:', e);
      return null;
    }
  });
  const [selectedRoom, setSelectedRoom] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('vimes_selected_room');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse vimes_selected_room:', e);
      return null;
    }
  });
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    return localStorage.getItem('vimes_selected_dept') || '';
  });
  const [selectedService, setSelectedService] = useState<KioskType>(() => {
    return (localStorage.getItem('vimes_selected_service') as KioskType) || 'REGISTRATION';
  });
  const [showLCDOptions, setShowLCDOptions] = useState(false);

  const [autoLaunchView, setAutoLaunchView] = useState<ViewState | null>(() => {
    return localStorage.getItem('vimes_last_active_display_view') as ViewState | null;
  });
  const [countdown, setCountdown] = useState<number>(5);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);

  useEffect(() => {
    if (!autoLaunchView || isCancelled) return;

    if (countdown <= 0) {
      onNavigate(autoLaunchView);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, autoLaunchView, isCancelled, onNavigate]);

  const handleCancelAutoLaunch = () => {
    setIsCancelled(true);
    setAutoLaunchView(null);
    localStorage.removeItem('vimes_last_active_display_view');
  };

  const getAutoLaunchLabel = (view: ViewState) => {
    switch (view) {
      case 'DISPLAY': return 'Màn hình đơn (Quầy/Phòng khám)';
      case 'CENTRAL_DISPLAY': return 'Màn hình trung tâm sảnh chờ';
      case 'SURGERY_DISPLAY': return 'Bảng trạng thái phòng mổ';
      default: return 'Màn hình hiển thị';
    }
  };

  useEffect(() => {
    fetchAreas();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchRooms(selectedDept);
    } else {
      setRooms([]);
      setSelectedRoom(null);
      localStorage.removeItem('vimes_selected_room');
    }
  }, [selectedDept]);

  const fetchRooms = async (deptId: string) => {
    try {
      const data = await apiFetch(`/api/departments/${deptId}/rooms`);
      setRooms(data || []);
    } catch (e) {
      console.error('Fetch rooms error:', e);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await apiFetch('/api/zoning/areas');
      setAreas(data);
    } catch (e) {
      console.error('Fetch areas error:', e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiFetch('/api/departments');
      setDepartments(data);
    } catch (e) {
      console.error('Fetch departments error:', e);
    }
  };

  const filteredAreas = selectedDept 
    ? areas.filter(a => String(a.dept_id) === String(selectedDept))
    : areas;

  const handleSelectArea = (areaId: string) => {
    const area = areas.find(a => String(a.area_id || a.id) === areaId);
    if (area) {
      localStorage.setItem('vimes_selected_area', JSON.stringify(area));
      setSelectedArea(area);
    }
  };

  const handleSelectDept = (dept: string) => {
    setSelectedDept(dept);
    localStorage.setItem('vimes_selected_dept', dept);
    setSelectedRoom(null);
    localStorage.removeItem('vimes_selected_room');
    if (selectedArea && (selectedArea.dept_code || 'Chưa phân khoa') !== dept && dept !== '') {
        setSelectedArea(null);
        localStorage.removeItem('vimes_selected_area');
    }
  };

  const handleSelectRoom = (roomId: string) => {
    const room = rooms.find(r => String(r.id) === roomId);
    if (room) {
      localStorage.setItem('vimes_selected_room', JSON.stringify(room));
      setSelectedRoom(room);
    } else {
      setSelectedRoom(null);
      localStorage.removeItem('vimes_selected_room');
    }
  };

  const handleSelectService = (service: KioskType) => {
    setSelectedService(service);
    localStorage.setItem('vimes_selected_service', service);
  };

  const getServiceLabel = (type: KioskType) => {
    switch(type) {
      case 'RECEPTION': return 'Tiếp nhận';
      case 'REGISTRATION': return 'Đăng ký khám bệnh';
      case 'EXECUTION': return 'Khám bệnh, CĐHA';
      case 'SAMPLING': return 'Lấy mẫu XN';
      case 'PAYMENT': return 'Thanh toán viện phí';
      case 'DRUG': return 'Lĩnh thuốc';
      case 'SURGERY': return 'Phòng mổ';
      default: return 'Loại dịch vụ';
    }
  };

  const portalItems = [
    {
      id: 'KIOSK',
      title: 'Trạm Cấp Số',
      subtitle: 'Self-Service Kiosk',
      icon: <Monitor size={24} className="text-blue-600" />,
      bgClass: 'bg-white hover:border-blue-200',
      description: 'Giao diện lấy số thứ tự tự động dành cho bệnh nhân. Hỗ trợ quét thẻ BHYT và in phiếu.',
      view: 'KIOSK' as ViewState
    },
    {
      id: 'OPERATOR',
      title: 'Bàn Điều Khiển',
      subtitle: 'Operator Console',
      icon: <LayoutDashboard size={24} className="text-emerald-600" />,
      bgClass: 'bg-white hover:border-emerald-200',
      description: 'Dành cho nhân viên y tế gọi số, chuyển quầy và xử lý bệnh nhân tại khu vực phục vụ.',
      view: 'OPERATOR' as ViewState
    },
    {
      id: 'LCD',
      title: 'Màn Hình LCD',
      subtitle: 'Queue Display',
      icon: <Tv size={24} className="text-purple-600" />,
      bgClass: 'bg-white hover:border-purple-200',
      description: 'Hiển thị danh sách đang gọi và gọi nhỡ cho bệnh nhân theo dõi tại sảnh chờ.',
      view: 'CENTRAL_DISPLAY' as ViewState
    },
    {
      id: 'SURGERY',
      title: 'Màn Hình Phòng Mổ',
      subtitle: 'Surgery Waiting Room',
      icon: <Activity size={24} className="text-rose-600" />,
      bgClass: 'bg-white hover:border-rose-200',
      description: 'Hiển thị thời gian thực trạng thái phẫu thuật, hồi tỉnh và điều trị của bệnh nhân tại khu vực phòng mổ.',
      view: 'SURGERY_DISPLAY' as ViewState
    },
    {
      id: 'SETTINGS_ADMIN',
      title: 'Cấu Hình Hệ Thống',
      subtitle: 'Admin & Settings',
      icon: <Settings size={24} className="text-amber-600" />,
      bgClass: 'bg-white hover:border-amber-200',
      description: 'Thiết lập tham số hệ thống, danh mục khoa phòng, máy in và âm thanh gọi số.',
      view: 'SETTINGS_ADMIN' as ViewState
    }
  ];

  return (
    <div className="h-full w-full bg-[#f8fafc] flex flex-col overflow-hidden font-sans">
      
      {/* Smart TV Auto-Launch Countdown Overlay */}
      {autoLaunchView && !isCancelled && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/95 max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 border border-slate-200/50 flex flex-col items-center text-center gap-6 transform animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner relative">
              <Tv size={36} className="animate-pulse" />
              {/* Outer spinning ring representing the countdown */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            
            <div className="space-y-2">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-blue-100">
                CHẾ ĐỘ TV TỰ ĐỘNG KHỞI ĐỘNG
              </span>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-3">
                Đang mở lại màn hình cuối
              </h3>
              <p className="text-slate-500 font-bold text-sm tracking-wide mt-1">
                {getAutoLaunchLabel(autoLaunchView)}
              </p>
            </div>

            {/* Huge countdown number */}
            <div className="text-7xl font-black text-blue-600 font-mono tracking-tight my-2">
              {countdown}
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000 ease-linear rounded-full" 
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 font-medium max-w-sm">
              Hệ thống ghi nhớ màn hình trước đó của bạn. Bạn không cần làm gì cả. Màn hình sẽ tự động hiển thị trong giây lát.
            </p>

            <button
              onClick={handleCancelAutoLaunch}
              className="mt-2 w-full py-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded-2xl font-black text-xs tracking-[0.2em] transition-all duration-200 border border-slate-200 hover:border-rose-100 active:scale-98 focus:outline-none focus:ring-4 focus:ring-rose-500/20"
            >
              HỦY TỰ ĐỘNG MỞ (QUAY LẠI CẤU HÌNH)
            </button>
          </div>
        </div>
      )}

      {/* Premium Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-1.5 shadow-sm overflow-hidden">
              {logoUrl ? (
                 <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                 <img src="/logo.png" alt="VIMES" className="w-full h-full object-contain" />
              )}
           </div>
           <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                 {hospitalName ? hospitalName.split(' ')[0] : 'VIMES'}{' '}
                 <span className="text-blue-600">COMMAND CENTER</span>
              </h1>
              <div className="flex items-center gap-2">
                 <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                 <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Hệ thống QMS Toàn viện đang trực tuyến</p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           {/* SERVICE TYPE SELECTOR */}
           <div className="flex items-center gap-3 bg-blue-50/50 p-1 rounded-2xl border border-blue-100 shadow-inner group">
              <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                <Briefcase size={18} />
              </div>
              <div className="relative pr-4">
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest ml-1">Loại nghiệp vụ</p>
                <select 
                    value={selectedService}
                    onChange={(e) => handleSelectService(e.target.value as KioskType)}
                    className="bg-transparent px-1 py-0.5 text-xs font-black text-slate-700 appearance-none focus:outline-none cursor-pointer uppercase tracking-wider min-w-[160px]"
                >
                    <option value="RECEPTION">Tiếp nhận</option>
                    <option value="REGISTRATION">Đăng ký khám bệnh</option>
                    <option value="EXECUTION">Khám bệnh, CĐHA</option>
                    <option value="SAMPLING">Lấy mẫu XN</option>
                    <option value="PAYMENT">Thanh toán viện phí</option>
                    <option value="DRUG">Lĩnh thuốc</option>
                    <option value="SURGERY">Phòng mổ</option>
                </select>
                <ChevronDown size={12} className="absolute right-0 top-[60%] -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
           </div>

           {/* DEPT & AREA QUICK SELECT */}
           <div className="hidden lg:flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="relative">
                <select 
                    value={selectedDept}
                    onChange={(e) => handleSelectDept(e.target.value)}
                    className="bg-transparent pl-4 pr-8 py-2 text-[11px] font-black text-slate-600 appearance-none focus:outline-none cursor-pointer uppercase tracking-wider"
                >
                    <option value="">Tất cả Khoa</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              {(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? (
                <div className="relative min-w-[180px]">
                  <select 
                      value={selectedRoom?.id || ''}
                      onChange={(e) => handleSelectRoom(e.target.value)}
                      className="bg-transparent pl-4 pr-8 py-2 text-[11px] font-black text-blue-600 appearance-none focus:outline-none cursor-pointer uppercase tracking-wider font-extrabold"
                  >
                      <option value="" disabled>Chọn Phòng khám</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                </div>
              ) : (
                <div className="relative min-w-[180px]">
                  <select 
                      value={selectedArea?.area_id || selectedArea?.id || ''}
                      onChange={(e) => handleSelectArea(e.target.value)}
                      className="bg-transparent pl-4 pr-8 py-2 text-[11px] font-black text-slate-600 appearance-none focus:outline-none cursor-pointer uppercase tracking-wider"
                  >
                      <option value="" disabled>Chọn Khu vực</option>
                      {filteredAreas.map((area) => (
                        <option key={area.area_id || area.id} value={area.area_id || area.id}>
                          {area.area_name || area.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}
           </div>

           <div className="flex items-center gap-3">
              <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                <Bell size={20} />
              </button>
              <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                <Settings size={20} />
              </button>
              <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">{ROLE_LABELS[user.role] || 'Nhân viên'}</p>
                    <p className="text-xs font-bold text-slate-700">{user.fullName}</p>
                  </div>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-10 w-10 rounded-xl object-cover border border-slate-100 shadow-md" />
                  ) : (
                    <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md flex items-center justify-center text-white font-black text-xs uppercase">
                      {user.fullName ? user.fullName.split(' ').pop()?.substring(0, 2).toUpperCase() : 'ST'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Quản trị viên</p>
                    <p className="text-xs font-bold text-slate-700">VIMES Admin</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md flex items-center justify-center text-white font-black text-xs">
                    AD
                  </div>
                </>
              )}
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-[1600px] mx-auto space-y-12">
          
          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2 uppercase">
                {greeting}, <span className="text-blue-600">{user?.fullName || 'MediAdmin'}!</span>
              </h2>
              <p className="text-slate-400 font-medium">Theo dõi và điều hành lưu lượng bệnh nhân tại {hospitalName || settings.hospitalName}.</p>
            </div>
          </div>


          {/* Module Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-slate-900 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Module Hệ thống</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {portalItems.map((item) => {
                const isRoomBasedMode = selectedService === 'EXECUTION' || selectedService === 'REGISTRATION';
                const isLocked = !selectedService || !selectedDept || (isRoomBasedMode ? !selectedRoom : !selectedArea);
                const isBypassed = item.id === 'SETTINGS_ADMIN' || item.id === 'SURGERY';
                return (
                  <button
                    key={item.id}
                    disabled={isLocked && !isBypassed}
                    onClick={() => {
                        if (item.id === 'LCD') {
                            setShowLCDOptions(true);
                        } else {
                            onNavigate(item.view);
                        }
                    }}
                    className={`group relative bg-white p-6 rounded-[2.5rem] border shadow-sm transition-all duration-300 h-[280px] flex flex-col text-left ${isLocked && !isBypassed ? 'opacity-50 grayscale cursor-not-allowed border-slate-200' : `hover:shadow-xl hover:-translate-y-1 ${item.bgClass}`}`}
                  >
                    {isLocked && !isBypassed && (
                        <div className="absolute top-4 right-4 bg-slate-100 text-slate-400 p-1 rounded-full">
                           <Lock size={14} />
                        </div>
                    )}
                    <div className={`mb-6 p-4 rounded-2xl w-fit transition-transform duration-500 ${isLocked && !isBypassed ? 'bg-slate-50' : 'bg-slate-50 group-hover:scale-110'}`}>
                      {item.icon}
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-slate-400 font-bold text-[9px] mb-4 uppercase tracking-widest">{item.subtitle}</p>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                      {isLocked && !isBypassed 
                        ? (isRoomBasedMode 
                            ? 'Vui lòng chọn Loại nghiệp vụ, Khoa và Phòng khám ở thanh công cụ phía trên để bắt đầu.'
                            : 'Vui lòng chọn Loại nghiệp vụ, Khoa và Khu vực ở thanh công cụ phía trên để bắt đầu.')
                        : item.description}
                    </p>
                    
                    <div className="mt-auto flex items-center gap-2 text-slate-300 font-black text-[9px] tracking-[0.2em] transition-colors uppercase">
                      {isLocked && !isBypassed ? 'CHƯA CẤU HÌNH' : 'Truy cập'} <ChevronRight size={12} className={isLocked && !isBypassed ? '' : "group-hover:translate-x-1 transition-transform"} />
                    </div>
                  </button>
                );
              })}

            </div>

            {/* Patient Portal Link */}
              <button
                className="group bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left flex flex-col h-[280px]"
                onClick={() => window.open('/patient', '_blank')}
              >
                <div className="mb-6 p-4 bg-slate-800 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500 text-emerald-400">
                  <Globe size={24} />
                </div>
                <h4 className="text-xl font-black text-white mb-1 uppercase tracking-tight text-emerald-400">Cổng Bệnh nhân</h4>
                <p className="text-slate-500 font-bold text-[9px] mb-4 uppercase tracking-widest">Mobile Tracking</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Trang theo dõi số thứ tự trực tuyến dành cho bệnh nhân qua QR code.
                </p>
                
                <div className="mt-auto flex items-center gap-2 text-slate-600 font-black text-[9px] tracking-[0.2em] group-hover:text-emerald-400 transition-colors uppercase">
                  Xem bản xem trước <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </main>

      <footer className="bg-white border-t border-slate-100 px-8 py-4 flex items-center justify-between text-slate-400">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
               VIMES QMS Enterprise Edition
            </div>
            <div className="h-4 w-[1px] bg-slate-100"></div>
            <div className="text-[10px] font-bold uppercase tracking-widest">
               v2026.05.08
            </div>
         </div>

         <button 
           onClick={onLogout}
           className="flex items-center gap-2 px-6 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl font-black text-[10px] tracking-[0.2em] transition-all active:scale-95 border border-slate-100"
         >
           <LogOut size={14} /> ĐĂNG XUẤT
         </button>
      </footer>
      {/* LCD Selection Modal */}
      {showLCDOptions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLCDOptions(false)}></div>
             <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Chọn loại màn hình hiển thị</h3>
                        <p className="text-slate-400 text-sm font-medium">Hệ thống hỗ trợ hiển thị riêng lẻ hoặc tổng quát.</p>
                    </div>
                    <button onClick={() => setShowLCDOptions(false)} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
                        <LogOut size={20} />
                    </button>
                </div>
                <div className="p-10 grid grid-cols-2 gap-8">
                    <button 
                        onClick={() => {
                            onNavigate('DISPLAY');
                            setShowLCDOptions(false);
                        }}
                        className="group bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all text-left flex flex-col gap-6"
                    >
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Monitor size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 uppercase">Màn hình đơn</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">Hiển thị tại quầy/phòng khám, tập trung vào số đang gọi hiện tại.</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Kích hoạt <ChevronRight size={14} />
                        </div>
                    </button>

                    <button 
                        onClick={() => {
                            onNavigate('CENTRAL_DISPLAY');
                            setShowLCDOptions(false);
                        }}
                        className="group bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all text-left flex flex-col gap-6"
                    >
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Tv size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 uppercase">Màn hình trung tâm</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">Hiển thị tại sảnh chờ, tổng hợp danh sách gọi từ tất cả các quầy.</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Kích hoạt <ChevronRight size={14} />
                        </div>
                    </button>
                </div>
                <div className="px-10 py-6 bg-slate-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">VIMES QMS ENTERPRISE EDITION</p>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Portal;

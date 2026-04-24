
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Department, ScreenType, ScreenTypeId } from '../types';
import { queueService } from '../data/queueService';

const SCREEN_TYPES: ScreenType[] = [
  { id: 'RECEPTION', name: 'Sảnh Tiếp Đón & Lấy Số' },
  { id: 'CLINIC', name: 'Khu Vực Phòng Khám' },
  { id: 'IMAGING', name: 'CĐHA & Thăm Dò Chức Năng' },
  { id: 'LAB', name: 'Khu Vực Xét Nghiệm' },
  { id: 'PHARMACY', name: 'Tài Chính & Dược' },
  { id: 'SURGERY', name: 'Khu Vực Phẫu Thuật (PT-GMHS)' },
];

interface HomeProps {
  onSelectRoom: (id: string) => void;
  currentRoomId: string;
}

export const Home: React.FC<HomeProps> = ({ onSelectRoom, currentRoomId }) => {
  const navigate = useNavigate();
  const STORAGE_KEY_ROOM = 'clinic_saved_room_id';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<ScreenTypeId>('CLINIC');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSubRoomId, setSelectedSubRoomId] = useState<string>('');

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        setLoading(true);
        console.log('[Home] Đang tải danh mục khoa...');
        const data = await queueService.getDepartments();
        console.log('[Home] Dữ liệu khoa nhận được:', data);
        setDepartments(data);
        
        if (data && data.length > 0) {
          const foundDept = data.find(d => currentRoomId.startsWith(d.id));
          if (foundDept) {
            setSelectedDeptId(foundDept.id);
            const parts = currentRoomId.split('-');
            const roomPart = parts.length > 1 ? parts.slice(1).join('-') : parts[0];
            setSelectedSubRoomId(roomPart);
          } else {
            const firstDept = data[0];
            setSelectedDeptId(firstDept.id);
            if (firstDept.rooms && firstDept.rooms.length > 0) {
              setSelectedSubRoomId(firstDept.rooms[0].id);
            }
          }
        }
      } catch (error) {
        console.error('[Home] Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  const filteredDepartments = useMemo(() => 
    departments.filter(d => true), // For now show all, or filter by manual ScreenType if needed
  [departments]);

  const currentRooms = useMemo(() => 
    departments.find(d => d.id === selectedDeptId)?.rooms || [], 
  [selectedDeptId, departments]);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeptId = e.target.value;
    setSelectedDeptId(newDeptId);
    const newDept = departments.find(d => d.id === newDeptId);
    if (newDept && newDept.rooms.length > 0) {
      const newRoomId = newDept.rooms[0].id;
      setSelectedSubRoomId(newRoomId);
      saveSelection(newDeptId, newRoomId);
    }
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubRoomId = e.target.value;
    setSelectedSubRoomId(newSubRoomId);
    saveSelection(selectedDeptId, newSubRoomId);
  };

  const saveSelection = (deptId: string, roomId: string) => {
    const fullId = `${deptId}-${roomId}`;
    onSelectRoom(fullId);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
      
      {/* BRANDING HEADER */}
      <header className="bg-white border-b border-slate-200 py-6 md:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-3xl font-light text-slate-500 mb-1">Xin chào,</h2>
                    <p className="text-2xl md:text-4xl font-bold text-slate-800">Chọn chức năng làm việc</p>
                  </div>
                  <div className="text-slate-400 text-xs md:text-base font-medium">
                      Phiên làm việc: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
              </div>
          </div>
      </header>

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-20">
           <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Đang tải dữ liệu cấu hình...</p>
           </div>
        </div>
      ) : (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        
        {departments.length === 0 ? (
          <div className="bg-amber-50 border border-amber-100 p-8 rounded-2xl text-center max-w-2xl mx-auto">
             <h3 className="text-amber-800 font-bold text-lg mb-2">Không tìm thấy dữ liệu cấu hình</h3>
             <p className="text-amber-700 text-sm mb-6">Hệ thống chưa tìm thấy thông tin khoa/phòng. Vui lòng kiểm tra lại Cơ sở dữ liệu hoặc cấu hình Backend.</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold">Thử lại</button>
          </div>
        ) : (
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* LEFT COLUMN: CONFIGURATION */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
                        <h2 className="text-lg font-bold uppercase tracking-wide">Cấu Hình Vị Trí</h2>
                        <p className="text-blue-100 text-xs opacity-90">Vui lòng chọn đúng khu vực làm việc của thiết bị này.</p>
                    </div>

                    <div className="p-6 space-y-5">
                         {/* SELECT DEPARTMENT */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Khoa / Phòng Ban</label>
                            <select 
                                value={selectedDeptId}
                                onChange={handleDeptChange}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                {filteredDepartments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* SELECT ROOM */}
                        <div>
                             <label className="block text-xs font-bold text-blue-600 uppercase mb-1.5 ml-1">Quầy / Buồng Khám</label>
                             <select 
                                value={selectedSubRoomId}
                                onChange={handleRoomChange}
                                className="w-full bg-blue-50 border border-blue-200 text-blue-900 font-bold py-3.5 px-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            >
                                {currentRooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>ID Thiết Bị:</span>
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{currentRoomId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: ROLE SELECTION */}
            <div className="lg:col-span-7 xl:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    
                    <button 
                        onClick={() => handleNavigate('doctor')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-600 transition-transform">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Bác Sĩ / Y Tá</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Giao diện gọi số, quản lý hàng đợi và cập nhật trạng thái bệnh nhân.</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('appointments')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-cyan-300 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mb-5 text-cyan-600">
                             <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Quản Lý Lịch Hẹn</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Tạo phiếu hẹn, check-in bệnh nhân và quản lý danh sách tái khám.</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('display')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-300 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 text-green-600">
                             <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Màn Hình Trước Phòng</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Hiển thị số đang gọi tại cửa phòng khám. Tự động chạy quảng cáo.</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('central-display')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 text-purple-600">
                             <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Màn Hình Tổng (Sảnh)</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Tổng hợp trạng thái của nhiều phòng ban. Chờ tập trung.</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('surgery-display')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-rose-300 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 text-rose-600">
                             <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Màn Hình Phẫu Thuật</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Bảng theo dõi và trạng thái ca mổ dành cho người nhà tại sảnh chờ.</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('kiosk')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 text-orange-600">
                             <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Kiosk Lấy Số</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Cây lấy số tự động dành cho bệnh nhân tự đăng ký.</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('settings')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all h-full flex flex-col min-h-[200px]"
                    >
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-5 text-slate-600">
                             <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Cài Đặt</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Cấu hình theme, âm thanh và kết nối hệ thống.</p>
                    </button>
                </div>
            </div>
        </div>
        )}
      </main>
      )}
    </div>
  );
};

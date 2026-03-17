import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarPlusIcon, FileMedicalIcon, ReceiptTaxIcon,
    ChevronRightIcon, QrCodeIcon, UserIcon, LogOutIcon, SwitchCameraIcon,
    PlusIcon, UsersIcon
} from '../icons';
import { portalService, PortalProfile, PortalAppointment } from '../../../services/portalService';
import ProfileManagementView from './ProfileManagementView';

const PortalHomeView: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'home' | 'profiles'>('home');
    const [currentPatient, setCurrentPatient] = useState<PortalProfile | null>(null);
    const [profiles, setProfiles] = useState<PortalProfile[]>([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
    const [isLoadingApps, setIsLoadingApps] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        const patient = portalService.getCurrentPatient();
        setCurrentPatient(patient);

        const storedProfiles = localStorage.getItem('portal_profiles');
        if (storedProfiles) {
            setProfiles(JSON.parse(storedProfiles));
        }
    }, []);

    useEffect(() => {
        const fetchApps = async () => {
            if (!currentPatient) return;
            setIsLoadingApps(true);
            try {
                const data = await portalService.getUpcomingAppointments();
                setAppointments(data);
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
            } finally {
                setIsLoadingApps(false);
            }
        };
        fetchApps();
    }, [currentPatient]);

    const handleSwitchProfile = (profile: PortalProfile) => {
        portalService.selectProfile(profile);
        setCurrentPatient(profile);
        setShowProfileMenu(false);
        // Refresh home data if needed, or simply let the state update
        window.location.reload(); // Quickest way to reset all states in child components
    };

    const handleLogout = () => {
        portalService.logout();
        navigate('/portal/login');
    };

    if (view === 'profiles') {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar pb-20">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-20 flex items-center gap-4">
                    <button onClick={() => setView('home')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="font-black text-slate-800">Quay lại Trang chủ</h2>
                </div>
                <ProfileManagementView />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-6 pb-20">
                {/* Header / Profile Info */}
                <div className="flex justify-between items-center mb-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 font-black">
                                {currentPatient?.name.charAt(0) || 'U'}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Đang xem hồ sơ</p>
                                <p className="font-black text-slate-800 leading-none flex items-center gap-1">
                                    {currentPatient?.name || 'Người dùng'}
                                    <ChevronRightIcon className={`w-3 h-3 transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
                                </p>
                            </div>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
                                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ liên kết</p>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {profiles.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSwitchProfile(p)}
                                            className={`w-full flex items-center gap-3 p-4 hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-0 ${p.id === currentPatient?.id ? 'bg-teal-50/50' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${p.id === currentPatient?.id ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {p.name.charAt(0)}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className={`font-bold text-sm truncate ${p.id === currentPatient?.id ? 'text-teal-700' : 'text-slate-700'}`}>{p.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{p.relationship || 'Cá nhân'} • {p.id}</p>
                                            </div>
                                            {p.id === currentPatient?.id && <div className="w-2 h-2 bg-teal-500 rounded-full"></div>}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-2 space-y-1 bg-slate-50 border-t border-slate-100">
                                    <button
                                        onClick={() => { setView('profiles'); setShowProfileMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl text-teal-600 hover:bg-teal-100/50 transition-colors font-bold text-sm"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Quản lý hồ sơ
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold text-sm"
                                    >
                                        <LogOutIcon className="w-4 h-4" /> Đăng xuất
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
                    </div>
                </div>

                {/* Banner */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 transform skew-x-12 translate-x-10 group-hover:translate-x-12 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-2 tracking-tight">Xin chào, {currentPatient?.name.split(' ').pop()}!</h2>
                        <p className="opacity-90 text-lg max-w-xl font-medium">Chúc bạn một ngày tốt lành và tràn đầy năng lượng.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/portal/booking')}
                        className="p-5 bg-white hover:bg-teal-50 border-2 border-transparent hover:border-teal-100 text-slate-800 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-4 active:scale-95 transition-all group h-36 md:h-44"
                    >
                        <div className="bg-teal-100 p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <CalendarPlusIcon className="w-8 h-8 text-teal-600" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-wider">Đặt lịch khám</span>
                    </button>

                    <button
                        onClick={() => navigate('/portal/records')}
                        className="p-5 bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-100 text-slate-800 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-4 active:scale-95 transition-all group h-36 md:h-44"
                    >
                        <div className="bg-blue-50 p-4 rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                            <FileMedicalIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-wider">Hồ sơ y tế</span>
                    </button>

                    <button
                        onClick={() => navigate('/portal/finance')}
                        className="p-5 bg-white hover:bg-orange-50 border-2 border-transparent hover:border-orange-100 text-slate-800 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-4 active:scale-95 transition-all group h-36 md:h-44"
                    >
                        <div className="bg-orange-50 p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <ReceiptTaxIcon className="w-8 h-8 text-orange-600" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-wider">Viện phí</span>
                    </button>

                    <div
                        onClick={() => setShowQRModal(true)}
                        className="p-5 bg-slate-800 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center gap-3 h-36 md:h-44 cursor-pointer hover:bg-slate-900 transition-all active:scale-95 group"
                    >
                        <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-teal-500/20 transition-colors">
                            <QrCodeIcon className="w-10 h-10 text-teal-400 group-hover:text-teal-300 transition-colors" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-wider">Mã hồ sơ</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                    {/* Appointment Card */}
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-black text-slate-800 text-xl tracking-tight">Lịch khám sắp tới</h3>
                            <span className="text-xs text-teal-600 font-bold cursor-pointer hover:text-teal-700 uppercase tracking-widest">Xem tất cả</span>
                        </div>

                        {isLoadingApps ? (
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center text-slate-400">Đang tải lịch hẹn...</div>
                        ) : appointments.length === 0 ? (
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center text-slate-400 italic">Hiện tại chưa có lịch khám nào sắp tới.</div>
                        ) : (
                            <div className="space-y-4">
                                {appointments.map(app => (
                                    <div key={app.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-teal-200 transition-all hover:shadow-md">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 group-hover:bg-teal-500 transition-colors"></div>
                                        <div className="flex justify-between items-start">
                                            <div className="pl-2">
                                                <p className="text-[10px] font-black text-orange-500 group-hover:text-teal-600 uppercase mb-2 tracking-widest transition-colors">
                                                    {app.status === 'S' ? 'Đã xác nhận' : 'Đang chờ'}
                                                </p>
                                                <h4 className="font-black text-slate-800 text-2xl tracking-tight">{app.deptName}</h4>
                                                <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-2">
                                                    <UserIcon className="w-4 h-4" /> {app.roomName || 'Vui lòng đến quầy tiếp đón'}
                                                </p>
                                            </div>
                                            <div className="text-right bg-slate-50 p-4 rounded-2xl group-hover:bg-teal-50 transition-colors min-w-[100px] border border-slate-100 shadow-sm">
                                                <div className="text-3xl font-black text-slate-800 group-hover:text-teal-700 leading-none">{app.date.split('/')[0]}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Tháng {app.date.split('/')[1]}</div>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-500 font-bold text-sm bg-slate-50 px-4 py-2 rounded-xl">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {app.time}
                                            </div>
                                            <span className="text-teal-600 font-black text-[10px] bg-teal-50 px-4 py-2 rounded-xl uppercase tracking-widest border border-teal-100 shadow-sm">
                                                {app.status === 'S' ? 'ĐÃ XÁC NHẬN' : 'CHỜ DUYỆT'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Health Tips */}
                    <div>
                        <h3 className="font-black text-slate-800 text-xl tracking-tight mb-4 px-1">Sống khỏe</h3>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-md hover:border-teal-100 transition-all cursor-pointer group">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 shrink-0 shadow-inner">
                                    <img src="https://picsum.photos/seed/health1/150/150" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-black text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">5 thói quen tốt cho người bệnh tiểu đường</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 shrink-0">Dinh dưỡng • 5 phút</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 shrink-0 shadow-inner">
                                    <img src="https://picsum.photos/seed/health2/150/150" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-black text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">Lịch tiêm chủng mùa đông cho trẻ em</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 shrink-0">Dự phòng • 3 phút</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* QR Code Modal */}
                {showQRModal && currentPatient && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-slide-up">
                            <div className="bg-teal-600 p-8 text-white text-center relative">
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                                    <UserIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">{currentPatient.name}</h3>
                                <p className="opacity-80 font-bold text-sm uppercase tracking-widest mt-1">Hồ sơ bệnh nhân</p>
                            </div>
                            <div className="p-10 flex flex-col items-center">
                                <div className="bg-slate-50 p-6 rounded-[32px] border-4 border-slate-100 shadow-inner mb-8">
                                    <QRCodeCanvas
                                        value={JSON.stringify({
                                            id: currentPatient.id,
                                            name: currentPatient.name,
                                            dob: currentPatient.birthDate,
                                            type: 'vClinic-Patient'
                                        })}
                                        size={180}
                                        level="H"
                                        includeMargin={false}
                                        fgColor="#0d9488"
                                    />
                                </div>
                                <div className="w-full space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã bệnh nhân</span>
                                        <span className="font-black text-slate-800 tracking-tight">{currentPatient.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</span>
                                        <span className="font-black text-slate-800 tracking-tight">{currentPatient.birthDate}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                                    Sử dụng mã này để check-in nhanh tại quầy tiếp đón<br />hoặc tại các phòng khám của vClinic.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortalHomeView;

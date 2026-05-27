
import React, { useState } from 'react';
import {
    HospitalIcon,
    UserCircleIcon,
    KeyIcon,
    EyeIcon,
    ExclamationCircleIcon
} from '../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useSystemStore } from '../../stores/useSystemStore';
import { HospitalLogo } from '../../config/branding';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const { login } = useSession();
    const { hospitalName, systemName, logoUrl } = useSystemStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            onLogin();
        } catch (err: any) {
            setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#17424C] flex items-center justify-center p-4 py-4 md:py-4 relative overflow-y-auto font-sans">
            {/* TOP LEFT BRANDING - hidden on mobile */}
            <div className="absolute top-8 left-8 md:top-12 md:left-12 items-center gap-4 z-[30] hidden md:flex">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center group relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-600 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <HospitalIcon className="w-7 h-7 text-white drop-shadow-md" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase leading-none mb-1.5 drop-shadow-sm">
                        CÔNG TY CP PHẦN MỀM Y TẾ VIỆT NAM
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="h-[1px] w-6 bg-teal-400/50"></div>
                        <span className="text-[9px] font-bold text-teal-300/60 tracking-[0.1em] uppercase leading-none italic">
                            VIETNAM MEDICAL SOFTWARE JSC
                        </span>
                    </div>
                </div>
            </div>

            {/* Background Shapes */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#0078D4] rounded-full blur-[150px] opacity-40"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-[#3BB17B] rounded-full blur-[180px] opacity-20"></div>
            <div className="absolute top-[30%] right-[10%] w-[25%] h-[25%] bg-[#00A88E] rounded-full blur-[100px] opacity-20"></div>

            <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 md:gap-20 px-2 md:px-8">
                
                {/* LEFT SIDE: WELCOME TEXT - hidden on mobile */}
                <div className="hidden md:block w-full md:w-1/2 text-white space-y-6">
                    <div className="space-y-3">
                        <div className="w-12 h-1 bg-white/40 rounded-full mb-8"></div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl">
                            {hospitalName}
                        </h1>
                        <div className="space-y-1">
                            <h2 className="text-xl md:text-2xl font-extrabold tracking-[0.2em] text-teal-200 uppercase">
                                VIMES HIS
                            </h2>
                            <p className="text-blue-100/60 font-medium tracking-widest uppercase text-[10px]">{systemName}</p>
                        </div>
                    </div>
                    <p className="text-blue-50/70 text-base md:text-lg leading-relaxed max-w-sm font-light">
                        Kiến tạo giải pháp công nghệ số nhằm tối ưu hóa quy trình vận hành và nâng cao chất lượng chăm sóc sức khỏe toàn diện.
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#17424C] bg-white/10 backdrop-blur-md flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-teal-100/80">Tin dùng bởi đội ngũ chuyên gia y tế</p>
                    </div>
                </div>

                {/* RIGHT SIDE: LOGIN CARD */}
                <div className="w-full max-w-[420px] md:w-[420px] bg-white rounded-2xl md:rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-5 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-0"></div>
                    
                    <div className="relative z-10">
                        {/* Mobile-only branding */}
                        <div className="flex md:hidden items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <HospitalLogo className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-[#17424C] tracking-tight leading-tight">{hospitalName}</h1>
                                <p className="text-[8px] font-bold text-teal-600 tracking-[0.15em] uppercase">VIMES HIS</p>
                            </div>
                        </div>

                        <div className="mb-4 md:mb-8">
                            <h2 className="text-xl md:text-4xl font-black text-[#17424C] mb-1 md:mb-3 tracking-tight">Đăng nhập</h2>
                            <p className="text-slate-400 text-[10px] md:text-xs font-medium leading-relaxed">
                                Vui lòng đăng nhập bằng tài khoản được cấp để bắt đầu phiên làm việc.
                            </p>
                        </div>

                        <form className="space-y-3 md:space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-1 md:space-y-2">
                                <label className="block text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-wider ml-1">Tài khoản</label>
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Tên đăng nhập"
                                    className="w-full px-3.5 md:px-5 py-2.5 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl text-slate-900 focus:outline-none focus:border-[#0078D4] focus:bg-white transition-all font-bold text-sm placeholder:text-slate-300 placeholder:font-medium"
                                />
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <label className="block text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-wider ml-1">Mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu"
                                        className="w-full px-3.5 md:px-5 py-2.5 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl text-slate-900 focus:outline-none focus:border-[#0078D4] focus:bg-white transition-all font-bold text-sm placeholder:text-slate-300 placeholder:font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 md:right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#0078D4] hover:text-blue-700 transition-colors uppercase tracking-widest"
                                    >
                                        {showPassword ? "ẨN" : "HIỆN"}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-md border-slate-300 text-[#0078D4] focus:ring-[#0078D4] transition-all" />
                                    <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-700">Ghi nhớ</span>
                                </label>
                                <button type="button" className="text-[10px] font-black text-slate-500 hover:text-[#17424C] transition-colors">Quên mật khẩu?</button>
                            </div>

                            {error && (
                                <div className="p-2.5 md:p-3.5 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-600 flex items-center gap-2 animate-shake">
                                    <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                                    <span className="font-bold">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 md:py-4 bg-[#0078D4] hover:bg-[#005A9E] text-white rounded-xl md:rounded-2xl text-sm md:text-lg font-black shadow-[0_15px_30px_-10px_rgba(0,120,212,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">Đang xử lý...</span>
                                ) : (
                                    <>
                                        Đăng nhập ngay
                                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
                                        </div>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-3 md:mt-8 text-center">
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold">
                                Chưa có tài khoản? <button className="text-[#17424C] font-black hover:underline ml-1">Liên hệ quản trị</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile footer */}
            <div className="md:hidden absolute bottom-2 left-0 right-0 text-center text-white/30 text-[8px] font-bold tracking-[0.2em] uppercase z-0">
                VIMES HIS · Nền tảng quản lý y tế
            </div>

            {/* Desktop footer */}
            <div className="absolute bottom-12 left-12 text-white/20 text-[9px] font-black tracking-[0.4em] uppercase hidden md:block z-0">
                VIMES HIS · Nền tảng quản lý y tế tiêu chuẩn quốc tế
            </div>
        </div>
    );
};

export default Login;

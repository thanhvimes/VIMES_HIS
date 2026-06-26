import React, { useState, useEffect } from 'react';
import { HospitalIcon, ExclamationCircleIcon } from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { useSystemStore } from '../../stores/useSystemStore';
import { HospitalLogo } from '../../config/branding';

interface LoginProps { onLogin: () => void; }

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const { login } = useSession();
    const { hospitalName, systemName, logoUrl } = useSystemStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

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

    const getNameFontSize = (name: string) => {
        const len = (name || '').length;
        if (len <= 18) return '3.25rem';
        if (len <= 28) return '2.625rem';
        if (len <= 40) return '2.125rem';
        if (len <= 55) return '1.75rem';
        return '1.45rem';
    };

    const css = `
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(12deg); }
            50%       { transform: translateY(-12px) rotate(15deg); }
        }
        @keyframes floatReverse {
            0%, 100% { transform: translateY(0px) rotate(-10deg); }
            50%       { transform: translateY(8px) rotate(-13deg); }
        }
        @keyframes shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
            0%   { transform: scale(1);   opacity: 0.4; }
            100% { transform: scale(1.6); opacity: 0; }
        }
        .anim-fade-up   { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-fade-in   { animation: fadeIn 0.6s ease both; }
        .anim-float     { animation: float 7s ease-in-out infinite; }
        .anim-float-rev { animation: floatReverse 9s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .shimmer-btn {
            background: linear-gradient(135deg, #006D77 0%, #2A9D8F 40%, #48CAE4 60%, #2A9D8F 80%, #006D77 100%);
            background-size: 200% auto;
            animation: shimmer 3.5s linear infinite;
        }
        .shimmer-btn:hover { background-size: 300% auto; }
        .input-field {
            width: 100%;
            padding: 13px 16px;
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            color: #0f172a;
            outline: none;
            transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder { color: #94a3b8; font-weight: 400; }
        .input-field:focus {
            border-color: #2A9D8F;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(42,157,143,0.15);
        }
    `;

    return (
        <div className="min-h-screen w-full flex font-sans overflow-hidden" style={{ background: '#eef2f7' }}>
            <style>{css}</style>

            {/* ════════════════════════════════
                LEFT — Teal brand panel
            ════════════════════════════════ */}
            <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
                style={{ background: 'linear-gradient(150deg, #004D40 0%, #006D77 45%, #2A9D8F 100%)' }}>

                {/* Dot grid pattern */}
                <div className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '28px 28px'
                    }} />

                {/* Floating decorative shapes — very subtle */}
                <div className="anim-float absolute top-[8%] right-[6%] w-44 h-44 rounded-3xl opacity-[0.04]"
                    style={{ background: '#fff', border: '1px solid rgba(255,255,255,0.15)' }} />
                <div className="anim-float-rev absolute bottom-[12%] right-[14%] w-28 h-28 rounded-2xl opacity-[0.04]"
                    style={{ background: '#B2DFDB', border: '1px solid rgba(178,223,219,0.2)' }} />
                <div className="anim-float absolute bottom-[32%] left-[4%] w-16 h-16 rounded-2xl opacity-[0.04]"
                    style={{ background: '#80CBC4' }} />

                {/* Glowing orbs */}
                <div className="absolute top-[-10%] right-[-5%] w-72 h-72 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(128,203,196,0.25) 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(178,223,219,0.15) 0%, transparent 70%)' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">

                    {/* TOP: Company badge */}
                    <div className={`flex items-center gap-3 ${mounted ? 'anim-fade-in' : 'opacity-0'}`}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                            <HospitalIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10.5px] font-black text-white/90 tracking-[0.14em] uppercase leading-none">
                                CÔNG TY CP PHẦN MỀM Y TẾ VIỆT NAM
                            </p>
                            <p className="text-[8.5px] font-semibold text-teal-100/60 tracking-[0.1em] uppercase mt-1.5 leading-none italic">
                                Vietnam Medical Software JSC
                            </p>
                        </div>
                    </div>

                    {/* MIDDLE: Hero */}
                    <div className="flex-1 flex flex-col justify-center space-y-7">
                        {/* Accent */}
                        <div className={`flex items-center gap-2 ${mounted ? 'anim-fade-up' : 'opacity-0'}`}>
                            <div className="w-8 h-1 rounded-full" style={{ background: '#E63946' }} />
                            <div className="w-3 h-1 rounded-full" style={{ background: 'rgba(230,57,70,0.4)' }} />
                        </div>

                        {/* Hospital name */}
                        <h1
                            className={`text-white font-black uppercase max-w-[420px] ${mounted ? 'anim-fade-up delay-100' : 'opacity-0'}`}
                            style={{
                                fontSize: getNameFontSize(hospitalName),
                                lineHeight: 1.22,
                                letterSpacing: '-0.01em',
                                wordBreak: 'break-word',
                                textShadow: '0 2px 20px rgba(0,0,0,0.2)',
                            }}
                        >
                            {hospitalName || 'PHÒNG KHÁM ĐA KHOA vCLINIC'}
                        </h1>

                        {/* VIMES HIS label */}
                        <div className={`${mounted ? 'anim-fade-up delay-200' : 'opacity-0'}`}>
                            <p className="text-[15px] font-black tracking-[0.22em] uppercase"
                                style={{ color: '#80CBC4' }}>
                                VIMES HIS
                            </p>
                            <p className="text-[11px] font-medium tracking-[0.07em] uppercase mt-1.5"
                                style={{ color: 'rgba(128,203,196,0.6)' }}>
                                {systemName || 'Hệ thống quản lý tổng thể bệnh viện'}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className={`w-full h-px ${mounted ? 'anim-fade-in delay-300' : 'opacity-0'}`}
                            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, transparent 80%)' }} />

                        {/* Tagline */}
                        <p className={`text-[15px] leading-[1.75] max-w-sm font-light ${mounted ? 'anim-fade-up delay-300' : 'opacity-0'}`}
                            style={{ color: 'rgba(224,242,241,0.75)' }}>
                            Kiến tạo giải pháp công nghệ số nhằm tối ưu hóa quy trình vận hành và nâng cao chất lượng chăm sóc sức khỏe toàn diện.
                        </p>

                        {/* Badges */}
                        <div className={`flex flex-wrap gap-2 ${mounted ? 'anim-fade-up delay-400' : 'opacity-0'}`}>
                            {[
                                { label: 'Bảo mật ISO 27001', dot: '#2A9D8F' },
                                { label: 'Chuẩn Bộ Y Tế', dot: '#48CAE4' },
                                { label: 'Hỗ trợ 24/7', dot: '#E63946' },
                            ].map(({ label, dot }) => (
                                <span key={label}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-semibold rounded-full"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.16)',
                                        color: 'rgba(224,242,241,0.9)',
                                        backdropFilter: 'blur(4px)',
                                        letterSpacing: '0.05em',
                                    }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                                    {label}
                                </span>
                            ))}
                        </div>

                        {/* Social proof */}
                        <div className={`flex items-center gap-3 pt-1 ${mounted ? 'anim-fade-up delay-500' : 'opacity-0'}`}>
                            <div className="flex -space-x-2.5">
                                {['#48CAE4', '#E9C46A', '#E76F51'].map((c, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black text-white"
                                        style={{ borderColor: '#006D77', background: c, opacity: 0.85 }}>
                                        {['BS', 'YT', 'KT'][i]}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[12px] font-semibold" style={{ color: 'rgba(178,223,219,0.85)' }}>
                                Tin dùng bởi hàng nghìn y bác sĩ
                            </p>
                        </div>
                    </div>

                    {/* BOTTOM: Footer */}
                    <p className="text-[9px] font-bold tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        VIMES HIS · Nền tảng quản lý y tế tiêu chuẩn quốc tế
                    </p>
                </div>
            </div>

            {/* ════════════════════════════════
                RIGHT — Form panel
            ════════════════════════════════ */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative min-h-screen"
                style={{ background: '#f1f5f9' }}>

                {/* Subtle bg pattern */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }} />

                {/* Mobile branding */}
                <div className="lg:hidden flex items-center gap-3 mb-8 self-start relative z-10">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow"
                        style={{ background: 'linear-gradient(135deg, #006D77, #004D40)' }}>
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            : <HospitalLogo className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800 leading-snug max-w-[200px]">
                            {hospitalName || 'PHÒNG KHÁM vCLINIC'}
                        </p>
                        <p className="text-[9px] font-black tracking-widest uppercase mt-0.5" style={{ color: '#006D77' }}>
                            VIMES HIS
                        </p>
                    </div>
                </div>

                {/* Floating card */}
                <div
                    className={`relative z-10 w-full max-w-[400px] bg-white rounded-2xl p-8 sm:p-9 ${mounted ? 'anim-fade-up' : 'opacity-0'}`}
                    style={{ boxShadow: '0 20px 60px -12px rgba(15,23,42,0.13), 0 4px 16px -4px rgba(15,23,42,0.08)' }}
                >
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full"
                        style={{ background: 'linear-gradient(90deg, #2A9D8F, #48CAE4, #90E0EF)' }} />

                    {/* Heading */}
                    <div className={`mb-7 ${mounted ? 'anim-fade-up delay-100' : 'opacity-0'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg, #2A9D8F, #006D77)' }}>
                                    <HospitalIcon className="w-4 h-4 text-white" />
                                </div>
                                {/* Pulse ring */}
                                <div className="absolute inset-0 rounded-lg"
                                    style={{
                                        border: '2px solid #2A9D8F',
                                        animation: 'pulse-ring 2.5s ease-out infinite',
                                    }} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#2A9D8F' }}>
                                VIMES HIS
                            </span>
                        </div>
                        <h2 className="font-black text-slate-900 mb-1.5"
                            style={{ fontSize: '1.875rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            Đăng nhập
                        </h2>
                        <p className="text-slate-400 text-[13.5px] font-medium leading-relaxed">
                            Vui lòng đăng nhập bằng tài khoản được cấp để bắt đầu phiên làm việc.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Username */}
                        <div className={`space-y-1.5 ${mounted ? 'anim-fade-up delay-200' : 'opacity-0'}`}>
                            <label htmlFor="login-username" className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.12em]">
                                Tài khoản
                            </label>
                            <input
                                id="login-username"
                                type="text" required value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Nhập tên đăng nhập"
                                className="input-field"
                                autoFocus
                                autoComplete="username"
                            />
                        </div>

                        {/* Password */}
                        <div className={`space-y-1.5 ${mounted ? 'anim-fade-up delay-300' : 'opacity-0'}`}>
                            <label htmlFor="login-password" className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.12em]">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'} required
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                    className="input-field"
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10.5px] font-black uppercase tracking-widest transition-opacity hover:opacity-70"
                                    style={{ color: '#006D77' }}
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                                    {showPassword ? 'ẨN' : 'HIỆN'}
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className={`flex items-center justify-between ${mounted ? 'anim-fade-up delay-300' : 'opacity-0'}`}>
                            <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer select-none group">
                                <input id="login-remember" type="checkbox" className="w-3.5 h-3.5 rounded"
                                    style={{ accentColor: '#2A9D8F' }} />
                                <span className="text-[12px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                                    Ghi nhớ đăng nhập
                                </span>
                            </label>
                            <button type="button"
                                className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                                Quên mật khẩu?
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
                                <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-[13px] font-semibold text-red-600 leading-snug">{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <div className={`${mounted ? 'anim-fade-up delay-400' : 'opacity-0'}`}>
                            <button type="submit" disabled={isLoading}
                                className="shimmer-btn w-full py-3.5 text-white rounded-xl text-[14.5px] font-black flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60"
                                style={{ letterSpacing: '0.02em', boxShadow: '0 8px 28px -6px rgba(42,157,143,0.5)' }}>
                                {isLoading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Đăng nhập ngay</span>
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer link */}
                    <p className={`mt-5 text-center text-[12.5px] text-slate-400 font-medium ${mounted ? 'anim-fade-up delay-500' : 'opacity-0'}`}>
                        Chưa có tài khoản?{' '}
                        <button className="font-black hover:underline underline-offset-2 transition-colors"
                            style={{ color: '#006D77' }}>
                            Liên hệ quản trị
                        </button>
                    </p>
                </div>

                {/* Bottom version badge */}
                <div className={`mt-6 flex items-center gap-2 relative z-10 ${mounted ? 'anim-fade-in delay-500' : 'opacity-0'}`}>
                    <div className="w-1 h-1 rounded-full" style={{ background: '#94a3b8' }} />
                    <p className="text-[10.5px] font-semibold tracking-widest uppercase text-slate-400">
                        VIMES HIS · Phiên bản 2.0
                    </p>
                    <div className="w-1 h-1 rounded-full" style={{ background: '#94a3b8' }} />
                </div>
            </div>
        </div>
    );
};

export default Login;

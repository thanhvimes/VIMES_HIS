import React, { useState } from 'react';
import { QrCodeIcon } from '../icons';
import { portalService } from '../../../services/portalService';
import { usePortalAuth } from '../../../contexts/PortalAuthContext';

const PortalLoginView: React.FC = () => {
    const { login } = usePortalAuth();
    const [mode, setMode] = useState<'LOGIN' | 'ACTIVATE'>('LOGIN');

    // Form fields
    const [phone, setPhone] = useState('0905123456');
    const [password, setPassword] = useState('');
    const [idCard, setIdCard] = useState(''); // CCCD for Activation

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Use context login method
            await login(phone, password);
            // Navigation is handled by the context
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || err.message || 'Không thể kết nối đến máy chủ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!phone || !idCard || !password) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Validate CCCD format (12 digits)
        const cccdRegex = /^\d{12}$/;
        if (!cccdRegex.test(idCard)) {
            setError('Số CCCD phải có đúng 12 chữ số');
            return;
        }

        setIsLoading(true);
        try {
            const response = await portalService.activateAccount(phone, idCard, password);
            if (response.success) {
                setSuccessMsg(response.message || 'Kích hoạt thành công! Bạn có thể đăng nhập ngay.');
                setMode('LOGIN');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Lỗi khi kích hoạt tài khoản');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side: Branding (Desktop Only) */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-teal-600 to-blue-700 items-center justify-center text-white p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 max-w-lg">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">Cổng thông tin<br /><span className="text-teal-300 italic">Bệnh nhân VIMES</span></h1>
                    <p className="text-xl text-teal-100/80 leading-relaxed font-medium">
                        Tra cứu kết quả khám, lịch hẹn và quản lý sức khỏe gia đình chỉ trong vài chạm. An toàn, bảo mật và hoàn toàn miễn phí.
                    </p>
                    <div className="mt-12 flex gap-6">
                        <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                            <h3 className="font-black text-2xl">100%</h3>
                            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Bảo mật dữ liệu</p>
                        </div>
                        <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                            <h3 className="font-black text-2xl">24/7</h3>
                            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Hỗ trợ kết nối</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-16 relative shadow-inner">
                <div className="w-full max-w-md">
                    <div className="text-center md:text-left mb-10">
                        <div className="md:hidden w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-teal-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
                            {mode === 'LOGIN' ? 'Chào mừng trở lại' : 'Kích hoạt hồ sơ'}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {mode === 'LOGIN' ? 'Vui trọng đăng nhập để tiếp tục.' : 'Thiết lập mật khẩu cho hồ sơ của bạn.'}
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 border border-slate-200">
                        <button
                            onClick={() => { setMode('LOGIN'); setError(''); }}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${mode === 'LOGIN' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            ĐĂNG NHẬP
                        </button>
                        <button
                            onClick={() => { setMode('ACTIVATE'); setError(''); }}
                            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${mode === 'ACTIVATE' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            KÍCH HOẠT
                        </button>
                    </div>

                    <form onSubmit={mode === 'LOGIN' ? handleLogin : handleActivate} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center gap-3 animate-shake font-bold shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-4 bg-green-50 border border-green-100 text-green-600 text-sm rounded-2xl flex items-center gap-3 font-bold shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest pl-1">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none text-slate-800 font-bold bg-slate-50 transition-all placeholder:text-slate-300"
                                    placeholder="Ví dụ: 0905 123 456"
                                />
                            </div>

                            {(mode === 'ACTIVATE' || (!password && mode === 'LOGIN')) && (
                                <div className="animate-fade-in">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest pl-1">Số CCCD (12 chữ số)</label>
                                    <input
                                        type="text"
                                        value={idCard}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, ''); // Only digits
                                            if (value.length <= 12) setIdCard(value);
                                        }}
                                        maxLength={12}
                                        className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none text-slate-800 font-bold bg-slate-50 transition-all placeholder:text-slate-300"
                                        placeholder="Ví dụ: 001234567890"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest pl-1">
                                    {mode === 'LOGIN' ? 'Mật khẩu' : 'Thiết lập mật khẩu mới'}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none text-slate-800 font-bold bg-slate-50 transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                                {mode === 'LOGIN' && (
                                    <div className="text-right mt-2">
                                        <button type="button" className="text-xs font-bold text-teal-600 hover:text-teal-700">Quên mật khẩu?</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transform transition active:scale-95 flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
                        >
                            {isLoading ? 'Đang xử lý...' : mode === 'LOGIN' ? 'Vào cổng thông tin' : 'Kích hoạt ngay'}
                            {!isLoading && <span className="text-teal-200">→</span>}
                        </button>
                    </form>

                    {mode === 'LOGIN' && (
                        <div className="mt-10 text-center animate-fade-in">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px]">
                                    <span className="px-4 bg-white text-slate-300 font-bold uppercase tracking-[0.2em]">Hoặc nhanh hơn</span>
                                </div>
                            </div>
                            <button className="flex items-center justify-center w-full py-4 border-2 border-slate-50 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold gap-3 transition-colors shadow-sm">
                                <QrCodeIcon className="w-6 h-6 text-slate-400" /> Quét mã QR trên hồ sơ
                            </button>
                        </div>
                    )}
                </div>

                <p className="absolute bottom-8 text-slate-300 text-[10px] font-bold uppercase tracking-widest">© 2026 VIMES Hospital • Hệ thống thông tin y tế</p>
            </div>
        </div>
    );
};

export default PortalLoginView;

import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const PhysicalExamTab: React.FC = () => {
    const {
        formType,
        isChild,
        errors,
        height, setHeight,
        weight, setWeight,
        pulse, setPulse,
        bp, setBp,
        bmi,
        khamTheLucPl, setKhamTheLucPl,
        vongDau, setVongDau,
        vongNguc, setVongNguc,
        sinhNon, setSinhNon,
        tuanThai, setTuanThai,
        birthWeight, setBirthWeight,
        lucBopTayThuan, setLucBopTayThuan,
        lucBopTayKhongThuan, setLucBopTayKhongThuan,
        lucKeoLung, setLucKeoLung,
        lucKeoThan, setLucKeoThan,
        haTamThu, setHaTamThu,
        haTamTruong, setHaTamTruong,
        nhipTim, setNhipTim,
        vongNgucTrungBinh, setVongNgucTrungBinh,
        isLocked,
        handleAutofillTab
    } = useDynamicFormContext();

    const getSuggestedPl = () => {
        if (!height || !weight) return null;
        const hMeter = parseFloat(height) / 100;
        const wKg = parseFloat(weight);
        if (hMeter <= 0 || wKg <= 0) return null;
        const calculatedBmi = wKg / (hMeter * hMeter);
        let suggested = 1;
        if (bp) {
            const bpParts = bp.split('/');
            if (bpParts.length === 2) {
                const sys = parseInt(bpParts[0]);
                const dia = parseInt(bpParts[1]);
                if (sys >= 160 || dia >= 100) suggested = 4;
                else if (sys >= 140 || dia >= 90) suggested = 3;
                else if (sys >= 130 || dia >= 85) suggested = 2;
            }
        }
        if (calculatedBmi >= 30.0) suggested = Math.max(suggested, 3);
        else if (calculatedBmi >= 25.0 || calculatedBmi < 18.5) suggested = Math.max(suggested, 2);
        return suggested;
    };

    const suggestedPl = getSuggestedPl();
    const showSuggestedPlWarning = suggestedPl !== null && khamTheLucPl && parseInt(khamTheLucPl) < suggestedPl;

    return (
        <SpecialtyCard specialtyKey="physical" title="Khám Thể lực">
            {!isLocked && (
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => handleAutofillTab('exam')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0f766e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Điền nhanh Thể lực & Lâm sàng
                    </button>
                </div>
            )}
            {showSuggestedPlWarning && (
                <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-lg text-amber-800 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>Lưu ý: Chỉ số BMI hoặc Huyết áp đo được tương ứng với phân loại tối thiểu Loại {suggestedPl}.</span>
                </div>
            )}
            <fieldset disabled={isLocked} className="space-y-4">
            <div className={`grid grid-cols-1 ${formType === '2' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4`}>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Chiều cao (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng (kg)</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp tim (mạch/phút)</label>
                    <input type="number" value={pulse} onChange={e => setPulse(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Huyết áp (mmHg)</label>
                    <input type="text" value={bp} onChange={e => setBp(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.bp ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} placeholder="120/80" />
                    {errors.bp && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bp}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số BMI (Tự động)</label>
                    <input type="text" value={bmi} disabled className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold" />
                </div>
                {formType === '2' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại thể lực</label>
                        <select value={khamTheLucPl} onChange={e => setKhamTheLucPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                            <option value="">-- Phân loại --</option>
                            <option value="1">Loại I</option>
                            <option value="2">Loại II</option>
                            <option value="3">Loại III</option>
                            <option value="4">Loại IV</option>
                            <option value="5">Loại V</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Extra physical fields for child or sailor */}
            {isChild && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Vòng đầu (cm)</label>
                        <input type="number" value={vongDau} onChange={e => setVongDau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Vòng ngực (cm)</label>
                        <input type="number" value={vongNguc} onChange={e => setVongNguc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Trẻ sinh non</label>
                        <select value={sinhNon} onChange={e => setSinhNon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                            <option value="">-- Chọn --</option>
                            <option value="0">Không sinh non</option>
                            <option value="1">Có sinh non</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tuần thai khi sinh</label>
                        <input type="number" value={tuanThai} onChange={e => setTuanThai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="39" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng lúc sinh (kg)</label>
                        <input type="number" step="0.1" value={birthWeight} onChange={e => setBirthWeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="3.2" />
                    </div>
                </div>
            )}

            {formType === '5' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Lực bóp tay thuận (kg)</label>
                            <input type="number" value={lucBopTayThuan} onChange={e => setLucBopTayThuan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Lực bóp tay không thuận (kg)</label>
                            <input type="number" value={lucBopTayKhongThuan} onChange={e => setLucBopTayKhongThuan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Lực kéo lưng (kg)</label>
                            <input type="number" value={lucKeoLung} onChange={e => setLucKeoLung(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Lực kéo thân (kg)</label>
                            <input type="number" value={lucKeoThan} onChange={e => setLucKeoThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">HA Tâm thu (mmHg)</label>
                            <input type="number" value={haTamThu} onChange={e => setHaTamThu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">HA Tâm trương (mmHg)</label>
                            <input type="number" value={haTamTruong} onChange={e => setHaTamTruong(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp tim (lần/phút)</label>
                            <input type="number" value={nhipTim} onChange={e => setNhipTim(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vòng ngực trung bình (cm)</label>
                            <input type="number" value={vongNgucTrungBinh} onChange={e => setVongNgucTrungBinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                    </div>
                </>
            )}
            </fieldset>
        </SpecialtyCard>
    );
};

export default PhysicalExamTab;

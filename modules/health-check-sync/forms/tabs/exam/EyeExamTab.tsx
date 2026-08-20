import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const EyeExamTab: React.FC = () => {
    const {
        formType,
        eyeExam, setEyeExam,
        benhKhacMat, setBenhKhacMat,
        khamMatPl, setKhamMatPl,
        khongKinhMatPhai, setKhongKinhMatPhai,
        khongKinhMatTrai, setKhongKinhMatTrai,
        khongKinhHaiMat, setKhongKinhHaiMat,
        coKinhMatPhai, setCoKinhMatPhai,
        coKinhMatTrai, setCoKinhMatTrai,
        coKinhHaiMat, setCoKinhHaiMat,
        sacGiac, setSacGiac,
        thiTruongNgangHaiMat, setThiTruongNgangHaiMat,
        thiTruongDungHaiMat, setThiTruongDungHaiMat,
        xaKhongKinhMatPhai, setXaKhongKinhMatPhai,
        xaKhongKinhMatTrai, setXaKhongKinhMatTrai,
        xaKhongKinhHaiMat, setXaKhongKinhHaiMat,
        xaCoKinhMatPhai, setXaCoKinhMatPhai,
        xaCoKinhMatTrai, setXaCoKinhMatTrai,
        xaCoKinhHaiMat, setXaCoKinhHaiMat,
        ganKhongKinhMatPhai, setGanKhongKinhMatPhai,
        ganKhongKinhMatTrai, setGanKhongKinhMatTrai,
        ganKhongKinhHaiMat, setGanKhongKinhHaiMat,
        ganCoKinhMatPhai, setGanCoKinhMatPhai,
        ganCoKinhMatTrai, setGanCoKinhMatTrai,
        ganCoKinhHaiMat, setGanCoKinhHaiMat,
        khamMatThiTruongPhai, setKhamMatThiTruongPhai,
        khamMatThiTruongTrai, setKhamMatThiTruongTrai,
        khamMatM5, setKhamMatM5,
        khamMatThiGiacMau, setKhamMatThiGiacMau,
        isLocked,
        handleAutofillTab,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="eye" title="Khám Mắt">
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
                        Điền nhanh kết quả mặc định
                    </button>
                </div>
            )}
            <fieldset disabled={isLocked} className="space-y-4 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            Các bệnh về mắt (nếu có) <span className="text-[10px] text-slate-400 font-mono font-normal">(BENH_KHAC_MAT)</span>
                        </label>
                        <textarea 
                            value={benhKhacMat || eyeExam} 
                            onChange={e => {
                                setBenhKhacMat(e.target.value);
                                setEyeExam(e.target.value);
                            }} 
                            placeholder="Ghi rõ các bệnh về mắt nếu có..." 
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20" 
                        />
                    </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại chuyên khoa Mắt</label>
                            <select value={khamMatPl} onChange={e => setKhamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                                <option value="">-- Phân loại --</option>
                                <option value="1">Loại I (Rất khỏe)</option>
                                <option value="2">Loại II (Khỏe)</option>
                                <option value="3">Loại III (Trung bình)</option>
                                <option value="4">Loại IV (Yếu)</option>
                                <option value="5">Loại V (Rất yếu)</option>
                            </select>
                        </div>
                    {formType === '5' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Khám Mắt (Mẫu 5)</label>
                                <textarea value={khamMatM5} onChange={e => setKhamMatM5(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 h-16" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Sắc giác màu / Thị giác màu</label>
                                <select value={khamMatThiGiacMau} onChange={e => setKhamMatThiGiacMau(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white dark:bg-slate-700 font-bold">
                                    <option value="">-- Chọn sắc giác --</option>
                                    <option value="1">Bình thường</option>
                                    <option value="2">Mù màu đỏ - lục hoàn toàn</option>
                                    <option value="3">Mù màu đỏ - lục một phần</option>
                                    <option value="4">Mù màu hoàn toàn</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đo thị lực &amp; Thị trường:</span>
                    {formType === '5' ? (
                        <div className="space-y-4">
                            <table className="w-full text-xs text-left border border-slate-200">
                                <thead className="bg-slate-100 font-bold">
                                    <tr>
                                        <th className="p-2 border border-slate-200">Thị lực</th>
                                        <th className="p-2 border border-slate-200 text-center">Phải</th>
                                        <th className="p-2 border border-slate-200 text-center">Trái</th>
                                        <th className="p-2 border border-slate-200 text-center">Hai mắt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-2 font-bold border border-slate-200 bg-slate-50">Xa (Ko kính)</td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={xaKhongKinhMatPhai} onChange={e => setXaKhongKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={xaKhongKinhMatTrai} onChange={e => setXaKhongKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={xaKhongKinhHaiMat} onChange={e => setXaKhongKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-bold border border-slate-200 bg-slate-50">Xa (Có kính)</td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={xaCoKinhMatPhai} onChange={e => setXaCoKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={xaCoKinhMatTrai} onChange={e => setXaCoKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={xaCoKinhHaiMat} onChange={e => setXaCoKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-bold border border-slate-200 bg-slate-50">Gần (Ko kính)</td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={ganKhongKinhMatPhai} onChange={e => setGanKhongKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={ganKhongKinhMatTrai} onChange={e => setGanKhongKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={ganKhongKinhHaiMat} onChange={e => setGanKhongKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                    </tr>
                                    <tr>
                                        <td className="p-2 font-bold border border-slate-200 bg-slate-50">Gần (Có kính)</td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={ganCoKinhMatPhai} onChange={e => setGanCoKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={ganCoKinhMatTrai} onChange={e => setGanCoKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                        <td className="p-1 border border-slate-200"><input type="text" value={ganCoKinhHaiMat} onChange={e => setGanCoKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-center" /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Thị trường phải</label>
                                    <input type="text" value={khamMatThiTruongPhai} onChange={e => setKhamMatThiTruongPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-center" placeholder="Bình thường" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Thị trường trái</label>
                                    <input type="text" value={khamMatThiTruongTrai} onChange={e => setKhamMatThiTruongTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-center" placeholder="Bình thường" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Phải)</label>
                                    <input type="text" value={khongKinhMatPhai} onChange={e => setKhongKinhMatPhai(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-center font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Trái)</label>
                                    <input type="text" value={khongKinhMatTrai} onChange={e => setKhongKinhMatTrai(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-center font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Hai mắt)</label>
                                    <input type="text" value={khongKinhHaiMat} onChange={e => setKhongKinhHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-center font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Phải)</label>
                                    <input type="text" value={coKinhMatPhai} onChange={e => setCoKinhMatPhai(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-center font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Trái)</label>
                                    <input type="text" value={coKinhMatTrai} onChange={e => setCoKinhMatTrai(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-center font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Hai mắt)</label>
                                    <input type="text" value={coKinhHaiMat} onChange={e => setCoKinhHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-center font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2.5 border-t border-slate-200">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Sắc giác (QĐ 1551)</label>
                                    <select value={sacGiac} onChange={e => setSacGiac(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-bold">
                                        <option value="">-- Chọn sắc giác --</option>
                                        <option value="1">1: Bình thường</option>
                                        <option value="2">2: Mù màu toàn bộ</option>
                                        <option value="3">3: Mù màu đỏ</option>
                                        <option value="4">4: Mù màu xanh lá cây</option>
                                        <option value="5">5: Mù màu vàng</option>
                                        <option value="0">0: Bình thường (Mã cũ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Thị trường ngang hai mắt</label>
                                    <select value={thiTruongNgangHaiMat} onChange={e => setThiTruongNgangHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold">
                                        <option value="Bình thường">Bình thường (&ge; 160 độ)</option>
                                        <option value="Hạn chế">Hạn chế (&lt; 160 độ)</option>
                                        <option value="1">1: Bình thường</option>
                                        <option value="2">2: Hạn chế</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Thị trường đứng hai mắt</label>
                                    <select value={thiTruongDungHaiMat} onChange={e => setThiTruongDungHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold">
                                        <option value="Bình thường">Bình thường (&ge; 30 độ trên &amp; dưới)</option>
                                        <option value="Hạn chế">Hạn chế (&lt; 30 độ)</option>
                                        <option value="1">1: Bình thường</option>
                                        <option value="2">2: Hạn chế</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            </fieldset>
        </SpecialtyCard>
    );
};

export default EyeExamTab;

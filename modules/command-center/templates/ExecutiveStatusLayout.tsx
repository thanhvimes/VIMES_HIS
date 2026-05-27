import React, { useState } from 'react';
import { mockExecutiveStatus } from '../data';
import { 
    HospitalIcon, 
    ActivityIcon, 
    ExclamationCircleIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    UserGroupIcon
} from '../../../components/Icons';

interface ExecutiveStatusLayoutProps {
    liveData?: {
        totalPatients: number;
        campuses: {
            k1: { outpatients: number };
            k2: { outpatients: number };
            k3: { outpatients: number };
        };
    };
}

const ExecutiveStatusLayout: React.FC<ExecutiveStatusLayoutProps> = ({ liveData }) => {
    const data = mockExecutiveStatus;
    const [activeTab, setActiveTab] = useState<'k1' | 'k2' | 'k3'>('k1');

    const formatCurrency = (value: number) => {
        return (value / 1000000000).toFixed(2) + ' Tỷ';
    };
    
    const formatMill = (value: number) => {
        return (value / 1000000).toLocaleString('vi-VN') + ' Tr';
    };

    // Reusable Component for Metric
    const MetricBox = ({ label, value, unit = '', highlight = false }: { label: string, value: string|number, unit?: string, highlight?: boolean }) => (
        <div className={`p-2 rounded-lg border ${highlight ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/50' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'}`}>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
            <div className={`text-sm font-black ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {value} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden pr-2">
            
            {/* PHẦN 1: TỔNG TOÀN VIỆN & CƠ SỞ (TOP-DOWN) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                
                {/* GRAND TOTAL */}
                <div className="xl:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-900 dark:to-blue-900 rounded-2xl p-5 shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-100 mb-4 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5"/> TỔNG TOÀN VIỆN
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-indigo-200">BN Nội trú</div>
                                <div className="text-2xl font-black">{data.grandTotal.inpatients}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-indigo-200">Công suất G.</div>
                                <div className={`text-2xl font-black ${data.grandTotal.bedOccupancy > 100 ? 'text-rose-300' : ''}`}>
                                    {data.grandTotal.bedOccupancy}%
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-indigo-200">Khám trong ngày</div>
                                <div className="text-xl font-bold">{liveData?.totalPatients ?? data.grandTotal.outpatients}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-indigo-200">TT K.Tiền Mặt</div>
                                <div className="text-xl font-bold">{data.grandTotal.cashlessRate}%</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-indigo-500/50">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-indigo-200">Doanh thu / Chi</span>
                            <span className="text-2xl font-black text-amber-300">{formatCurrency(data.grandTotal.revenue)}</span>
                        </div>
                    </div>
                </div>

                {/* CƠ SỞ K1, K2, K3 */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(data.campuses).map(([key, campus]) => (
                        <div key={key} className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm flex flex-col justify-between">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                                <span>Cơ sở {key.toUpperCase()}</span>
                                <HospitalIcon className="w-4 h-4 text-blue-500"/>
                            </h3>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mb-3">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Nội trú</div>
                                    <div className="text-lg font-black text-slate-700 dark:text-slate-200">{campus.inpatients}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Công suất G.</div>
                                    <div className={`text-lg font-black ${campus.bedOccupancy > 100 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>{campus.bedOccupancy}%</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Khám bệnh</div>
                                    <div className="text-lg font-black text-slate-700 dark:text-slate-200">
                                        {liveData?.campuses?.[key as 'k1' | 'k2' | 'k3']?.outpatients ?? campus.outpatients}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Doanh Thu</div>
                                    <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(campus.revenue)}</div>
                                </div>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-1.5 rounded-md flex items-center gap-1.5 ${
                                campus.alert === 'Bình thường' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                            }`}>
                                {campus.alert !== 'Bình thường' && <ExclamationCircleIcon className="w-3.5 h-3.5"/>}
                                {campus.alert}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PHẦN 2: LÂM SÀNG & CẬN LÂM SÀNG TỔNG HỢP (MID-LEVEL) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-none">
                {/* LÂM SÀNG */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4"/> Hoạt động Khối Lâm Sàng Toàn Viện
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                            <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Khối Ngoại</div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Nội trú:</span><span className="font-bold dark:text-white">{data.clinicalZones.ngoai.inpatients}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Công suất G.:</span><span className="font-bold dark:text-white">{data.clinicalZones.ngoai.bedOccupancy}%</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Số Ca Mổ:</span><span className="font-bold text-rose-500">{data.clinicalZones.ngoai.mo}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatCurrency(data.clinicalZones.ngoai.revenue)}</span></div>
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                            <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Khối Nội</div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Nội trú:</span><span className="font-bold dark:text-white">{data.clinicalZones.noi.inpatients}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Công suất G.:</span><span className="font-bold text-rose-500">{data.clinicalZones.noi.bedOccupancy}%</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Truyền HC:</span><span className="font-bold text-blue-500">{data.clinicalZones.noi.truyenHC}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatCurrency(data.clinicalZones.noi.revenue)}</span></div>
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                            <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Khối Xạ</div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Nội trú:</span><span className="font-bold dark:text-white">{data.clinicalZones.xa.inpatients}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Công suất G.:</span><span className="font-bold dark:text-white">{data.clinicalZones.xa.bedOccupancy}%</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Số Lượt Xạ:</span><span className="font-bold text-amber-500">{data.clinicalZones.xa.xaTri}</span></div>
                                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatCurrency(data.clinicalZones.xa.revenue)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CẬN LÂM SÀNG */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4"/> Hoạt động Cận Lâm Sàng Toàn Viện
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                            <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1 text-center">XQ & CĐHA</div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Siêu Âm:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.xQuang.sieuAm}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">CT:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.xQuang.ct}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">MRI:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.xQuang.mri}</span></div>
                                <div className="flex justify-between text-[10px] border-t border-slate-100 dark:border-slate-700 mt-1 pt-1"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatMill(data.paraclinicalZones.xQuang.revenue)}</span></div>
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                            <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1 text-center">Xét Nghiệm</div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">H.Học:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.xetNghiem.hh}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">S.Hóa:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.xetNghiem.sh}</span></div>
                                <div className="flex justify-between text-[10px] border-t border-slate-100 dark:border-slate-700 mt-1 pt-1"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatMill(data.paraclinicalZones.xetNghiem.revenue)}</span></div>
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                            <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1 text-center">Nội Soi</div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Dạ Dày:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.noiSoi.soiDaDay}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Đại Tràng:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.noiSoi.soiDaiTrang}</span></div>
                                <div className="flex justify-between text-[10px] border-t border-slate-100 dark:border-slate-700 mt-1 pt-1"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatMill(data.paraclinicalZones.noiSoi.revenue)}</span></div>
                            </div>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                            <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1 text-center">G.Phẫu Bệnh</div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">GPB:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.gpb.gpb}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">IHC/Gen:</span><span className="font-bold dark:text-white">{data.paraclinicalZones.gpb.ihc + data.paraclinicalZones.gpb.gen}</span></div>
                                <div className="flex justify-between text-[10px] border-t border-slate-100 dark:border-slate-700 mt-1 pt-1"><span className="text-slate-500">Doanh thu:</span><span className="font-bold text-indigo-500">{formatMill(data.paraclinicalZones.gpb.revenue)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẦN 3: PHÂN TÍCH CHUYÊN SÂU TỪNG CƠ SỞ */}
            <div className="flex-1 min-h-[180px] flex flex-col bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4"/> Phân tích chuyên sâu cấp Khoa / Phòng
                    </h2>
                    <div className="flex bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-lg">
                        {(['k1', 'k2', 'k3'] as const).map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                CƠ SỞ {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        
                        {/* Render Clinical Departments Dynamically based on activeTab */}
                        {data.deepDive[activeTab].ngoai.map((dept, idx) => (
                            <div key={`ngoai-${idx}`} className="space-y-1.5 border border-slate-100 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-800/20">
                                <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase text-center mb-2">{dept.name}</h4>
                                <MetricBox label="BN Nội Trú" value={dept.bn} highlight />
                                <MetricBox label="Công suất G." value={dept.bedOccupancy} unit="%" />
                                <MetricBox label="Doanh thu" value={formatMill(dept.rev)} />
                            </div>
                        ))}

                        {data.deepDive[activeTab].noi.map((dept, idx) => (
                            <div key={`noi-${idx}`} className="space-y-1.5 border border-slate-100 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-800/20">
                                <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase text-center mb-2">{dept.name}</h4>
                                <MetricBox label="BN Nội Trú" value={dept.bn} highlight />
                                <MetricBox label="Công suất G." value={dept.bedOccupancy} unit="%" />
                                <MetricBox label="Doanh thu" value={formatMill(dept.rev)} />
                            </div>
                        ))}

                        {data.deepDive[activeTab].xa.map((dept, idx) => (
                            <div key={`xa-${idx}`} className="space-y-1.5 border border-slate-100 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-800/20">
                                <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase text-center mb-2">{dept.name}</h4>
                                <MetricBox label="BN Nội Trú" value={dept.bn} highlight />
                                <MetricBox label="Công suất G." value={dept.bedOccupancy} unit="%" />
                                <MetricBox label="Doanh thu" value={formatMill(dept.rev)} />
                            </div>
                        ))}

                        <div className="space-y-1.5 border border-slate-100 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-800/20">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase text-center mb-2">Khoa Khám Bệnh</h4>
                            <MetricBox 
                                label="Tổng Khám" 
                                value={liveData?.campuses?.[activeTab]?.outpatients ?? data.deepDive[activeTab].kham.kham} 
                                highlight 
                            />
                            <MetricBox label="Đăng ký mạng" value={data.deepDive[activeTab].kham.online} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ExecutiveStatusLayout;

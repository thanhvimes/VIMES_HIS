import React, { useState } from 'react';
import { mockComprehensiveStatus } from '../data';
import { 
    HospitalIcon, 
    ActivityIcon, 
    UserGroupIcon, 
    CurrencyDollarIcon, 
    CreditCardIcon, 
    ExclamationCircleIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    BeakerIcon,
    EyeIcon
} from '../../../components/Icons';

const ComprehensiveStatusLayout: React.FC = () => {
    const data = mockComprehensiveStatus;
    const [activeTab, setActiveTab] = useState<'k1' | 'k2' | 'k3'>('k1');

    const formatCurrency = (value: number) => {
        return (value / 1000000).toLocaleString('vi-VN') + ' Tr';
    };

    const OverviewCard = ({ title, dataObj }: { title: string, dataObj: any }) => (
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm flex flex-col hover:border-blue-500/50 transition-colors">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <span>{title}</span>
                <HospitalIcon className="w-4 h-4 text-indigo-500"/>
            </h3>
            <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">BN Nội trú</div>
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400">{dataObj.inpatients}</div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Khám trong ngày</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{dataObj.outpatients}</div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Công suất giường</div>
                    <div className="flex items-center gap-2">
                        <div className={`text-lg font-black ${dataObj.bedOccupancy > 100 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {dataObj.bedOccupancy}%
                        </div>
                        {dataObj.bedOccupancy > 100 && <ExclamationCircleIcon className="w-4 h-4 text-rose-500 animate-pulse"/>}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">TT K.Tiền Mặt</div>
                    <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{dataObj.cashlessRate}%</div>
                </div>
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex justify-between">
                        <span>Thu / Chi</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold">{formatCurrency(dataObj.revenue)}</span>
                    </div>
                </div>
                <div className="col-span-2 mt-1">
                    <div className={`text-[11px] font-bold px-2 py-1.5 rounded-md flex items-center gap-2 ${
                        dataObj.alert === 'Bình thường' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                        {dataObj.alert !== 'Bình thường' && <ExclamationCircleIcon className="w-3.5 h-3.5"/>}
                        {dataObj.alert}
                    </div>
                </div>
            </div>
        </div>
    );

    const MetricBox = ({ label, value, unit = '', highlight = false }: { label: string, value: string|number, unit?: string, highlight?: boolean }) => (
        <div className={`p-2 rounded-lg border ${highlight ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-700/30'}`}>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{label}</div>
            <div className={`text-sm font-black ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {value} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden pr-2">
            {/* PHẦN 1: TÌNH HÌNH HOẠT ĐỘNG CHUYÊN MÔN THEO CƠ SỞ */}
            <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <HospitalIcon className="w-4 h-4"/> Tình hình hoạt động chuyên môn theo cơ sở
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <OverviewCard title="Cơ sở K1 (Quán Sứ)" dataObj={data.overview.k1} />
                    <OverviewCard title="Cơ sở K2 (Tam Hiệp)" dataObj={data.overview.k2} />
                    <OverviewCard title="Cơ sở K3 (Tân Triều)" dataObj={data.overview.k3} />
                </div>
            </div>

            {/* PHẦN 2: TÌNH HÌNH HOẠT ĐỘNG CHUYÊN MÔN THEO KHU VỰC */}
            <div className="flex-1 min-h-[220px]">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4"/> Tình hình hoạt động chuyên môn theo khu vực
                </h2>
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm h-full overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* LÂM SÀNG */}
                        <div className="space-y-4">
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">Khối Ngoại</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <MetricBox label="Số BN Mổ" value={data.zones.ngoai.mo} highlight />
                                    <MetricBox label="BN Nội Trú" value={data.zones.ngoai.noiTru} />
                                    <MetricBox label="Công Suất" value={data.zones.ngoai.bedOccupancy} unit="%" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">Khối Nội</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <MetricBox label="Truyền Hóa Chất" value={data.zones.noi.truyenHC} />
                                        <MetricBox label="Cấp Cứu" value={data.zones.noi.capCuu} highlight />
                                    </div>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">Khối Xạ</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <MetricBox label="Số BN Xạ" value={data.zones.xa.xaTri} highlight />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CẬN LÂM SÀNG */}
                        <div className="space-y-4">
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                <div className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">X-Quang & Chẩn Đoán Hình Ảnh</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <MetricBox label="Siêu Âm" value={data.zones.xQuang.sieuAm} />
                                    <MetricBox label="X-Quang" value={data.zones.xQuang.xq} />
                                    <MetricBox label="CT Scanner" value={data.zones.xQuang.ct} highlight />
                                    <MetricBox label="MRI" value={data.zones.xQuang.mri} highlight />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">Giải Phẫu Bệnh</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <MetricBox label="XN GPB" value={data.zones.gpb.xnGPB} />
                                        <MetricBox label="XN IHC" value={data.zones.gpb.xnIHC} highlight />
                                        <MetricBox label="XN Gen" value={data.zones.gpb.xnGen} highlight />
                                    </div>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">Nội Soi</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <MetricBox label="Soi Dạ Dày" value={data.zones.noiSoi.soiDaDay} />
                                        <MetricBox label="Soi Đại Tràng" value={data.zones.noiSoi.soiDaiTrang} />
                                        <MetricBox label="NS Can Thiệp" value={data.zones.noiSoi.noiSoiCanThiep} highlight />
                                    </div>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-white uppercase mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">Xét Nghiệm</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <MetricBox label="Sinh Hóa" value={data.zones.xetNghiem.sh} />
                                        <MetricBox label="Huyết Học" value={data.zones.xetNghiem.hh} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PHẦN 3: PHÂN TÍCH CHUYÊN SÂU */}
            <div className="flex-1 min-h-[250px] flex flex-col">
                <div className="flex justify-between items-end mb-3">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4"/> Phân tích chuyên sâu
                    </h2>
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('k1')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'k1' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Cơ sở K1
                        </button>
                        <button 
                            onClick={() => setActiveTab('k2')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'k2' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Cơ sở K2
                        </button>
                        <button 
                            onClick={() => setActiveTab('k3')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'k3' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Cơ sở K3
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
                    {/* Bảng dữ liệu theo dạng Grid thay vì Table truyền thống để dễ nhìn trên Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
                        
                        {/* Cột 1: Khối Ngoại 1 */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                {activeTab === 'k1' ? 'Ngoại QS1' : activeTab === 'k2' ? 'Khoa Ngoại' : 'Các Khoa Ngoại'}
                            </h4>
                            <MetricBox label="Số BN" value={data.deepDive[activeTab][activeTab === 'k1' ? 'ngoaiQS1' : activeTab === 'k2' ? 'khoaNgoai' : 'cacKhoaNgoai'].bn} />
                            <MetricBox label="Công suất G." value={data.deepDive[activeTab][activeTab === 'k1' ? 'ngoaiQS1' : activeTab === 'k2' ? 'khoaNgoai' : 'cacKhoaNgoai'].bedOccupancy} unit="%" />
                            <MetricBox label="PT Theo Yêu Cầu" value={data.deepDive[activeTab][activeTab === 'k1' ? 'ngoaiQS1' : activeTab === 'k2' ? 'khoaNgoai' : 'cacKhoaNgoai'].ptYeuCau} highlight />
                        </div>

                        {/* Cột 2: Khối Ngoại 2 / Xạ */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                {activeTab === 'k1' ? 'Ngoại QS2' : activeTab === 'k2' ? 'Khoa Xạ 4' : 'Các Khoa Xạ'}
                            </h4>
                            <MetricBox label="Số BN" value={data.deepDive[activeTab][activeTab === 'k1' ? 'ngoaiQS2' : activeTab === 'k2' ? 'khoaXa4' : 'cacKhoaXa'].bn} />
                            <MetricBox label="Công suất G." value={data.deepDive[activeTab][activeTab === 'k1' ? 'ngoaiQS2' : activeTab === 'k2' ? 'khoaXa4' : 'cacKhoaXa'].bedOccupancy} unit="%" />
                            <MetricBox label={activeTab === 'k1' ? 'PT Theo Yêu Cầu' : 'ĐT Theo Yêu Cầu'} value={data.deepDive[activeTab][activeTab === 'k1' ? 'ngoaiQS2' : activeTab === 'k2' ? 'khoaXa4' : 'cacKhoaXa'][activeTab === 'k1' ? 'ptYeuCau' : 'dtYeuCau']} highlight />
                        </div>

                        {/* Cột 3: Khối Nội */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                {activeTab === 'k1' ? 'Nội QS' : activeTab === 'k2' ? 'Khoa Nội' : 'Các Khoa Nội'}
                            </h4>
                            <MetricBox label="Số BN" value={data.deepDive[activeTab][activeTab === 'k1' ? 'noiQS' : activeTab === 'k2' ? 'khoaNoi' : 'cacKhoaNoi'].bn} />
                            <MetricBox label="Công suất G." value={data.deepDive[activeTab][activeTab === 'k1' ? 'noiQS' : activeTab === 'k2' ? 'khoaNoi' : 'cacKhoaNoi'].bedOccupancy} unit="%" />
                            <MetricBox label="ĐT Theo Yêu Cầu" value={data.deepDive[activeTab][activeTab === 'k1' ? 'noiQS' : activeTab === 'k2' ? 'khoaNoi' : 'cacKhoaNoi'].dtYeuCau} highlight />
                        </div>

                        {/* Cột 4: YCQS / Chống đau */}
                        {activeTab !== 'k3' && (
                            <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                                <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                    {activeTab === 'k1' ? 'Yêu Cầu QS' : 'Chống Đau'}
                                </h4>
                                <MetricBox label="Số BN" value={data.deepDive[activeTab][activeTab === 'k1' ? 'ycqs' : 'chongDau'].bn} />
                                <MetricBox label="Công suất G." value={data.deepDive[activeTab][activeTab === 'k1' ? 'ycqs' : 'chongDau'].bedOccupancy} unit="%" />
                                <MetricBox label="ĐT Theo Yêu Cầu" value={data.deepDive[activeTab][activeTab === 'k1' ? 'ycqs' : 'chongDau'].dtYeuCau} highlight />
                            </div>
                        )}

                        {/* Cột 5: CĐHA */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                CĐ Hình Ảnh
                            </h4>
                            <MetricBox label="Số Siêu Âm" value={data.deepDive[activeTab].cdha.sa} />
                            <MetricBox label="Số X-Quang" value={data.deepDive[activeTab].cdha.xq} />
                            <MetricBox label="Số CT" value={data.deepDive[activeTab].cdha.ct} highlight />
                            <MetricBox label="Số MRI" value={data.deepDive[activeTab].cdha.mri} highlight />
                        </div>

                        {/* Cột 6: Xét nghiệm */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                Xét Nghiệm
                            </h4>
                            <MetricBox label="Số XN HH" value={data.deepDive[activeTab].xetNghiem.xnHh} />
                            <MetricBox label="Số XN SH" value={data.deepDive[activeTab].xetNghiem.xnSh} />
                        </div>

                        {/* Cột 7: Nội Soi */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                Nội Soi (NS)
                            </h4>
                            <MetricBox label="Soi Dạ Dày" value={data.deepDive[activeTab].ns.soiDd} />
                            <MetricBox label="Soi Đại Tràng" value={data.deepDive[activeTab].ns.soiDt} />
                            <MetricBox label="Can Thiệp" value={data.deepDive[activeTab].ns.noiSoiCanThiep} highlight />
                        </div>

                        {/* Cột 8: GPB */}
                        <div className="space-y-2 border-r border-slate-100 dark:border-slate-700/50 pr-3">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                Giải Phẫu Bệnh
                            </h4>
                            <MetricBox label="Số XN GPB" value={data.deepDive[activeTab].gpb.xnGpb} />
                            <MetricBox label="Số XN TBH" value={data.deepDive[activeTab].gpb.xnTbh} />
                            <MetricBox label="Số XN Gen" value={data.deepDive[activeTab].gpb.xnGen} highlight />
                            <MetricBox label="Số XN IHC" value={data.deepDive[activeTab].gpb.xnIhc} highlight />
                        </div>

                        {/* Cột 9: Khám */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-700/30 p-1.5 rounded text-center mb-2">
                                Khoa Khám
                            </h4>
                            <MetricBox label="Số Khám" value={data.deepDive[activeTab].kham.soKham} />
                            <MetricBox label="Đăng Ký Qua Mạng" value={data.deepDive[activeTab].kham.dangKyMang} highlight />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComprehensiveStatusLayout;

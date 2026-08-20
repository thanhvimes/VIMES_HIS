// ==================== HOSPITAL STATISTICS MODULE ROOT ====================
// File: modules/hospital-statistics/index.tsx

import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { DashboardOverview } from './views/DashboardOverview';
import { HospitalActivityView } from './views/HospitalActivityView';
import { ClinicStatisticsView } from './views/ClinicStatisticsView';
import { InpatientStatisticsView } from './views/InpatientStatisticsView';
import { ParaclinicalStatisticsView } from './views/ParaclinicalStatisticsView';
import { SurgeryStatisticsView } from './views/SurgeryStatisticsView';
import { DepartmentCostView } from './views/DepartmentCostView';
import { BedOccupancyView } from './views/BedOccupancyView';
import { 
    ChartBarIcon, 
    BuildingOfficeIcon, 
    UserGroupIcon, 
    HeartIcon, 
    SparklesIcon, 
    CurrencyDollarIcon 
} from '../../components/Icons';

const TABS = [
    { path: '/hospital-statistics/dashboard', label: 'Bảng Điều Khiển', icon: ChartBarIcon },
    { path: '/hospital-statistics/hospital-activity', label: 'Hoạt Động BV', icon: BuildingOfficeIcon },
    { path: '/hospital-statistics/clinics', label: 'Phòng Khám', icon: UserGroupIcon },
    { path: '/hospital-statistics/inpatient', label: 'Điều Trị Nội Trú', icon: HeartIcon },
    { path: '/hospital-statistics/paraclinical', label: 'Cận Lâm Sàng', icon: SparklesIcon },
    { path: '/hospital-statistics/surgery', label: 'Phẫu Thuật - Thủ Thuật', icon: SparklesIcon },
    { path: '/hospital-statistics/department-costs', label: 'Chi Phí Khoa Phòng', icon: CurrencyDollarIcon },
    { path: '/hospital-statistics/bed-occupancy', label: 'Công Suất Giường', icon: BuildingOfficeIcon }
];

const HospitalStatisticsModule: React.FC = () => {
    return (
        <div className="p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto space-y-5 sm:space-y-6">
            {/* Top Sub-Navigation Pill Bar */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5 overflow-x-auto print:hidden touch-pan-x scrollbar-thin">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </NavLink>
                    );
                })}
            </div>

            {/* Routes with absolute fallbacks */}
            <Routes>
                <Route path="/" element={<Navigate to="/hospital-statistics/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="hospital-activity" element={<HospitalActivityView />} />
                <Route path="clinics" element={<ClinicStatisticsView />} />
                <Route path="inpatient" element={<InpatientStatisticsView />} />
                <Route path="paraclinical" element={<ParaclinicalStatisticsView />} />
                <Route path="surgery" element={<SurgeryStatisticsView />} />
                <Route path="department-costs" element={<DepartmentCostView />} />
                <Route path="bed-occupancy" element={<BedOccupancyView />} />
                <Route path="*" element={<Navigate to="/hospital-statistics/dashboard" replace />} />
            </Routes>
        </div>
    );
};

export default HospitalStatisticsModule;

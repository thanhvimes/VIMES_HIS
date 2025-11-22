
import React, { useState } from 'react';
import { CheckCircleIcon } from '../../../../components/Icons';

const SafetyChecklistModal: React.FC = () => {
    const [checks, setChecks] = useState({
        signIn: {
            identity: false,
            siteMarked: false,
            anesthesiaCheck: false,
            pulseOximeter: false,
            allergy: false,
            airway: false
        },
        timeOut: {
            teamIntro: false,
            patientConfirm: false,
            antibiotics: false,
            imaging: false
        },
        signOut: {
            procedureName: false,
            instrumentCount: false,
            specimenLabel: false,
            equipmentIssues: false
        }
    });

    const toggleCheck = (phase: 'signIn' | 'timeOut' | 'signOut', key: string) => {
        setChecks(prev => ({
            ...prev,
            [phase]: {
                ...prev[phase],
                // @ts-ignore
                [key]: !prev[phase][key]
            }
        }));
    };

    const renderSection = (title: string, phase: 'signIn' | 'timeOut' | 'signOut', items: {key: string, label: string}[]) => (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 h-full flex flex-col">
            <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400 mb-4 border-b border-slate-200 dark:border-slate-600 pb-2">
                {title}
            </h3>
            <div className="space-y-3 flex-1">
                {items.map(item => (
                    <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                // @ts-ignore
                                checked={checks[phase][item.key]}
                                onChange={() => toggleCheck(phase, item.key)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 dark:border-slate-500 shadow transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
                            />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </span>
                        </div>
                        <span className={`text-sm ${
                            // @ts-ignore
                            checks[phase][item.key] ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                            {item.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-y-auto pb-4">
                {renderSection("SIGN IN (Trước Gây mê)", "signIn", [
                    { key: "identity", label: "Đã xác nhận danh tính, vùng mổ, giấy cam kết" },
                    { key: "siteMarked", label: "Đã đánh dấu vùng mổ (hoặc không áp dụng)" },
                    { key: "anesthesiaCheck", label: "Đã kiểm tra máy gây mê và thuốc" },
                    { key: "pulseOximeter", label: "Đã gắn Pulse Oximeter và đang hoạt động" },
                    { key: "allergy", label: "Người bệnh có dị ứng không?" },
                    { key: "airway", label: "Đánh giá đường thở và nguy cơ sặc" }
                ])}
                
                {renderSection("TIME OUT (Trước Rạch da)", "timeOut", [
                    { key: "teamIntro", label: "Tất cả thành viên đã giới thiệu tên và vai trò" },
                    { key: "patientConfirm", label: "Xác nhận lại tên BN, thủ thuật và vị trí rạch" },
                    { key: "antibiotics", label: "Kháng sinh dự phòng đã tiêm trong 60 phút qua" },
                    { key: "imaging", label: "Hình ảnh chẩn đoán cần thiết đã được hiển thị" }
                ])}

                {renderSection("SIGN OUT (Trước khi rời phòng)", "signOut", [
                    { key: "procedureName", label: "Điều dưỡng xác nhận tên thủ thuật đã làm" },
                    { key: "instrumentCount", label: "Đã đếm đủ gạc, kim và dụng cụ" },
                    { key: "specimenLabel", label: "Bệnh phẩm đã được dán nhãn đúng" },
                    { key: "equipmentIssues", label: "Có vấn đề gì về thiết bị cần lưu ý không?" }
                ])}
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition">
                    <CheckCircleIcon className="w-5 h-5"/> Lưu Bảng Kiểm
                </button>
            </div>
        </div>
    );
};

export default SafetyChecklistModal;

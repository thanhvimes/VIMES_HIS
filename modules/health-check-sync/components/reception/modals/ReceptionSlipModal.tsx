import React from 'react';
import Barcode from 'react-barcode';
import { PrinterIcon } from '../../../../../components/Icons';
import { useSystemStore } from '../../../../../stores/useSystemStore';

interface ReceptionSlipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: () => void;
    previewData: {
        docNo: string | null;
        emp: any;
        services?: any[];
    } | null;
    hospitalName?: string;
    settings?: any;
}

export const ReceptionSlipModal: React.FC<ReceptionSlipModalProps> = ({
    isOpen,
    onClose,
    onPrint,
    previewData,
    hospitalName,
    settings,
}) => {
    if (!isOpen || !previewData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 overflow-hidden animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-xs font-extrabold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <PrinterIcon className="w-4 h-4" />
                        Xem trước phiếu tiếp đón
                    </span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Paper Body */}
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-100/80 dark:bg-slate-950 flex justify-center">
                    <div className="bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 p-5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800 w-full max-w-[300px] flex flex-col gap-3 font-sans text-xs">
                        {/* Hospital & Title */}
                        <div className="text-center">
                            <div className="text-[10.5px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-tight leading-tight">
                                {(hospitalName || useSystemStore.getState().hospitalName || settings?.company_name || 'BỆNH VIỆN ĐA KHOA').toUpperCase()}
                            </div>
                            <div className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                KHOA KHÁM BỆNH - KSK
                            </div>
                            <div className="text-base font-black mt-1 text-[#0f766e] dark:text-teal-400 uppercase tracking-wider">
                                PHIẾU TIẾP ĐÓN
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 dark:border-slate-700"></div>

                        {/* Patient Info */}
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 font-medium">Số hồ sơ:</span>
                                <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-black text-sm px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800 tracking-wider font-mono">
                                    {previewData.docNo}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-2 pt-0.5">
                                <span className="text-slate-500 font-medium whitespace-nowrap">Họ và tên:</span>
                                <strong className="text-slate-900 dark:text-white uppercase font-extrabold text-[12.5px] text-right">
                                    {previewData.emp.name}
                                </strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Ngày sinh:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {previewData.emp.dob ? previewData.emp.dob.split('-').reverse().join('/') : ''}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Giới tính:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {previewData.emp.gender === 'F' || previewData.emp.gender === 'Nữ' ? 'Nữ' : (previewData.emp.gender === 'M' || previewData.emp.gender === 'Nam' ? 'Nam' : previewData.emp.gender || '---')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Số CCCD:</span>
                                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                    {previewData.emp.card_id || previewData.emp.cardId || '---'}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 dark:border-slate-700"></div>

                        {/* Vitals Section */}
                        <div className="space-y-1 text-xs">
                            <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center mb-1">
                                THÔNG TIN SINH HIỆU
                            </div>
                            <div className="space-y-1.5 font-medium">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Mạch:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal">lần/phút</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Nhiệt độ:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal">°C</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Huyết áp:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal">mmHg</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Chiều cao:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal">cm</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Cân nặng:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal">kg</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Mắt phải:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal"></span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-600 dark:text-slate-400">Mắt trái:</span>
                                    <div className="flex-1 border-b border-dotted border-slate-400 mx-2 h-3"></div>
                                    <span className="text-slate-500 font-normal"></span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 dark:border-slate-700"></div>

                        {/* Real Barcode Render */}
                        <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-sm">
                            {previewData.docNo ? (
                                <Barcode 
                                    value={String(previewData.docNo)} 
                                    format="CODE128"
                                    width={1.6} 
                                    height={44} 
                                    fontSize={12} 
                                    font="monospace"
                                    margin={0}
                                    displayValue={true}
                                    lineColor="#000"
                                />
                            ) : (
                                <span className="text-slate-400 text-xs italic py-2">Chưa có số hồ sơ</span>
                            )}
                        </div>

                        <div className="border-t border-dashed border-slate-300 dark:border-slate-700"></div>
                        <div className="text-[10px] text-center text-slate-400 italic">
                            Vui lòng giữ phiếu trong suốt quá trình khám!
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={onPrint}
                        className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        Thực hiện in
                    </button>
                </div>
            </div>
        </div>
    );
};

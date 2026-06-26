// ==================== PRINTABLE FORM VIEW ====================
// File: modules/health-check-sync/forms/PrintForm.tsx

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSystemStore } from '../../../stores/useSystemStore';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import PdfPreviewModal from '../../../components/ui/PdfPreviewModal';
import { useSession } from '../../../contexts/SessionContext';
import { catalogService } from '../../../services/catalogService';

interface PrintFormProps {
    document: any;
    onClose: () => void;
}

const PrintForm: React.FC<PrintFormProps> = ({ document, onClose }) => {
    const { hospitalName, parentOrg, fetchBrandingSettings, brandingLoaded } = useSystemStore();
    const { user } = useSession();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(true);
    const [progress, setProgress] = useState(0);
    const [signatures, setSignatures] = useState<any[]>([]);
    const [htmlFallback, setHtmlFallback] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        catalogService.getDoctors().then(setDoctors).catch(() => {});
    }, []);

    // Create portal container directly under document.body to avoid parent layout overflow hidden constraints
    const [portalContainer] = useState(() => {
        const div = window.document.createElement('div');
        div.className = 'print-portal-container';
        return div;
    });

    useEffect(() => {
        window.document.body.appendChild(portalContainer);
        return () => {
            window.document.body.removeChild(portalContainer);
        };
    }, [portalContainer]);

    useEffect(() => {
        if (htmlFallback) {
            portalContainer.classList.add('html-preview-active');
        } else {
            portalContainer.classList.remove('html-preview-active');
        }
    }, [htmlFallback, portalContainer]);

    useEffect(() => {
        if (!brandingLoaded) {
            fetchBrandingSettings();
        }
    }, [brandingLoaded, fetchBrandingSettings]);

    const activeRef = useRef(true);

    useEffect(() => {
        activeRef.current = true;
        const timer = setTimeout(() => {
            if (activeRef.current) {
                generatePdf();
            }
        }, 600);

        return () => {
            activeRef.current = false;
            clearTimeout(timer);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, []);

    const generatePdf = async () => {
        if (!containerRef.current) {
            console.error("containerRef is null!");
            if (activeRef.current) {
                setIsGenerating(false);
                setHtmlFallback(true);
            }
            return;
        }
        
        let originalFonts: any = null;
        try {
            if (window.document && (window.document as any).fonts) {
                originalFonts = (window.document as any).fonts;
                const mockFonts = Object.create(Object.getPrototypeOf(originalFonts));
                Object.defineProperty(mockFonts, 'ready', {
                    get: () => Promise.resolve(),
                    configurable: true
                });
                
                // Copy properties
                for (const key in originalFonts) {
                    try {
                        if (typeof originalFonts[key] === 'function') {
                            mockFonts[key] = originalFonts[key].bind(originalFonts);
                        } else if (key !== 'ready') {
                            Object.defineProperty(mockFonts, key, {
                                get: () => originalFonts[key],
                                configurable: true
                            });
                        }
                    } catch (e) {}
                }

                Object.defineProperty(window.document, 'fonts', {
                    value: mockFonts,
                    configurable: true,
                    writable: true
                });
            }
        } catch (e) {
            console.warn("Failed to mock document.fonts:", e);
        }
        
        try {
            console.log("Starting PDF generation with fallback timeout...");
            
            // Define the rendering logic wrapped in a promise
            const renderingPromise = (async () => {
                const pages = containerRef.current!.querySelectorAll('.a4-page');
                console.log("Found pages:", pages.length);
                if (pages.length === 0) {
                    throw new Error("No A4 pages found for PDF generation");
                }

                const pdf = new jsPDF('p', 'mm', 'a4');
                const total = pages.length;

                for (let i = 0; i < total; i++) {
                    if (!activeRef.current) return null;
                    setProgress(Math.round((i / total) * 100));
                    
                    const page = pages[i];
                    console.log(`Rendering page ${i + 1}/${total}...`);
                    
                    // Promise.race to ensure each page render doesn't hang more than 6 seconds
                    const canvas = await Promise.race([
                        html2canvas(page as HTMLElement, {
                            scale: 2, // Tăng scale lên 2 để chữ nét hơn (chuẩn in ấn)
                            useCORS: true,
                            logging: false,
                            allowTaint: true,
                            backgroundColor: '#ffffff'
                        }),
                        new Promise<never>((_, reject) => 
                            setTimeout(() => reject(new Error(`Timeout rendering page ${i + 1}`)), 6000)
                        )
                    ]);
                    
                    if (!activeRef.current) return null;
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    console.log(`Page ${i + 1} rendered, imgData size:`, imgData.length);
                    if (i > 0) {
                        pdf.addPage();
                    }
                    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                }

                if (!activeRef.current) return null;
                setProgress(100);
                console.log("PDF pages combined, outputting blob...");
                const pdfBlob = pdf.output('blob');
                return URL.createObjectURL(pdfBlob);
            })();

            // Race the entire rendering process against a 20-second timeout
            const url = await Promise.race([
                renderingPromise,
                new Promise<null>((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout generating PDF")), 20000)
                )
            ]);

            if (!activeRef.current) return;
            if (url) {
                setPdfUrl(url);
                setIsGenerating(false);
            } else {
                setHtmlFallback(true);
                setIsGenerating(false);
            }
        } catch (err: any) {
            console.error("Error generating PDF:", err);
            if (activeRef.current) {
                setErrorMsg(err?.message || "Lỗi khởi tạo PDF");
                setHtmlFallback(true);
                setIsGenerating(false);
            }
        } finally {
            if (originalFonts) {
                try {
                    Object.defineProperty(window.document, 'fonts', {
                        value: originalFonts,
                        configurable: true,
                        writable: true
                    });
                } catch (e) {}
            }
        }
    };

    if (!document) return null;

    const getFormTitle = (type: string) => {
        const names: Record<string, string> = {
            '1': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (TRẺ EM 6 - 18 TUỔI)',
            '2': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ',
            '3': 'SỔ KHÁM SỨC KHỎE CHO NGƯỜI LÁI XE',
            '4': 'GIẤY KHÁM SỨC KHỎE NHÂN VIÊN ĐƯỜNG SẮT',
            '5': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ CHO THUYỀN VIÊN',
            '6': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ TRÊN 0 - 2 THÁNG',
            '7': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 2 - 3 THÁNG',
            '8': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 4 - 6 THÁNG',
            '9': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 7 - 9 THÁNG',
            '10': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 10 - 12 THÁNG',
            '11': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 13 - 18 THÁNG',
            '12': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 19 - 24 THÁNG',
            '13': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 2 - 6 TUỔI',
            '14': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH 3 THÁNG - 6 TUỔI',
            '15': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH LỚP 1 - LỚP 5',
            '16': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH LỚP 6 - LỚP 9',
            '17': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ HỌC SINH LỚP 10 - LỚP 12',
        };
        return names[type] || `GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (MẪU ${type})`;
    };

    const clinical = document.clinical_data || {};
    const clinicalExam = clinical.clinical_exam || {};
    const extra = clinical.extra || {};
    const lab = document.lab_data || {};
    const conclusion = document.conclusion_data || {};
    const paraclinicalItems = lab.paraclinical_items || [];

    // Helper functions for data display
    const getAge = (dobString: any) => {
        if (!dobString) return '...';
        try {
            const birthDate = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch {
            return '...';
        }
    };

    const getReportDate = () => {
        const dateSource = document.created_at || new Date();
        const d = new Date(dateSource);
        return {
            day: d.getDate(),
            month: d.getMonth() + 1,
            year: d.getFullYear()
        };
    };

    const formatFitnessClassName = (fitClass: any) => {
        const names: Record<string, string> = {
            '1': 'Rất khỏe',
            '2': 'Khỏe',
            '3': 'Trung bình',
            '4': 'Yếu',
            '5': 'Rất yếu'
        };
        return names[fitClass] || 'Rất khỏe';
    };

    const formatPlText = (pl: any) => {
        if (!pl) return '...';
        const names: Record<string, string> = {
            '1': '1 - Khỏe mạnh',
            '2': '2 - Có bệnh nhẹ',
            '3': '3 - Bệnh lý cần theo dõi',
            '4': '4 - Yếu',
            '5': '5 - Rất yếu / Chống chỉ định'
        };
        return names[pl] || `${pl}`;
    };

    const getConclusionDoctorName = () => {
        if (conclusion.doctor_id) {
            const found = doctors.find(d => String(d.id || d.hee_employee_id) === String(conclusion.doctor_id));
            if (found) return found.name || found.hee_fullname;
        }
        return conclusion.doctor_name || 'BSCKI. Hà Thị Thanh Mai';
    };

    const getDoctor = (specialty: string) => {
        const metadataMap: Record<string, string> = {
            tuan_hoan: 'internal',
            ho_hap: 'internal',
            tieu_hoa: 'internal',
            than_tiet_nieu: 'internal',
            noi_tiet: 'internal',
            co_xuong_khop: 'internal',
            than_kinh: 'internal',
            tam_than: 'internal',
            ngoai_khoa: 'surgery',
            da_lieu: 'dermatology',
            san_phu_khoa: 'gynecology',
            mat: 'eye',
            tai_mui_hong: 'ent',
            rang_ham_mat: 'dental',
        };
        
        const metaKey = metadataMap[specialty];
        const docMeta = clinical.specialty_metadata?.[metaKey] || clinicalExam.specialty_metadata?.[metaKey];
        if (docMeta?.doctorId) {
            const found = doctors.find(d => String(d.id || d.hee_employee_id) === String(docMeta.doctorId));
            if (found) return found.name || found.hee_fullname;
        }

        if (metaKey && clinicalExam.specialty_metadata?.[metaKey]?.doctorName) {
            return clinicalExam.specialty_metadata[metaKey].doctorName;
        }

        if (clinicalExam[`doctor_${specialty}`]) return clinicalExam[`doctor_${specialty}`];
        if (clinicalExam.doctor_name) return clinicalExam.doctor_name;
        if (['ngoai_khoa', 'da_lieu', 'tai_mui_hong', 'rang_ham_mat'].includes(specialty)) {
            return getConclusionDoctorName();
        }
        return getConclusionDoctorName();
    };

    const formatEyeExam = () => {
        const parts = [];
        if (clinicalExam.khong_kinh_mat_phai || clinicalExam.khong_kinh_mat_trai) {
            parts.push(`KK: MP ${clinicalExam.khong_kinh_mat_phai || '...'}/MT ${clinicalExam.khong_kinh_mat_trai || '...'}`);
        }
        if (clinicalExam.co_kinh_mat_phai || clinicalExam.co_kinh_mat_trai) {
            parts.push(`CK: MP ${clinicalExam.co_kinh_mat_phai || '...'}/MT ${clinicalExam.co_kinh_mat_trai || '...'}`);
        }
        const otherEyeDiseases = clinicalExam.benh_ve_mat || clinicalExam.benh_mat || 'Không';
        parts.push(`Bệnh: ${otherEyeDiseases}`);
        
        if (!clinicalExam.khong_kinh_mat_phai && !clinicalExam.khong_kinh_mat_trai && !clinicalExam.co_kinh_mat_phai && !clinicalExam.co_kinh_mat_trai) {
            return clinicalExam.eye || 'Mắt phải 10/10, Mắt trái 10/10';
        }
        return parts.join('; ');
    };

    const formatEntExam = () => {
        const parts = [];
        if (clinicalExam.tai_trai_noi_thuong || clinicalExam.tai_trai_noi_tham) {
            parts.push(`Trái: ${clinicalExam.tai_trai_noi_thuong || '...'} m / nói thầm ${clinicalExam.tai_trai_noi_tham || '...'} m`);
        }
        if (clinicalExam.tai_phai_noi_thuong || clinicalExam.tai_phai_noi_tham) {
            parts.push(`Phải: ${clinicalExam.tai_phai_noi_thuong || '...'} m / nói thầm ${clinicalExam.tai_phai_noi_tham || '...'} m`);
        }
        const otherEntDiseases = clinicalExam.benh_tai_mui_hong || 'Không';
        parts.push(`Bệnh: ${otherEntDiseases}`);
        
        if (!clinicalExam.tai_trai_noi_thuong && !clinicalExam.tai_trai_noi_tham && !clinicalExam.tai_phai_noi_thuong && !clinicalExam.tai_phai_noi_tham) {
            return clinicalExam.ent || 'Bình thường';
        }
        return parts.join('; ');
    };

    const formatDentalExam = () => {
        const parts = [];
        if (clinicalExam.ham_tren) {
            parts.push(`Trên: ${clinicalExam.ham_tren}`);
        }
        if (clinicalExam.ham_duoi) {
            parts.push(`Dưới: ${clinicalExam.ham_duoi}`);
        }
        const otherDentalDiseases = clinicalExam.benh_rang_ham_mat || 'Không';
        parts.push(`Bệnh: ${otherDentalDiseases}`);
        
        if (!clinicalExam.ham_tren && !clinicalExam.ham_duoi) {
            return clinicalExam.dental || 'Bình thường';
        }
        return parts.join('; ');
    };

    const getBpttName = (val: any) => {
        const names: Record<string, string> = {
            '1': 'Bao cao su',
            '2': 'Thuốc uống tránh thai',
            '3': 'Đặt dụng cụ tử cung',
            '4': 'Triệt sản',
            '9': 'Khác'
        };
        return names[val] || '';
    };

    const isNam = document.gender === 'Nam' || document.gender === '1';
    const isNu = document.gender === 'Nữ' || document.gender === '2' || document.gender === '0';

    const tinhChatKinh = extra.tinh_chat_kinh_nguyet; 
    const isKinhDeu = tinhChatKinh === '1';
    const isKinhKhongDeu = tinhChatKinh === '0';
    const isDauBungKinh = extra.dau_bung_kinh === '1';
    const isKhongDauBungKinh = extra.dau_bung_kinh === '0' || !extra.dau_bung_kinh;

    const isLapGiaDinh = extra.da_lap_gia_dinh === '1';
    const isChuaLapGiaDinh = extra.da_lap_gia_dinh === '0' || !extra.da_lap_gia_dinh;
    const isMoSan = extra.da_tung_mo_san_phu_khoa_chua === '1';
    const isChuaMoSan = extra.da_tung_mo_san_phu_khoa_chua === '0' || !extra.da_tung_mo_san_phu_khoa_chua;
    const isBPTT = extra.dang_ap_dung_bptt_khong === '1';
    const isKhongBPTT = extra.dang_ap_dung_bptt_khong === '0' || !extra.dang_ap_dung_bptt_khong;

    const cccdDate = clinical.cccd_date || clinical.ngaycap_cccd || extra.cccd_date || extra.ngaycap_cccd || document.cccd_date || '';
    const cccdPlace = clinical.cccd_place || clinical.noicap_cccd || extra.cccd_place || extra.noicap_cccd || document.cccd_place || '';
    const prevJob = clinical.nghe_cong_viec_truoc_day || extra.nghe_cong_viec_truoc_day || '';
    const prevJobYears = clinical.thoi_gian_lam_viec_truoc_day_nam || extra.thoi_gian_lam_viec_truoc_day_nam || '';
    const prevJobMonths = clinical.thoi_gian_lam_viec_truoc_day_thang || extra.thoi_gian_lam_viec_truoc_day_thang || '';
    const prevJobFrom = clinical.tu_ngay_lam_viec_truoc_day || extra.tu_ngay_lam_viec_truoc_day || '';
    const prevJobTo = clinical.den_ngay_lam_viec_truoc_day || extra.den_ngay_lam_viec_truoc_day || '';

    // Split Xét nghiệm items for Page 3 and Page 4 manually
    const xnItems = paraclinicalItems.filter((x: any) => x.type === 'XN');
    const xnItemsPage3 = xnItems.slice(0, 5);
    const xnItemsPage4 = xnItems.slice(5);

    return createPortal(
        <>
            {/* 1. Loader screen when generating PDF */}
            {isGenerating && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col justify-center items-center text-white">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl flex flex-col items-center space-y-4 max-w-sm w-full mx-4">
                        <div className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
                        <div className="text-center font-sans">
                            <span className="font-bold text-sm block">Đang khởi tạo bản in PDF</span>
                            <span className="text-xs text-slate-400 mt-1 block">Vui lòng chờ giây lát ({progress}%)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PDF Viewer Modal once generated */}
            {!isGenerating && pdfUrl && (
                <PdfPreviewModal
                    isOpen={true}
                    onClose={onClose}
                    pdfUrl={pdfUrl}
                    fileName={`KSK_DinhKy_${document.doc_no || document.patient_name}.pdf`}
                    isSignable={true}
                    signatures={signatures}
                    onSign={(signatureDataUrl, placement, signerName, signerTitle) => {
                        const newSig = {
                            id: Math.random().toString(),
                            signerName: signerName || user?.fullName || document.conclusion_data?.doctor_name || 'Người dùng',
                            signerUsername: user?.username || '',
                            signerTitle: signerTitle || (user as any)?.title || 'Nhân viên y tế',
                            signedAt: new Date(),
                            dataUrl: signatureDataUrl,
                            placement
                        };
                        setSignatures(prev => [...prev, newSig]);
                    }}
                    onDeleteSignature={(index) => {
                        setSignatures(prev => prev.filter((_, i) => i !== index));
                    }}
                    onSubmit={() => {
                        alert('Trình ký hồ sơ khám sức khỏe thành công!');
                    }}
                />
            )}

            {/* 2.5. HTML Print Fallback Header (Only visible when htmlFallback is true) */}
            {htmlFallback && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-lg z-[999] no-print font-sans">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
                            <span className="font-bold">Chế độ in HTML dự phòng</span> (Không thể nạp trình xem PDF)
                        </div>
                        {errorMsg && (
                            <span className="text-xs text-slate-400 italic max-w-xs truncate" title={errorMsg}>
                                Chi tiết: {errorMsg}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow transition cursor-pointer text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>In biểu mẫu (Ctrl + P)</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition cursor-pointer text-sm font-semibold"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            )}

            {/* 3. Offscreen container for HTML render and PDF capture (or visible preview on fallback) */}
            <div 
                ref={containerRef}
                style={htmlFallback ? {
                    position: 'relative',
                    width: '210mm',
                    margin: '64px auto 0 auto',
                    background: '#f8fafc',
                    padding: '24px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    zIndex: 10,
                    opacity: 1,
                    pointerEvents: 'auto'
                } : {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '210mm',
                    height: '1px',
                    overflow: 'hidden',
                    opacity: 0.01,
                    zIndex: -9999,
                    pointerEvents: 'none'
                }}
                className={`a4-page-content font-serif select-text ${htmlFallback ? 'html-preview-mode' : ''}`}
            >
                <style>{`
                    /* Override modern oklch variables at the container scope for html2canvas compatibility */
                    .a4-page-content, .a4-page-content * {
                        --color-black: #000000 !important;
                        --color-white: #ffffff !important;
                        --color-slate-50: #f8fafc !important;
                        --color-slate-100: #f1f5f9 !important;
                        --color-slate-200: #e2e8f0 !important;
                        --color-slate-300: #cbd5e1 !important;
                        --color-slate-400: #94a3b8 !important;
                        --color-slate-500: #64748b !important;
                        --color-slate-600: #475569 !important;
                        --color-slate-700: #334155 !important;
                        --color-slate-800: #1e293b !important;
                        --color-slate-900: #0f172a !important;
                        --color-teal-50: #f0fdfa !important;
                        --color-teal-100: #ccfbf1 !important;
                        --color-teal-200: #99f6e4 !important;
                        --color-teal-300: #5eead4 !important;
                        --color-teal-400: #2dd4bf !important;
                        --color-teal-500: #14b8a6 !important;
                        --color-teal-600: #0d9488 !important;
                        --color-teal-700: #0f766e !important;
                        --color-teal-800: #115e59 !important;
                        --color-teal-900: #134e4a !important;
                        --color-green-50: #f0fdf4 !important;
                        --color-green-100: #dcfce7 !important;
                        --color-green-200: #bbf7d0 !important;
                        --color-green-300: #86efac !important;
                        --color-green-400: #4ade80 !important;
                        --color-green-500: #22c55e !important;
                        --color-green-600: #16a34a !important;
                        --color-green-700: #15803d !important;
                        --color-green-800: #166534 !important;
                        --color-green-900: #14532d !important;
                        --color-purple-50: #faf5ff !important;
                        --color-purple-100: #f3e8ff !important;
                        --color-purple-200: #e9d5ff !important;
                        --color-purple-300: #d8b4fe !important;
                        --color-purple-400: #c084fc !important;
                        --color-purple-500: #a855f7 !important;
                        --color-purple-600: #9333ea !important;
                        --color-purple-700: #7e22ce !important;
                        --color-purple-800: #6b21a8 !important;
                        --color-purple-900: #581c87 !important;
                    }

                    .a4-page {
                        width: 210mm;
                        height: 297mm;
                        padding: 15mm 15mm 15mm 20mm;
                        background: white;
                        color: black;
                        position: relative;
                        box-sizing: border-box;
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    }
                    .a4-page-content {
                        font-family: "Times New Roman", Times, serif !important;
                        line-height: 1.4;
                        font-size: 13.5px;
                        color: black;
                    }
                    .a4-table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    .a4-table th, .a4-table td {
                        border: 1px solid black !important;
                        padding: 4px 6px;
                    }

                    /* Dynamic print portal fixed positioning on screen */
                    .print-portal-container.html-preview-active {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        z-index: 99999 !important;
                        background: #cbd5e1 !important;
                        overflow-y: auto !important;
                    }
                    
                    @media print {
                        /* Hide everything else */
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        #root, .fixed, .absolute:not(.print-portal-container *), .no-print {
                            display: none !important;
                            height: 0 !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .print-portal-container, .print-portal-container.html-preview-active {
                            display: block !important;
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 210mm !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                            overflow-y: visible !important;
                            z-index: auto !important;
                        }
                        .a4-page-content {
                            position: static !important;
                            width: 210mm !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                            display: block !important;
                            opacity: 1 !important;
                            z-index: auto !important;
                        }
                        .a4-page {
                            width: 210mm !important;
                            height: 297mm !important;
                            padding: 15mm 15mm 15mm 20mm !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            position: relative !important;
                            background: white !important;
                        }
                    }
                `}</style>
                
                {/* ==================== PAGE 1 ==================== */}
                <div className="a4-page">
                    {/* Quốc hiệu tiêu ngữ */}
                    <div className="text-center mb-6">
                        <strong className="text-[13.5px] uppercase block font-bold tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                        <strong className="text-[12.5px] block font-bold mt-0.5">Độc lập - Tự do - Hạnh phúc</strong>
                        <div className="border-t border-black w-40 mx-auto mt-1.5"></div>
                    </div>

                    {/* Tiêu đề chính */}
                    <div className="text-center my-6">
                        <h2 className="text-[18px] font-bold uppercase tracking-wide">{getFormTitle(document.form_type)}</h2>
                    </div>

                    <div className="flex gap-6 mt-8">
                        {/* Ảnh placeholder */}
                        <div className="w-[150px] h-[190px] border border-black flex flex-col justify-center items-center text-center p-3 text-[12px] leading-relaxed shrink-0">
                            <div className="font-bold">Ảnh</div>
                            <div className="mt-1">(4 x 6 cm)</div>
                            <div className="mt-2 text-[10px] italic">(đóng dấu ráp lai)</div>
                        </div>

                        {/* Thông tin hành chính bên phải */}
                        <div className="flex-grow space-y-2.5 text-[13.5px] leading-relaxed">
                            <div>
                                <span className="font-bold">1. Họ và tên: </span>
                                <span className="uppercase font-bold text-[14px]">{document.patient_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <span><span className="font-bold">2. Giới tính:</span></span>
                                <span className="flex items-center gap-1">{isNam ? '☑' : '☐'} Nam</span>
                                <span className="flex items-center gap-1">{isNu ? '☑' : '☐'} Nữ</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-bold">3. Sinh ngày: </span>
                                    <span>{document.dob ? new Date(document.dob).toLocaleDateString('vi-VN') : '.../.../....'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">Tuổi: </span>
                                    <span>{getAge(document.dob)}</span>
                                </div>
                            </div>

                            <div>
                                <span className="font-bold">4. Số CCCD/Hộ chiếu/Định danh CD: </span>
                                <span>{document.cccd || '................................'}</span>
                            </div>

                            <div>
                                <span className="font-bold">5. Cấp ngày: </span>
                                <span>{cccdDate ? new Date(cccdDate).toLocaleDateString('vi-VN') : '.../.../....'}</span>
                                <span className="ml-4 font-bold">Tại: </span>
                                <span>{cccdPlace || '................................'}</span>
                            </div>

                            <div>
                                <span className="font-bold">6. Chỗ ở hiện tại: </span>
                                <span>{clinical.address || '................................................................'}</span>
                            </div>

                            <div>
                                <span className="font-bold">Số điện thoại liên hệ: </span>
                                <span>{clinical.phone || '................................'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2.5 text-[13.5px] leading-relaxed">
                        <div>
                            <span className="font-bold">7. Nghề nghiệp: </span>
                            <span>{clinical.ma_nghe_nghiep || '................................'}</span>
                        </div>

                        <div>
                            <span className="font-bold">8. Nơi công tác, học tập: </span>
                            <span>{clinical.noi_cong_tac_hien_tai || '................................'}</span>
                        </div>

                        <div>
                            <span className="font-bold">9. Ngày bắt đầu vào làm việc tại đơn vị hiện nay: </span>
                            <span>{clinical.ngay_bat_dau_lam_viec_hien_tai ? new Date(clinical.ngay_bat_dau_lam_viec_hien_tai).toLocaleDateString('vi-VN') : '................................'}</span>
                        </div>

                        <div>
                            <span className="font-bold">10. Nghề, công việc trước đây (liệt kê công việc đã làm trong 10 năm gần đây, tính từ thời điểm gần nhất):</span>
                            <div className="pl-4 mt-1.5 space-y-1">
                                <div>a) {prevJob || '................................................................'}</div>
                                <div className="pl-3 text-[12.5px] italic text-slate-700 font-serif">
                                    Thời gian làm việc: {prevJobYears ? `${prevJobYears} năm ` : ''}{prevJobMonths ? `${prevJobMonths} tháng ` : ''}
                                    {prevJobFrom && prevJobTo ? `từ ngày ${new Date(prevJobFrom).toLocaleDateString('vi-VN')} đến ${new Date(prevJobTo).toLocaleDateString('vi-VN')}` : 'từ ngày ........./......../......... đến ........./......../.........'}
                                </div>
                                <div className="mt-1">b) ............................................................................................................</div>
                                <div className="pl-3 text-[12.5px] italic text-slate-700 font-serif">
                                    Thời gian làm việc: ......... năm ......... tháng từ ngày ........./......../......... đến ........./......../.........
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <span className="font-bold">11. Tiền sử bệnh, tật của gia đình:</span>
                            <div className="mt-1 pl-4 font-bold border-b border-dotted border-black pb-1">
                                {extra.tsgd_ma_benh || 'Không'}
                            </div>
                        </div>

                        <div className="pt-2">
                            <span className="font-bold">12. Tiền sử bệnh, tật của bản thân:</span>
                            <table className="a4-table w-full mt-2 text-[13px] text-left">
                                <thead>
                                    <tr className="font-bold text-center bg-slate-50">
                                        <th className="w-[42%] text-center">Tên bệnh</th>
                                        <th className="w-[12%] text-center">Phát hiện năm</th>
                                        <th className="w-[34%] text-center">Tên bệnh nghề nghiệp</th>
                                        <th className="w-[12%] text-center">Phát hiện năm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="align-top h-14">
                                        <td>
                                            a) {extra.tsbt_ma_benh ? `Bệnh ${extra.tsbt_ma_benh}` : ''}
                                        </td>
                                        <td className="text-center font-bold">
                                            {extra.tsbt_nam_phat_hien_benh}
                                        </td>
                                        <td>
                                            a) {extra.tsbt_ma_benh_nghe_nghiep ? `Bệnh ${extra.tsbt_ma_benh_nghe_nghiep}` : ''}
                                        </td>
                                        <td className="text-center font-bold">
                                            {extra.tsbt_nam_phat_hien_benh_nghe_nghiep}
                                        </td>
                                    </tr>
                                    <tr className="align-top h-8">
                                        <td>b)</td>
                                        <td></td>
                                        <td>b)</td>
                                        <td></td>
                                    </tr>
                                    <tr className="align-top h-8">
                                        <td>c)</td>
                                        <td></td>
                                        <td>c)</td>
                                        <td></td>
                                    </tr>
                                    <tr className="align-top h-8">
                                        <td>d)</td>
                                        <td></td>
                                        <td>d)</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mt-6 px-8 text-[13px]">
                        <div className="text-center w-52">
                            <strong className="block font-bold">Người lao động xác nhận</strong>
                            <span className="italic text-[11px] font-normal">(Ký và ghi rõ họ, tên)</span>
                        </div>
                        <div className="text-center w-64">
                            <span className="block italic text-[12.5px] mb-0.5">Ninh Bình, ngày {getReportDate().day} tháng {getReportDate().month} năm {getReportDate().year}</span>
                            <strong className="block font-bold">Người lập sổ KSK định kỳ</strong>
                            <span className="italic text-[11px] font-normal">(Ký và ghi rõ họ, tên)</span>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">1/4</div>
                </div>

                {/* ==================== PAGE 2 ==================== */}
                <div className="a4-page">
                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mb-3">I. TIỀN SỬ BỆNH, TẬT</h2>
                    
                    <div className="text-[13.5px] space-y-2 leading-relaxed">
                        <h3 className="font-bold">1. Tiền sử bệnh, tật của bản thân và gia đình:</h3>
                        <div className="pl-4 space-y-1">
                            <div><span className="font-bold">Gia đình:</span> {extra.tsgd_mac_benh === '1' ? 'Mắc bệnh' : 'Không mắc bệnh'} {extra.tsgd_ma_benh ? `(${extra.tsgd_ma_benh})` : ''}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                            <div><span className="font-bold">Bản thân:</span> {extra.tsbt_ma_benh ? `Mắc bệnh ${extra.tsbt_ma_benh}` : 'Không phát hiện bất thường'} {extra.tsbt_nam_phat_hien_benh ? `(Phát hiện năm: ${extra.tsbt_nam_phat_hien_benh})` : ''}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                            <div><span className="font-bold">Bệnh nghề nghiệp:</span> {extra.tsbt_ma_benh_nghe_nghiep ? `Mắc bệnh ${extra.tsbt_ma_benh_nghe_nghiep}` : 'Không phát hiện bất thường'} {extra.tsbt_nam_phat_hien_benh_nghe_nghiep ? `(Phát hiện năm: ${extra.tsbt_nam_phat_hien_benh_nghe_nghiep})` : ''}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                            <div><span className="font-bold">Đang điều trị:</span> {extra.ten_thuoc ? `Có - Thuốc đang dùng: ${extra.ten_thuoc}` : 'Không - Thuốc đang dùng: Không'}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                        </div>
                    </div>
                    
                    <div className="text-[13.5px] mt-4 space-y-2 leading-relaxed">
                        <h3 className="font-bold">2. Tiền sử sản phụ khoa (Đối với nữ):</h3>
                        <div className="pl-4 grid grid-cols-2 gap-y-2 gap-x-8">
                            <div>- Bắt đầu thấy kinh nguyệt năm: <span className="font-semibold">{extra.co_kinh_nguyet_nam_bao_nhieu_tuoi || '.....'}</span> tuổi</div>
                            <div className="flex gap-4">
                                <span>- Tính chất kinh:</span>
                                <span>{isKinhDeu ? '☑' : '☐'} Đều</span>
                                <span>{isKinhKhongDeu ? '☑' : '☐'} Không đều</span>
                            </div>
                            
                            <div>- Chu kỳ kinh: <span className="font-semibold">{extra.chu_ky_kinh || '.....'}</span> ngày</div>
                            <div>- Lượng kinh: <span className="font-semibold">{extra.luong_kinh || '.....'}</span> ngày</div>
                            
                            <div className="flex gap-4">
                                <span>- Đau bụng kinh:</span>
                                <span>{isDauBungKinh ? '☑' : '☐'} Có</span>
                                <span>{isKhongDauBungKinh ? '☑' : '☐'} Không</span>
                            </div>
                            <div className="flex gap-4">
                                <span>- Đã lập gia đình:</span>
                                <span>{isLapGiaDinh ? '☑' : '☐'} Có</span>
                                <span>{isChuaLapGiaDinh ? '☑' : '☐'} Chưa</span>
                            </div>
                            
                            <div className="col-span-2">- PARA: <span className="font-semibold">{extra.para || '................................'}</span></div>
                            
                            <div className="col-span-2 flex gap-4">
                                <span>- Số lần mổ sản, phụ khoa:</span>
                                <span>{isMoSan ? '☑' : '☐'} Có (Ghi rõ: <span className="font-semibold underline">{extra.ghi_ro_mo_san_phu_khoa || '................................'}</span>)</span>
                                <span>{isChuaMoSan ? '☑' : '☐'} Chưa</span>
                            </div>
                            
                            <div className="col-span-2 flex gap-4">
                                <span>- Có đang áp dụng BPTT không?</span>
                                <span>{isBPTT ? '☑' : '☐'} Có (Ghi rõ: <span className="font-semibold underline">{getBpttName(extra.bien_phap_tranh_thai) || '................................'}</span>)</span>
                                <span>{isKhongBPTT ? '☑' : '☐'} Không</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-5 mb-3">III. KHÁM LÂM SÀNG</h2>
                    
                    <table className="a4-table w-full text-[13px]">
                        <thead>
                            <tr className="font-bold bg-slate-50 text-center">
                                <th className="w-[70%] text-center">Nội dung khám</th>
                                <th className="w-[30%] text-center">Họ tên & Chữ ký BS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-slate-100/50">1. Nội khoa</td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">a) Tuần hoàn:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.tim_mach || clinicalExam.kq_tim_mach || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_tuan_hoan_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tuan_hoan')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">b) Hô hấp:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.ho_hap || clinicalExam.kq_ho_hap || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_ho_hap_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('ho_hap')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">c) Tiêu hóa:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.noi_khoa_tieu_hoa || clinicalExam.kq_tieu_hoa || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_tieu_hoa_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tieu_hoa')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">d) Thận-Tiết niệu:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.tiet_nieu_sinh_duc || clinicalExam.kq_tiet_nieu || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_than_tietnieu_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('than_tiet_nieu')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">đ) Nội tiết:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.noi_tiet_dinh_duong_chuyen_hoa || clinicalExam.kq_noi_tiet || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_noi_tiet_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('noi_tiet')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">e) Cơ-xương-khớp:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.kq_co_xuong_khop_m5 || clinicalExam.kq_co_xuong_khop || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_co_xuong_khop_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('co_xuong_khop')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">g) Thần kinh:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.noi_khoa_than_kinh || clinicalExam.kq_than_kinh || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_than_kinh_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('than_kinh')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">h) Tâm thần:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.noi_khoa_tam_than || clinicalExam.kq_tam_than || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.noi_khoa_tam_than_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tam_than')}
                                </td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-slate-100/50">2. Ngoại khoa, Da liễu</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">2/4</div>
                </div>

                {/* ==================== PAGE 3 ==================== */}
                <div className="a4-page">
                    <table className="a4-table w-full text-[13px] border-t-0">
                        <tbody>
                            <tr>
                                <td className="w-[70%]">
                                    <div className="font-bold">- Ngoại khoa:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.external || clinicalExam.kq_ngoai_khoa || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.kham_ngoai_khoa_pl || '1')}</div>
                                </td>
                                <td className="w-[30%] text-center align-middle font-medium text-slate-700">
                                    {getDoctor('ngoai_khoa')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">- Da liễu:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.dermatology || clinicalExam.kq_da_lieu || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.kham_da_lieu_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('da_lieu')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">3. Sản phụ khoa:</div>
                                    <div className="pl-4 text-slate-800">{clinicalExam.gynecology || 'Bình thường'}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.kham_san_phu_khoa_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('san_phu_khoa')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">4. Mắt:</div>
                                    <div className="pl-4 text-slate-800">{formatEyeExam()}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.kham_mat_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('mat')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">5. Tai - Mũi - Họng:</div>
                                    <div className="pl-4 text-slate-800">{formatEntExam()}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.kham_tai_mui_hong_pl || '1')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tai_mui_hong')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="font-bold">6. Răng - Hàm - Mặt:</div>
                                    <div className="pl-4 text-slate-800">{formatDentalExam()}</div>
                                    <div className="pl-4 font-bold text-[11.5px] mt-0.5 text-teal-800">Phân loại: {formatPlText(clinicalExam.kham_rang_ham_mat_pl || '5')}</div>
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('rang_ham_mat')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-5 mb-2">IV. CẬN LÂM SÀNG</h2>
                    
                    <div className="space-y-3.5">
                        {/* I. THĂM DÒ CHỨC NĂNG */}
                        <div>
                            <h3 className="font-bold text-[13px] mb-1">I. THĂM DÒ CHỨC NĂNG</h3>
                            <table className="a4-table w-full text-[12px] text-center">
                                <thead>
                                    <tr className="bg-slate-50 font-bold">
                                        <th className="w-[8%] text-center">STT</th>
                                        <th className="w-[35%] text-center">Tên chỉ định</th>
                                        <th className="w-[12%] text-center">Đơn vị</th>
                                        <th className="w-[20%] text-center">Mô tả</th>
                                        <th className="w-[15%] text-center">Kết luận</th>
                                        <th className="w-[10%] text-center">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const tdItems = paraclinicalItems.filter((x: any) => x.type === 'TD');
                                        if (tdItems.length === 0) {
                                            return (
                                                <tr className="h-7">
                                                    <td colSpan={6} className="text-center py-2 text-slate-500 italic">Không có dữ liệu thăm dò chức năng</td>
                                                </tr>
                                            );
                                        }
                                        return tdItems.map((item: any, idx: number) => (
                                            <tr key={idx} className="h-7">
                                                <td className="text-center">{idx + 1}</td>
                                                <td className="text-left font-semibold">{item.service_name}</td>
                                                <td className="text-center">{item.unit || 'lần'}</td>
                                                <td className="text-left text-[11px]">{item.description || 'Bình thường'}</td>
                                                <td className="text-left font-bold text-teal-800">{item.conclusion || item.value || 'Bình thường'}</td>
                                                <td>{item.notes}</td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* II. CHẨN ĐOÁN HÌNH ẢNH */}
                        <div>
                            <h3 className="font-bold text-[13px] mb-1">II. CHẨN ĐOÁN HÌNH ẢNH</h3>
                            <table className="a4-table w-full text-[12px] text-center">
                                <thead>
                                    <tr className="bg-slate-50 font-bold">
                                        <th className="w-[8%] text-center">STT</th>
                                        <th className="w-[35%] text-center">Tên chỉ định</th>
                                        <th className="w-[12%] text-center">Đơn vị</th>
                                        <th className="w-[20%] text-center">Mô tả</th>
                                        <th className="w-[15%] text-center">Kết luận</th>
                                        <th className="w-[10%] text-center">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const haItems = paraclinicalItems.filter((x: any) => x.type === 'HA');
                                        if (haItems.length === 0) {
                                            return (
                                                <tr className="h-7">
                                                    <td colSpan={6} className="text-center py-2 text-slate-500 italic">Không có dữ liệu chẩn đoán hình ảnh</td>
                                                </tr>
                                            );
                                        }
                                        return haItems.map((item: any, idx: number) => (
                                            <tr key={idx} className="h-7">
                                                <td className="text-center">{idx + 1}</td>
                                                <td className="text-left font-semibold">{item.service_name}</td>
                                                <td className="text-center">{item.unit || 'Lần'}</td>
                                                <td className="text-left text-[11px]">{item.description || 'Bình thường'}</td>
                                                <td className="text-left font-bold text-teal-800">{item.conclusion || item.value || 'Bình thường'}</td>
                                                <td>{item.notes}</td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* III. XÉT NGHIỆM (Page 3 part) */}
                        <div>
                            <h3 className="font-bold text-[13px] mb-1">III. XÉT NGHIỆM</h3>
                            <table className="a4-table w-full text-[12px] text-center">
                                <thead>
                                    <tr className="bg-slate-50 font-bold">
                                        <th className="w-[8%] text-center">STT</th>
                                        <th className="w-[42%] text-center">Tên chỉ định</th>
                                        <th className="w-[12%] text-center">Đơn vị</th>
                                        <th className="w-[18%] text-center">Khoảng tham chiếu</th>
                                        <th className="w-[12%] text-center">Kết quả</th>
                                        <th className="w-[8%] text-center">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        if (xnItemsPage3.length === 0) {
                                            return (
                                                <tr className="h-8">
                                                    <td colSpan={6} className="text-center py-2 text-slate-500 italic">Không có dữ liệu xét nghiệm</td>
                                                </tr>
                                            );
                                        }
                                        return xnItemsPage3.map((item: any, idx: number) => (
                                            <tr key={idx} className="h-8">
                                                <td className="text-center">{idx + 1}</td>
                                                <td className="text-left font-semibold">{item.service_name}</td>
                                                <td className="text-center">{item.unit || 'Lần'}</td>
                                                <td className="text-center">{item.reference_range || '-'}</td>
                                                <td className="text-center font-bold text-teal-800">{item.value}</td>
                                                <td>{item.notes}</td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">3/4</div>
                </div>

                {/* ==================== PAGE 4 ==================== */}
                <div className="a4-page">
                    {/* Continuing Xét nghiệm table */}
                    {xnItemsPage4.length > 0 && (
                        <table className="a4-table w-full text-[12px] text-center mb-4">
                            <thead>
                                <tr className="bg-slate-50 font-bold">
                                    <th className="w-[8%] text-center">STT</th>
                                    <th className="w-[42%] text-center">Tên chỉ định</th>
                                    <th className="w-[12%] text-center">Đơn vị</th>
                                    <th className="w-[18%] text-center">Khoảng tham chiếu</th>
                                    <th className="w-[12%] text-center">Kết quả</th>
                                    <th className="w-[8%] text-center">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {xnItemsPage4.map((item: any, idx: number) => (
                                    <tr key={idx} className="h-7.5">
                                        <td className="text-center">{idx + 6}</td>
                                        <td className="text-left font-semibold">{item.service_name}</td>
                                        <td className="text-center">{item.unit || 'Lần'}</td>
                                        <td className="text-center">{item.reference_range || '-'}</td>
                                        <td className="text-center font-bold text-teal-800">{item.value}</td>
                                        <td>{item.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    
                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-5 mb-2">V. KẾT LUẬN</h2>
                    
                    <div className="text-[13.5px] space-y-2 leading-relaxed">
                        <div>
                            <span className="font-bold">1. Phân loại sức khỏe: </span>
                            <span className="font-bold text-[14px] text-slate-900">Loại {conclusion.fitness_class || 'I'} - {formatFitnessClassName(conclusion.fitness_class || '1')}</span>
                        </div>
                        
                        <div>
                            <span className="font-bold">2. Các bệnh, tật (nếu có):</span>
                            <div className="pl-4 font-bold text-slate-800">{conclusion.diagnosis || 'Không phát hiện bất thường'}</div>
                        </div>
                        
                        <div>
                            <span className="font-bold">3. Quản lý bệnh: </span>
                            <span>{conclusion.quan_ly_benh || extra.quan_ly_benh || '3. Có bệnh lý được theo dõi'}</span>
                        </div>
                        
                        <div>
                            <span className="font-bold">4. Theo dõi tại: </span>
                            <span>{conclusion.theo_doi_tai || extra.theo_doi_tai || 'Bệnh viện đa khoa tỉnh Ninh Bình'}</span>
                        </div>
                        
                        <div>
                            <span className="font-bold">4. Chuyển tuyến: </span>
                            <span>{conclusion.chuyen_tuyen || extra.chuyen_tuyen || '1. Không chuyển tuyến'}</span>
                        </div>
                    </div>

                    {/* Bác sĩ kết luận + Chữ ký số xác nhận */}
                    <div className="flex justify-end mt-10 text-[13px]">
                        <div className="text-center w-72 flex flex-col items-center">
                            <span className="italic text-[12.5px] mb-0.5 font-normal">Ngày {getReportDate().day} tháng {getReportDate().month} năm {getReportDate().year}</span>
                            <strong className="block font-bold uppercase text-[13.5px] tracking-wider mb-2">BÁC SĨ KẾT LUẬN</strong>
                            
                            {document.signature_status === 'Signed' ? (
                                <div className="my-2 p-2 border border-green-600 rounded bg-green-50/50 text-[11px] font-bold text-green-700 leading-tight text-left w-full shadow-sm max-w-[240px] font-sans">
                                    <div className="flex items-center gap-1 mb-1 text-green-800">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span>SIGNED DIGITALLY</span>
                                    </div>
                                    By: {hospitalName || 'Phòng khám đa khoa vClinic'}<br/>
                                    Time: {document.updated_at ? new Date(document.updated_at).toLocaleString('vi-VN') : '2026-06-03'}
                                </div>
                            ) : (
                                <div className="h-16"></div>
                            )}
                            
                            <span className="font-bold text-[14px] mt-1 text-slate-900 block">{getConclusionDoctorName()}</span>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">4/4</div>
                </div>

            </div>
        </>,
        portalContainer
    );
};

export default PrintForm;

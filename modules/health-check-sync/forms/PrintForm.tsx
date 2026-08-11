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
import { healthCheckService } from '../../../services/healthCheckService';
import { PrintFormMau1 } from './PrintFormMau1';
import { PrintFormMau2 } from './PrintFormMau2';
import { PrintFormMau3 } from './PrintFormMau3';

const COMMON_ICD10 = [
    { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột' },
    { code: 'A15', name: 'Lao phổi' },
    { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insulin' },
    { code: 'E78', name: 'Rối loạn chuyển hóa lipoprotein và tình trạng tăng lipid máu khác' },
    { code: 'G40', name: 'Bệnh động kinh' },
    { code: 'H52', name: 'Rối loạn khúc xạ' },
    { code: 'H83', name: 'Các bệnh tai trong khác (bao gồm điếc do tiếng ồn)' },
    { code: 'I10', name: 'Bệnh tăng huyết áp vô căn (nguyên phát)' },
    { code: 'I20', name: 'Cơn đau thắt ngực' },
    { code: 'I21', name: 'Nhồi máu cơ tim cấp' },
    { code: 'J00', name: 'Viêm mũi họng cấp tính (cảm thường)' },
    { code: 'J02', name: 'Viêm họng cấp' },
    { code: 'J03', name: 'Viêm amidan cấp' },
    { code: 'J20', name: 'Viêm phế quan cấp' },
    { code: 'J30', name: 'Viêm mũi dị ứng và viêm mũi vận mạch' },
    { code: 'J45', name: 'Hen phế quản' },
    { code: 'J60', name: 'Bệnh bụi phổi silic' },
    { code: 'K29', name: 'Viêm dạ dày và tá tràng' },
    { code: 'K35', name: 'Viêm ruột thừa cấp' },
    { code: 'L23', name: 'Viêm da tiếp xúc dị ứng' },
    { code: 'M17', name: 'Thoái hóa khớp gối' },
    { code: 'M54', name: 'Đau lưng' },
    { code: 'N30', name: 'Viêm bàng quang' },
    { code: 'R50', name: 'Sốt chưa rõ nguyên nhân' },
    { code: 'R51', name: 'Đau đầu' }
];

interface PrintFormProps {
    document: any;
    onClose: () => void;
}

const PrintForm: React.FC<PrintFormProps> = ({ document: propDoc, onClose }) => {
    const { hospitalName, parentOrg, fetchBrandingSettings, brandingLoaded, logoUrl } = useSystemStore();
    const { user } = useSession();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(true);
    const [progress, setProgress] = useState(0);
    const [signatures, setSignatures] = useState<any[]>([]);
    const [htmlFallback, setHtmlFallback] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [doctorSignatures, setDoctorSignatures] = useState<Record<string, string>>({});
    const [referenceDataReady, setReferenceDataReady] = useState(false);
    const [signaturesReady, setSignaturesReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.allSettled([
            catalogService.getDoctors(),
            healthCheckService.getSettings()
        ]).then(([doctorsResult, settingsResult]) => {
            if (cancelled) return;
            setDoctors(doctorsResult.status === 'fulfilled' ? doctorsResult.value : []);
            setSettings(settingsResult.status === 'fulfilled' ? settingsResult.value : null);
            setReferenceDataReady(true);
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!propDoc || !referenceDataReady) return;
        let cancelled = false;
        setSignaturesReady(false);
        const clinicalDataObj = propDoc.clinical_data || propDoc.clinicalData || {};
        const clinicalExamObj = clinicalDataObj.clinical_exam || clinicalDataObj.clinicalExam || {};
        const conclusionObj = propDoc.conclusion_data || propDoc.conclusionData || {};
        const doctorCodes = new Set<string>();

        const addCode = (code: any) => {
            if (code !== null && code !== undefined && String(code).trim()) {
                doctorCodes.add(String(code).trim().toUpperCase());
            }
        };

        addCode(conclusionObj.doctor_code);
        addCode(conclusionObj.doctor_username);
        addCode(conclusionObj.conclusion_doctor);
        addCode(conclusionObj.doctor);

        [clinicalDataObj.specialty_metadata, clinicalExamObj.specialty_metadata]
            .filter(Boolean)
            .forEach((metadata: any) => {
                Object.values(metadata).forEach((meta: any) => {
                    addCode(meta?.doctorId);
                    addCode(meta?.doctorCode);
                    addCode(meta?.doctorUsername);
                });
            });

        Array.from(doctorCodes).forEach(rawCode => {
            const doctor = doctors.find((d: any) =>
                [d.id, d.hee_employee_id, d.code, d.username]
                    .some(value => String(value || '').trim().toUpperCase() === rawCode)
            );
            if (doctor) {
                addCode(doctor.code);
                addCode(doctor.username);
                addCode(doctor.id);
                addCode(doctor.hee_employee_id);
                addCode(doctor.name || doctor.hee_fullname);
            }
        });

        if (doctorCodes.size === 0) {
            setDoctorSignatures({});
            setSignaturesReady(true);
            return () => { cancelled = true; };
        }

        healthCheckService.getDoctorSignatures(Array.from(doctorCodes))
            .then(data => { if (!cancelled) setDoctorSignatures(data); })
            .catch(err => console.error("Lỗi lấy chữ ký bác sĩ trong PrintForm:", err))
            .finally(() => { if (!cancelled) setSignaturesReady(true); });

        return () => { cancelled = true; };
    }, [propDoc, doctors, referenceDataReady]);

    const [icd10Names, setIcd10Names] = useState<Record<string, string>>({});

    useEffect(() => {
        const clinicalDataObj = propDoc?.clinical_data || propDoc?.clinicalData || {};
        const extraObj = clinicalDataObj.extra || {};
        const codesToFetch: string[] = [];
        
        const processCodes = (codeStr: string) => {
            if (!codeStr) return;
            codeStr.split(',').map(s => s.trim()).filter(Boolean).forEach(code => {
                const upper = code.toUpperCase();
                const inLocal = COMMON_ICD10.some(item => item.code.toUpperCase() === upper);
                if (!inLocal && !icd10Names[upper] && !codesToFetch.includes(upper)) {
                    codesToFetch.push(upper);
                }
            });
        };

        const conclusionObj = propDoc?.conclusion_data || propDoc?.conclusionData || {};

        processCodes(extraObj.tsbt_ma_benh);
        processCodes(extraObj.tsbt_ma_benh_nghe_nghiep);
        processCodes(conclusionObj.diagnosis);

        if (codesToFetch.length === 0) return;

        codesToFetch.forEach(async (code) => {
            try {
                const results = await catalogService.searchIcd10(code);
                const match = results.find(r => String(r.code ?? '').toUpperCase() === code.toUpperCase());
                if (match) {
                    setIcd10Names(prev => ({
                        ...prev,
                        [code.toUpperCase()]: match.name
                    }));
                }
            } catch (err) {
                console.error("Lỗi lấy tên ICD-10 trong bản in:", err);
            }
        });
    }, [propDoc]);

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
    const pdfGenerationStarted = useRef(false);

    useEffect(() => {
        if (!referenceDataReady || !signaturesReady || pdfGenerationStarted.current) return;
        pdfGenerationStarted.current = true;
        activeRef.current = true;
        const timer = setTimeout(() => {
            if (activeRef.current) {
                generatePdf();
            }
        }, 250);

        return () => {
            activeRef.current = false;
            clearTimeout(timer);
        };
    }, [referenceDataReady, signaturesReady]);

    useEffect(() => {
        return () => {
            if (pdfUrl) {
                try {
                    URL.revokeObjectURL(pdfUrl);
                } catch (e) {
                    // Ignore revocation error on unmount
                }
            }
        };
    }, [pdfUrl]);

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
                // Poll for .a4-page elements to ensure DOM is fully mounted

                // Poll for .a4-page elements to ensure DOM is fully mounted
                let pages = containerRef.current?.querySelectorAll('.a4-page');
                let retries = 0;
                while ((!pages || pages.length === 0) && retries < 15) {
                    await new Promise(res => setTimeout(res, 100));
                    pages = containerRef.current?.querySelectorAll('.a4-page');
                    retries++;
                }

                console.log("Found pages:", pages ? pages.length : 0);
                if (!pages || pages.length === 0) {
                    throw new Error("Không tìm thấy trang A4 để tạo file PDF");
                }

                // Ensure all images inside containerRef are loaded
                if (containerRef.current) {
                    const imgs = Array.from(containerRef.current.querySelectorAll('img')) as HTMLImageElement[];
                    await Promise.all(imgs.map((img: HTMLImageElement) => {
                        const waitForLoad = img.complete
                            ? Promise.resolve()
                            : new Promise<void>(res => {
                                img.addEventListener('load', () => res(), { once: true });
                                img.addEventListener('error', () => res(), { once: true });
                            });
                        return waitForLoad.then(async () => {
                            if (typeof img.decode === 'function' && img.naturalWidth > 0) {
                                await img.decode().catch(() => undefined);
                            }
                        });
                    }));
                }

                const pdf = new jsPDF('p', 'mm', 'a4');
                const total = pages.length;

                for (let i = 0; i < total; i++) {
                    if (!activeRef.current) return null;
                    setProgress(Math.round(((i + 1) / total) * 100));
                    
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

    if (!propDoc) return null;

    const document = {
        ...propDoc,
        patient_name: propDoc.patient_name || propDoc.patientName || '',
        doc_no: propDoc.doc_no || propDoc.docNo || '',
        form_type: propDoc.form_type || propDoc.formType || '',
        cccd: propDoc.cccd || '',
        dob: propDoc.dob || '',
        gender: propDoc.gender || '',
        clinical_data: propDoc.clinical_data || propDoc.clinicalData || {},
        lab_data: propDoc.lab_data || propDoc.labData || {},
        conclusion_data: propDoc.conclusion_data || propDoc.conclusionData || {}
    };

    const getFormTitle = (type: string) => {
        const names: Record<string, string> = {
            '1': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (DÙNG CHO NGƯỜI DƯỚI 06 TUỔI)',
            '2': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (DÙNG CHO NGƯỜI TỪ ĐỦ 06 TUỔI ĐẾN DƯỚI 18 TUỔI)',
            '3': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (DÙNG CHO NGƯỜI TỪ ĐỦ 18 TUỔI TRỞ LÊN)',
            'driver': 'GIẤY KHÁM SỨC KHỎE CỦA NGƯỜI LÁI XE',
            'mau3-driver': 'GIẤY KHÁM SỨC KHỎE CỦA NGƯỜI LÁI XE',
            '4': 'GIẤY KHÁM SỨC KHỎE NHÂN VIÊN ĐƯỜNG SẮT',
            '5': 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ CHO THUYỀN VIÊN',
            '6': 'SỔ KHÁM SỨC KHỎE ĐỊNH KỲ CHO TRẺ 0 - 2 THÁNG',
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
        return names[type] || 'GIẤY KHÁM SỨC KHỎE ĐỊNH KỲ (DÙNG CHO NGƯỜI TỪ ĐỦ 18 TUỔI TRỞ LÊN)';
    };

    const clinical = document.clinical_data || {};
    const clinicalExam = clinical.clinical_exam || clinical.clinicalExam || {};
    const extra = clinical.extra || {};
    const lab = document.lab_data || {};
    const conclusion = document.conclusion_data || {};
    const paraclinicalItems = lab.paraclinical_items || lab.paraclinicalItems || [];

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

    const formatIcd10String = (codeStr: string) => {
        if (!codeStr) return '';
        const codes = codeStr.split(',').map(s => s.trim()).filter(Boolean);
        const formatted = codes.map(code => {
            const upper = code.toUpperCase();
            const localMatch = COMMON_ICD10.find(item => item.code.toUpperCase() === upper);
            if (localMatch) {
                return `${upper} - ${localMatch.name}`;
            }
            const apiMatch = icd10Names[upper];
            if (apiMatch) {
                return `${upper} - ${apiMatch}`;
            }
            return upper;
        });
        return formatted.join(', ');
    };

    const getConclusionDoctorName = () => {
        const conclusionMeta = clinical.specialty_metadata?.conclusion || clinical.specialtyMetadata?.conclusion;
        if (conclusionMeta?.doctorId) {
            const found = doctors.find(d => String(d.id || d.hee_employee_id) === String(conclusionMeta.doctorId));
            if (found) return found.name || found.hee_fullname;
        }
        if (conclusionMeta?.doctorName) {
            return conclusionMeta.doctorName;
        }
        if (conclusion.doctor_id) {
            const found = doctors.find(d => String(d.id || d.hee_employee_id) === String(conclusion.doctor_id));
            if (found) return found.name || found.hee_fullname;
        }
        return conclusion.doctor_name || '';
    };

    const hasSpecialtyData = (specialty: string) => {
        if (specialty === 'tuan_hoan') return !!(clinicalExam.tim_mach || clinicalExam.kq_tim_mach || clinicalExam.noi_khoa_tuan_hoan_pl);
        if (specialty === 'ho_hap') return !!(clinicalExam.ho_hap || clinicalExam.kq_ho_hap || clinicalExam.noi_khoa_ho_hap_pl);
        if (specialty === 'tieu_hoa') return !!(clinicalExam.noi_khoa_tieu_hoa || clinicalExam.kq_tieu_hoa || clinicalExam.noi_khoa_tieu_hoa_pl);
        if (specialty === 'than_tiet_nieu') return !!(clinicalExam.tiet_nieu_sinh_duc || clinicalExam.kq_tiet_nieu || clinicalExam.noi_khoa_than_tietnieu_pl);
        if (specialty === 'noi_tiet') return !!(clinicalExam.noi_tiet_dinh_duong_chuyen_hoa || clinicalExam.kq_noi_tiet || clinicalExam.noi_khoa_noi_tiet_pl);
        if (specialty === 'co_xuong_khop') return !!(clinicalExam.kq_co_xuong_khop_m5 || clinicalExam.kq_co_xuong_khop || clinicalExam.noi_khoa_co_xuong_khop_pl);
        if (specialty === 'than_kinh') return !!(clinicalExam.noi_khoa_than_kinh || clinicalExam.kq_than_kinh || clinicalExam.noi_khoa_than_kinh_pl);
        if (specialty === 'tam_than') return !!(clinicalExam.noi_khoa_tam_than || clinicalExam.kq_tam_than || clinicalExam.noi_khoa_tam_than_pl);
        if (specialty === 'ngoai_khoa') return !!(clinicalExam.external || clinicalExam.kq_ngoai_khoa || clinicalExam.kham_ngoai_khoa_pl);
        if (specialty === 'da_lieu') return !!(clinicalExam.dermatology || clinicalExam.kq_da_lieu || clinicalExam.kham_da_lieu_pl);
        if (specialty === 'san_phu_khoa') return !!(clinicalExam.gynecology || clinicalExam.kham_san_phu_khoa_pl);
        if (specialty === 'mat') return !!(clinicalExam.eye || clinicalExam.kham_mat_pl || clinicalExam.khong_kinh_mat_phai || clinicalExam.khong_kinh_mat_trai || clinicalExam.co_kinh_mat_phai || clinicalExam.co_kinh_mat_trai);
        if (specialty === 'tai_mui_hong') return !!(clinicalExam.ent || clinicalExam.kham_tai_mui_hong_pl || clinicalExam.tai_trai_noi_thuong || clinicalExam.tai_phai_noi_thuong);
        if (specialty === 'rang_ham_mat') return !!(clinicalExam.dental || clinicalExam.kham_rang_ham_mat_pl || clinicalExam.ham_tren || clinicalExam.ham_duoi);
        return false;
    };

    const getDoctor = (specialty: string) => {
        const hasData = hasSpecialtyData(specialty);
        if (!hasData) return '';

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
        if (!hasSpecialtyData('mat')) return '';
        const parts = [];
        if (clinicalExam.khong_kinh_mat_phai || clinicalExam.khong_kinh_mat_trai) {
            parts.push(`KK: MP ${clinicalExam.khong_kinh_mat_phai || '...'}/MT ${clinicalExam.khong_kinh_mat_trai || '...'}`);
        }
        if (clinicalExam.co_kinh_mat_phai || clinicalExam.co_kinh_mat_trai) {
            parts.push(`CK: MP ${clinicalExam.co_kinh_mat_phai || '...'}/MT ${clinicalExam.co_kinh_mat_trai || '...'}`);
        }
        const otherEyeDiseases = clinicalExam.benh_ve_mat || clinicalExam.benh_mat;
        if (otherEyeDiseases && otherEyeDiseases !== 'Không') {
            parts.push(`Bệnh: ${otherEyeDiseases}`);
        }
        
        if (!clinicalExam.khong_kinh_mat_phai && !clinicalExam.khong_kinh_mat_trai && !clinicalExam.co_kinh_mat_phai && !clinicalExam.co_kinh_mat_trai) {
            return clinicalExam.eye || '';
        }
        return parts.join('; ');
    };

    const formatEntExam = () => {
        if (!hasSpecialtyData('tai_mui_hong')) return '';
        const parts = [];
        if (clinicalExam.tai_trai_noi_thuong || clinicalExam.tai_trai_noi_tham) {
            parts.push(`Trái: ${clinicalExam.tai_trai_noi_thuong || '...'} m / nói thầm ${clinicalExam.tai_trai_noi_tham || '...'} m`);
        }
        if (clinicalExam.tai_phai_noi_thuong || clinicalExam.tai_phai_noi_tham) {
            parts.push(`Phải: ${clinicalExam.tai_phai_noi_thuong || '...'} m / nói thầm ${clinicalExam.tai_phai_noi_tham || '...'} m`);
        }
        const otherEntDiseases = clinicalExam.benh_tai_mui_hong;
        if (otherEntDiseases && otherEntDiseases !== 'Không') {
            parts.push(`Bệnh: ${otherEntDiseases}`);
        }
        
        if (!clinicalExam.tai_trai_noi_thuong && !clinicalExam.tai_trai_noi_tham && !clinicalExam.tai_phai_noi_thuong && !clinicalExam.tai_phai_noi_tham) {
            return clinicalExam.ent || '';
        }
        return parts.join('; ');
    };

    const formatDentalExam = () => {
        if (!hasSpecialtyData('rang_ham_mat')) return '';
        const parts = [];
        if (clinicalExam.ham_tren) {
            parts.push(`Trên: ${clinicalExam.ham_tren}`);
        }
        if (clinicalExam.ham_duoi) {
            parts.push(`Dưới: ${clinicalExam.ham_duoi}`);
        }
        const otherDentalDiseases = clinicalExam.benh_rang_ham_mat;
        if (otherDentalDiseases && otherDentalDiseases !== 'Không') {
            parts.push(`Bệnh: ${otherDentalDiseases}`);
        }
        
        if (!clinicalExam.ham_tren && !clinicalExam.ham_duoi) {
            return clinicalExam.dental || '';
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

    // Split Xét nghiệm items for Page 3 and subsequent pages dynamically
    const tdItems = paraclinicalItems.filter((x: any) => x.type === 'TD');
    const haItems = paraclinicalItems.filter((x: any) => x.type === 'HA');
    const xnItems = paraclinicalItems.filter((x: any) => x.type === 'XN');

    // Dynamically calculate how many XN items can fit on Page 3
    const availableHeight = 1122 - 75 - 40; // A4 height - margins - footer
    const titleHeight = 50; // IV. CẬN LÂM SÀNG + margins
    const tdHeight = tdItems.length > 0 ? (35 + 35 + tdItems.length * 30) : 0;
    const haHeight = haItems.length > 0 ? (35 + 35 + haItems.length * 30) : 0;
    const xnHeaderHeight = 35 + 35; // III. XÉT NGHIỆM title + table header
    
    // Calculate remaining height, leaving a small buffer of 20px
    const remainingHeightForXn = availableHeight - titleHeight - tdHeight - haHeight - xnHeaderHeight - 20;
    const CONCLUSION_HEIGHT = 380;
    const XN_ROW_HEIGHT = 30;
    
    let page3XnLimit = Math.max(0, Math.floor(remainingHeightForXn / XN_ROW_HEIGHT));
    let conclusionOnPage3 = false;
    
    // Check if we can fit ALL xnItems AND the conclusion on Page 3
    if (xnItems.length <= page3XnLimit) {
        const actualXnHeight = Math.max(1, xnItems.length) * XN_ROW_HEIGHT; // Need at least 1 row for "Không có dữ liệu"
        if (remainingHeightForXn - actualXnHeight >= CONCLUSION_HEIGHT) {
            conclusionOnPage3 = true;
        }
    }

    const xnItemsPage3 = xnItems.slice(0, page3XnLimit);
    const remainingXnItems = xnItems.slice(page3XnLimit);

    const dynamicPages: { type: 'table-only' | 'table-and-conclusion' | 'conclusion-only'; items: any[] }[] = [];
    
    if (remainingXnItems.length === 0) {
        if (!conclusionOnPage3) {
            dynamicPages.push({ type: 'conclusion-only', items: [] });
        }
    } else {
        // Page 4 onwards: table-only or table-and-conclusion
        const MAX_TABLE_ONLY_ITEMS = 28;
        const MAX_TABLE_AND_CONCLUSION_ITEMS = 12;

        let tempItems = [...remainingXnItems];
        while (tempItems.length > 0) {
            if (tempItems.length <= MAX_TABLE_AND_CONCLUSION_ITEMS) {
                dynamicPages.push({ type: 'table-and-conclusion', items: tempItems });
                tempItems = [];
            } else {
                dynamicPages.push({ type: 'table-only', items: tempItems.slice(0, MAX_TABLE_ONLY_ITEMS) });
                tempItems = tempItems.slice(MAX_TABLE_ONLY_ITEMS);
                
                // Nếu trang cuối cùng đầy (table-only) và không còn mục nào, vẫn phải thêm trang kết luận
                if (tempItems.length === 0) {
                    dynamicPages.push({ type: 'conclusion-only', items: [] });
                }
            }
        }
    }

    const totalPages = document.form_type === '1' ? 3 : (3 + dynamicPages.length);

    const renderConclusion = () => (
        <>
            <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-5 mb-2">V. KẾT LUẬN</h2>
            
            <div className="text-[13.5px] space-y-2 leading-relaxed">
                <div>
                    <span className="font-bold">1. Phân loại sức khỏe: </span>
                    <span className="font-bold text-[14px] text-slate-900">Loại {conclusion.fitness_class || 'I'} - {formatFitnessClassName(conclusion.fitness_class || '1')}</span>
                </div>
                
                <div>
                    <span className="font-bold">2. Các bệnh, tật (nếu có):</span>
                    <div className="pl-4 font-bold text-slate-800">{conclusion.diagnosis ? formatIcd10String(conclusion.diagnosis) : 'Không phát hiện bất thường'}</div>
                </div>
                
                <div>
                    <span className="font-bold">3. Quản lý bệnh: </span>
                    <span>{conclusion.quan_ly_benh || extra.quan_ly_benh || '3. Có bệnh lý được theo dõi'}</span>
                </div>
                
                <div>
                    <span className="font-bold">4. Theo dõi tại: </span>
                    <span>{conclusion.theo_doi_tai || extra.theo_doi_tai || hospitalName || 'Bệnh viện đa khoa tỉnh Ninh Bình'}</span>
                </div>
                
                <div>
                    <span className="font-bold">5. Chuyển tuyến: </span>
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
        </>
    );



    return createPortal(
        <>
            {/* 1. Loader screen when generating PDF */}
            {isGenerating && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex justify-center items-center">
                    <div className="bg-teal-900 rounded-2xl border border-teal-800/60 shadow-2xl p-8 flex flex-col items-center gap-5 w-80">
                        
                        {/* Spinner */}
                        <div className="w-10 h-10 rounded-full border-[3px] border-teal-800 border-t-teal-300 animate-spin" />

                        {/* Text */}
                        <div className="text-center space-y-1">
                            <p className="text-white font-semibold text-sm">Đang tạo bản in PDF</p>
                            <p className="text-teal-200/70 text-xs">
                                {progress < 50 ? 'Đang xử lý nội dung...' : progress < 90 ? 'Đang kết xuất PDF...' : 'Sắp xong...'}
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full">
                            <div className="w-full h-1.5 bg-teal-950 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-400 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-end mt-1.5">
                                <span className="text-[11px] text-teal-300/80 font-mono">{progress}%</span>
                            </div>
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
                        padding: 10mm 10mm 10mm 15mm;
                        background: white;
                        color: black;
                        position: relative;
                        box-sizing: border-box !important;
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    }
                    .a4-page * {
                        box-sizing: border-box !important;
                    }
                    .a4-page-content {
                        font-family: "Times New Roman", Times, serif !important;
                        line-height: 1.4;
                        font-size: 13.5px;
                        color: black;
                    }
                    .a4-table {
                        border-collapse: separate;
                        border-spacing: 0;
                        width: 100%;
                        border-left: 1px solid black !important;
                        border-top: 1px solid black !important;
                    }
                    .a4-table.border-t-0 {
                        border-top: 0 !important;
                    }
                    .a4-table th, .a4-table td {
                        border-right: 1px solid black !important;
                        border-bottom: 1px solid black !important;
                        border-left: 0 !important;
                        border-top: 0 !important;
                        padding: 3px 5px;
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
                        @page {
                            size: A4;
                            margin: 0 !important;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
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
                            padding: 10mm 10mm 10mm 15mm !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            position: relative !important;
                            background: white !important;
                        }
                    }
                `}</style>
                
                {document.form_type === '1' ? (
                    <PrintFormMau1
                        document={document}
                        hospitalName={hospitalName}
                        logoUrl={logoUrl}
                        getReportDate={getReportDate}
                        getConclusionDoctorName={getConclusionDoctorName}
                        maCskcb={settings?.ma_cskcb || settings?.ma_gtin_cskcb}
                        doctorSignatures={doctorSignatures}
                    />
                ) : document.form_type === '2' ? (
                    <PrintFormMau2
                        document={document}
                        hospitalName={hospitalName}
                        logoUrl={logoUrl}
                        getReportDate={getReportDate}
                        getConclusionDoctorName={getConclusionDoctorName}
                        doctors={doctors}
                        icd10Names={icd10Names}
                        COMMON_ICD10={COMMON_ICD10}
                        maCskcb={settings?.ma_cskcb || settings?.ma_gtin_cskcb}
                        doctorSignatures={doctorSignatures}
                    />
                ) : (
                    <PrintFormMau3
                        document={document}
                        hospitalName={hospitalName}
                        logoUrl={logoUrl}
                        getReportDate={getReportDate}
                        getConclusionDoctorName={getConclusionDoctorName}
                        doctors={doctors}
                        icd10Names={icd10Names}
                        COMMON_ICD10={COMMON_ICD10}
                        maCskcb={settings?.ma_cskcb || settings?.ma_gtin_cskcb}
                        doctorSignatures={doctorSignatures}
                    />
                )}
                {false && (
                    <>
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
                        {/* Mẫu 1 (trẻ em) không có mục Nghề nghiệp / Nơi công tác / Lịch sử nghề */}
                        {document.form_type !== '1' && (
                            <>
                        <div>
                            <span className="font-bold">7. Nghề nghiệp: </span>
                            <span>{extra.ten_nghe_nghiep || extra.ma_nghe_nghiep || clinical.ma_nghe_nghiep || '................................'}</span>
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
                            </>
                        )}

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
                                    <tr className="align-top h-10">
                                        <td>
                                            a) {extra.tsbt_ma_benh ? formatIcd10String(extra.tsbt_ma_benh) : ''}
                                        </td>
                                        <td className="text-center font-bold">
                                            {extra.tsbt_nam_phat_hien_benh}
                                        </td>
                                        <td>
                                            a) {extra.tsbt_ma_benh_nghe_nghiep ? formatIcd10String(extra.tsbt_ma_benh_nghe_nghiep) : ''}
                                        </td>
                                        <td className="text-center font-bold">
                                            {extra.tsbt_nam_phat_hien_benh_nghe_nghiep}
                                        </td>
                                    </tr>
                                    <tr className="align-top h-6">
                                        <td>b)</td>
                                        <td></td>
                                        <td>b)</td>
                                        <td></td>
                                    </tr>
                                    <tr className="align-top h-6">
                                        <td>c)</td>
                                        <td></td>
                                        <td>c)</td>
                                        <td></td>
                                    </tr>
                                    <tr className="align-top h-6">
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

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">1/{totalPages}</div>
                </div>

                {/* ==================== PAGE 2 ==================== */}
                <div className="a4-page">
                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mb-3">I. TIỀN SỬ BỆNH, TẬT</h2>
                    
                    <div className="text-[13.5px] space-y-2 leading-relaxed">
                        <h3 className="font-bold">1. Tiền sử bệnh, tật của bản thân và gia đình:</h3>
                        <div className="pl-4 space-y-1">
                            <div><span className="font-bold">Gia đình:</span> {extra.tsgd_mac_benh === '1' ? 'Mắc bệnh' : 'Không mắc bệnh'} {extra.tsgd_ma_benh ? `(${extra.tsgd_ma_benh})` : ''}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                            <div><span className="font-bold">Bản thân:</span> {extra.tsbt_ma_benh ? `Mắc bệnh ${formatIcd10String(extra.tsbt_ma_benh)}` : 'Không phát hiện bất thường'} {extra.tsbt_nam_phat_hien_benh ? `(Phát hiện năm: ${extra.tsbt_nam_phat_hien_benh})` : ''}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                            <div><span className="font-bold">Bệnh nghề nghiệp:</span> {extra.tsbt_ma_benh_nghe_nghiep ? `Mắc bệnh ${formatIcd10String(extra.tsbt_ma_benh_nghe_nghiep)}` : 'Không phát hiện bất thường'} {extra.tsbt_nam_phat_hien_benh_nghe_nghiep ? `(Phát hiện năm: ${extra.tsbt_nam_phat_hien_benh_nghe_nghiep})` : ''}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                            <div><span className="font-bold">Đang điều trị:</span> {extra.ten_thuoc ? `Có - Thuốc đang dùng: ${extra.ten_thuoc}` : 'Không - Thuốc đang dùng: Không'}</div>
                            <div className="border-t border-dotted border-black my-1"></div>
                        </div>
                    </div>
                    
                    {/* Mẫu 1 (trẻ em 6-18 tuổi) không có mục Tiền sử sản phụ khoa */}
                    {document.form_type !== '1' && isNu && (
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
                    )}

                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-5 mb-3">III. KHÁM LÂM SÀNG</h2>
                    
                    <table className="a4-table w-full text-[13px]">
                        <thead>
                            <tr className="font-bold bg-slate-50 text-center">
                                <th className="w-[70%] text-center">Nội dung khám</th>
                                <th className="w-[30%] text-center">Họ tên & Chữ ký BS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ===== MẪU 1: Trẻ 6-18 tuổi – dùng field nhi_* ===== */}
                            {document.form_type === '1' ? (
                                <>
                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-slate-100/50">1. Khám nhi khoa</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">a) Tuần hoàn: </span><span className="text-slate-800">{clinicalExam.nhi_tuan_hoan || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('tuan_hoan')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">b) Hô hấp: </span><span className="text-slate-800">{clinicalExam.nhi_ho_hap || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('ho_hap')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">c) Tiêu hóa: </span><span className="text-slate-800">{clinicalExam.nhi_tieu_hoa || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('tieu_hoa')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">d) Thận - Tiết niệu: </span><span className="text-slate-800">{clinicalExam.nhi_tiet_nieu || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('than_tiet_nieu')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">đ) Thần kinh: </span><span className="text-slate-800">{clinicalExam.nhi_than_kinh || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('than_kinh')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">e) Tâm thần: </span><span className="text-slate-800">{clinicalExam.nhi_tam_than || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('tam_than')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">g) Lâm sàng khác: </span><span className="text-slate-800">{clinicalExam.nhi_khac || ''}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700"></td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">2. Mắt: </span><span className="text-slate-800">{formatEyeExam()}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('mat')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">3. Tai - Mũi - Họng: </span><span className="text-slate-800">{formatEntExam()}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('tai_mui_hong')}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-bold">4. Răng - Hàm - Mặt: </span><span className="text-slate-800">{formatDentalExam()}</span></td>
                                    <td className="text-center align-middle font-medium text-slate-700">{getDoctor('rang_ham_mat')}</td>
                                </tr>
                                </>
                            ) : (
                                <>
                            {/* ===== MẪU 2/3/4/5: Người lớn – dùng field kq_* ===== */}
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-slate-100/50">1. Nội khoa</td>
                            </tr>
                             <tr>
                                <td>
                                    <span className="font-bold">a) Tuần hoàn: </span>
                                    <span className="text-slate-800">{clinicalExam.tim_mach || clinicalExam.kq_tim_mach || ''}</span>
                                    {clinicalExam.noi_khoa_tuan_hoan_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_tuan_hoan_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tuan_hoan')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">b) Hô hấp: </span>
                                    <span className="text-slate-800">{clinicalExam.ho_hap || clinicalExam.kq_ho_hap || ''}</span>
                                    {clinicalExam.noi_khoa_ho_hap_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_ho_hap_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('ho_hap')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">c) Tiêu hóa: </span>
                                    <span className="text-slate-800">{clinicalExam.noi_khoa_tieu_hoa || clinicalExam.kq_tieu_hoa || ''}</span>
                                    {clinicalExam.noi_khoa_tieu_hoa_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_tieu_hoa_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tieu_hoa')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">d) Thận-Tiết niệu: </span>
                                    <span className="text-slate-800">{clinicalExam.tiet_nieu_sinh_duc || clinicalExam.kq_tiet_nieu || ''}</span>
                                    {clinicalExam.noi_khoa_than_tietnieu_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_than_tietnieu_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('than_tiet_nieu')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">đ) Nội tiết: </span>
                                    <span className="text-slate-800">{clinicalExam.noi_tiet_dinh_duong_chuyen_hoa || clinicalExam.kq_noi_tiet || ''}</span>
                                    {clinicalExam.noi_khoa_noi_tiet_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_noi_tiet_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('noi_tiet')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">e) Cơ-xương-khớp: </span>
                                    <span className="text-slate-800">{clinicalExam.kq_co_xuong_khop_m5 || clinicalExam.kq_co_xuong_khop || ''}</span>
                                    {clinicalExam.noi_khoa_co_xuong_khop_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_co_xuong_khop_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('co_xuong_khop')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">g) Thần kinh: </span>
                                    <span className="text-slate-800">{clinicalExam.noi_khoa_than_kinh || clinicalExam.kq_than_kinh || ''}</span>
                                    {clinicalExam.noi_khoa_than_kinh_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_than_kinh_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('than_kinh')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">h) Tâm thần: </span>
                                    <span className="text-slate-800">{clinicalExam.noi_khoa_tam_than || clinicalExam.kq_tam_than || ''}</span>
                                    {clinicalExam.noi_khoa_tam_than_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.noi_khoa_tam_than_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tam_than')}
                                </td>
                            </tr>
                            <tr className="font-bold bg-slate-100/50 text-center">
                                <td colSpan={2}>2. Ngoại khoa, Da liễu</td>
                            </tr>
                            <tr>
                                <td className="w-[70%]">
                                    <span className="font-bold">- Ngoại khoa: </span>
                                    <span className="text-slate-800">{clinicalExam.external || clinicalExam.kq_ngoai_khoa || ''}</span>
                                    {clinicalExam.kham_ngoai_khoa_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_ngoai_khoa_pl)})</span>
                                    )}
                                </td>
                                <td className="w-[30%] text-center align-middle font-medium text-slate-700">
                                    {getDoctor('ngoai_khoa')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">- Da liễu: </span>
                                    <span className="text-slate-800">{clinicalExam.dermatology || clinicalExam.kq_da_lieu || ''}</span>
                                    {clinicalExam.kham_da_lieu_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_da_lieu_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('da_lieu')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">3. Sản phụ khoa: </span>
                                    <span className="text-slate-800">{clinicalExam.gynecology || ''}</span>
                                    {clinicalExam.kham_san_phu_khoa_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_san_phu_khoa_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('san_phu_khoa')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">4. Mắt: </span>
                                    <span className="text-slate-800">{formatEyeExam()}</span>
                                    {clinicalExam.kham_mat_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_mat_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('mat')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">5. Tai - Mũi - Họng: </span>
                                    <span className="text-slate-800">{formatEntExam()}</span>
                                    {clinicalExam.kham_tai_mui_hong_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_tai_mui_hong_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('tai_mui_hong')}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">6. Răng - Hàm - Mặt: </span>
                                    <span className="text-slate-800">{formatDentalExam()}</span>
                                    {clinicalExam.kham_rang_ham_mat_pl && (
                                        <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_rang_ham_mat_pl)})</span>
                                    )}
                                </td>
                                <td className="text-center align-middle font-medium text-slate-700">
                                    {getDoctor('rang_ham_mat')}
                                </td>
                            </tr>
                            {document.form_type !== '1' && (
                                <tr>
                                    <td>
                                        <span className="font-bold">7. Da liễu: </span>
                                        <span className="text-slate-800">{clinicalExam.dermatology || clinicalExam.kham_da_lieu || ''}</span>
                                        {clinicalExam.kham_da_lieu_pl && (
                                            <span className="font-bold text-[11.5px] text-teal-800 ml-2">(PL: {formatPlText(clinicalExam.kham_da_lieu_pl)})</span>
                                        )}
                                    </td>
                                    <td className="text-center align-middle font-medium text-slate-700">
                                        {getDoctor('da_lieu')}
                                    </td>
                                </tr>
                            )}
                                </>
                            )}
                        </tbody>
                    </table>

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">2/{totalPages}</div>
                </div>

                {/* ==================== PAGE 3 ==================== */}
                <div className="a4-page">
                    <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-5 mb-2">IV. CẬN LÂM SÀNG</h2>
                    
                    <div className="space-y-3.5">
                        {/* I. THĂM DÒ CHỨC NĂNG */}
                        {(() => {
                            const tdItems = paraclinicalItems.filter((x: any) => x.type === 'TD');
                            return tdItems.length > 0 && (
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
                                            {tdItems.map((item: any, idx: number) => (
                                                <tr key={idx} className="h-7">
                                                    <td className="text-center">{idx + 1}</td>
                                                    <td className="text-left font-semibold">{item.service_name}</td>
                                                    <td className="text-center">{item.unit || 'lần'}</td>
                                                    <td className="text-left text-[11px]">{item.description || 'Bình thường'}</td>
                                                    <td className="text-left font-bold text-teal-800">{item.conclusion || item.value || 'Bình thường'}</td>
                                                    <td>{item.notes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}

                        {/* II. CHẨN ĐOÁN HÌNH ẢNH */}
                        {(() => {
                            const haItems = paraclinicalItems.filter((x: any) => x.type === 'HA');
                            return haItems.length > 0 && (
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
                                            {haItems.map((item: any, idx: number) => (
                                                <tr key={idx} className="h-7">
                                                    <td className="text-center">{idx + 1}</td>
                                                    <td className="text-left font-semibold">{item.service_name}</td>
                                                    <td className="text-center">{item.unit || 'Lần'}</td>
                                                    <td className="text-left text-[11px]">{item.description || 'Bình thường'}</td>
                                                    <td className="text-left font-bold text-teal-800">{item.conclusion || item.value || 'Bình thường'}</td>
                                                    <td>{item.notes}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}

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
                    
                    {conclusionOnPage3 && (
                        <div className="pt-8">
                            {renderConclusion()}
                        </div>
                    )}

                    <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">3/{totalPages}</div>
                </div>

                {/* ==================== DYNAMIC PAGES ==================== */}
                {dynamicPages.map((page, pageIdx) => {
                    const pageNumber = 4 + pageIdx;
                    let startStt = xnItemsPage3.length + 1;
                    for (let i = 0; i < pageIdx; i++) {
                        startStt += dynamicPages[i].items.length;
                    }
                    
                    return (
                        <div key={pageIdx} className="a4-page">
                            {/* Continuing Xét nghiệm table */}
                            {page.items.length > 0 && (
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
                                        {page.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="h-7.5">
                                                <td className="text-center">{startStt + idx}</td>
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
                            
                            {/* Conclusion and signature block */}
                            {(page.type === 'table-and-conclusion' || page.type === 'conclusion-only') && (
                                <div className={page.type === 'conclusion-only' ? '' : 'pt-8'}>
                                    {renderConclusion()}
                                </div>
                            )}
                            
                            <div className="absolute bottom-4 right-8 text-[11px] text-slate-500 font-sans">{pageNumber}/{totalPages}</div>
                        </div>
                    );
                })}
                    </>
                )}
                </div>
        </>,
        portalContainer
    );
};

export default PrintForm;

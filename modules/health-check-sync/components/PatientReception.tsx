import React, { useState, useEffect, useRef, useMemo } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { SearchIcon, UserGroupIcon, RefreshIcon, CheckCircleIcon, PrinterIcon } from '../../../components/Icons';
import { toast } from 'sonner';
import { HealthCheckSettings } from '../models/HealthCheckSettings';
import Combobox from '../../../components/ui/Combobox';
import { useCatalogs } from '../../../contexts/CatalogContext';
import { CatalogItem } from '../../../services/catalogService';
import { qzPrinterService } from '../../../services/qzPrinterService';

interface EmployeeSearchResult {
    id: number;
    contract_id: number;
    contract_name: string;
    company_id: string;
    company_name: string;
    contract_code: string;
    name: string;
    dob: string;
    gender: string;
    card_id: string;
    phone: string;
    address: string;
    doc_no: string | null;
    status: string | null;
    note: string | null;
}

interface ClinicRoom {
    id: string;
    name: string;
}

const PatientReception: React.FC = () => {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const s = await HealthCheckSettings.loadFromServer();
                setSettings(s);
            } catch (err) {
                console.error("Failed to load settings in PatientReception:", err);
            }
        };
        loadSettings();
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeSearchResult[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
    const [rooms, setRooms] = useState<ClinicRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<string>('');
    const [autoReset, setAutoReset] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        surname: '',
        midname: '',
        firstname: '',
        dob: '',
        gender: '',
        cardId: '',
        phone: '',
        address: '',
        ethnic: '',
        provId: '',
        distId: '',
        villId: '',
        cardIdDate: '',
        cardIdPlace: '',
        guardianName: '',
        guardianCccd: ''
    });

    const { provinces, ethnicities, occupations, nations, getWards } = useCatalogs();
    const [editWards, setEditWards] = useState<CatalogItem[]>([]);

    const commonColumns = [
        { key: 'code', label: 'Mã', width: '25%' },
        { key: 'name', label: 'Tên', width: '75%' }
    ];

    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateAge = (dobString: string) => {
        if (!dobString) return 'N/A';
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return 'N/A';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? `${age} tuổi` : '0 tuổi';
    };

    const displayEthnic = useMemo(() => {
        if (!selectedEmployee?.ethnic) return 'Kinh (01)';
        const found = ethnicities.find(e => String(e.id) === String(selectedEmployee.ethnic) || String(e.code) === String(selectedEmployee.ethnic));
        return found ? `${found.code} - ${found.name}` : selectedEmployee.ethnic;
    }, [selectedEmployee?.ethnic, ethnicities]);

    const displayLocation = useMemo(() => {
        if (!selectedEmployee) return 'Chưa có / Chưa có';
        
        let provStr = selectedEmployee.prov_id || 'Chưa có';
        if (selectedEmployee.prov_name) {
            provStr = `${selectedEmployee.prov_id} - ${selectedEmployee.prov_name}`;
        } else {
            const foundProv = provinces.find(p => String(p.id) === String(selectedEmployee.prov_id));
            if (foundProv) provStr = `${foundProv.code} - ${foundProv.name}`;
        }
        
        let villStr = selectedEmployee.vill_id || 'Chưa có';
        if (selectedEmployee.vill_name) {
            villStr = `${selectedEmployee.vill_id} - ${selectedEmployee.vill_name}`;
        }
        
        return `${provStr} / ${villStr}`;
    }, [selectedEmployee, provinces]);

    const [startDate, setStartDate] = useState(getTodayString());
    const [endDate, setEndDate] = useState(getTodayString());

    // Reception results
    const [receptionInfo, setReceptionInfo] = useState<{
        docNo: string;
        patientNo: string;
        services: any[];
    } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    // Load rooms list on mount
    useEffect(() => {
        const loadRooms = async () => {
            setIsLoadingRooms(true);
            try {
                const data = await healthCheckService.getReceptionRooms();
                setRooms(data);
                if (data.length > 0) {
                    const vitalRoom = data.find(r => 
                        r.name.toLowerCase().includes('sinh hiệu') || 
                        r.name.toLowerCase().includes('thể lực') ||
                        r.name.toLowerCase().includes('tiếp nhận')
                    );
                    setSelectedRoomId(vitalRoom ? vitalRoom.id : data[0].id);
                }
            } catch (err) {
                console.error("Failed to load rooms:", err);
                setRooms([
                    { id: '1', name: 'Phòng tiếp đón chung' },
                    { id: '2', name: 'Phòng khám Thể lực & Đo sinh hiệu' },
                    { id: '3', name: 'Phòng khám Nội khoa' }
                ]);
                setSelectedRoomId('2');
            } finally {
                setIsLoadingRooms(false);
            }
        };
        loadRooms();

        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Load contracts whenever date range changes
    useEffect(() => {
        const loadContracts = async () => {
            try {
                const data = await healthCheckService.getContracts({ startDate, endDate });
                setContracts(data.filter((c: any) => c.status === 'O'));
            } catch (err) {
                console.error("Failed to load contracts:", err);
            }
        };
        loadContracts();
    }, [startDate, endDate]);

    useEffect(() => {
        if (editForm.provId) {
            getWards(editForm.provId).then(data => {
                setEditWards(data.map((w: any) => ({ id: String(w.id || ''), code: String(w.code || w.id || ''), name: w.name })));
            }).catch(() => setEditWards([]));
        } else {
            setEditWards([]);
        }
    }, [editForm.provId, getWards]);

    // Reactive search and load patients in selected contract
    useEffect(() => {
        const fetchPatients = async () => {
            const term = searchQuery.trim();
            if (!term && !selectedContractId) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const data = await healthCheckService.searchEmployeeByCard(term, selectedContractId);
                setSearchResults(data);

                // Auto-select patient on exact search match (like scanned CCCD)
                if (data.length === 1 && term !== '') {
                    selectEmployee(data[0]);
                }
            } catch (error: any) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            fetchPatients();
        }, searchQuery.trim() ? 250 : 0);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, selectedContractId]);

    const filteredSearchResults = useMemo(() => {
        return searchResults.filter(emp => {
            if (statusFilter === 'ALL') return true;
            if (statusFilter === 'R') return emp.status === 'R';
            if (statusFilter === 'W') return emp.status !== 'R'; // W or null means waiting
            return true;
        });
    }, [searchResults, statusFilter]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Just blur input slightly or let useEffect do the query immediately
        }
    };

    const startEditing = () => {
        if (!selectedEmployee) return;
        setEditForm({
            surname: selectedEmployee.surname || '',
            midname: selectedEmployee.midname || '',
            firstname: selectedEmployee.firstname || '',
            dob: selectedEmployee.dob || '',
            gender: selectedEmployee.gender || 'M',
            cardId: selectedEmployee.card_id || '',
            phone: selectedEmployee.phone || '',
            address: selectedEmployee.address || '',
            ethnic: selectedEmployee.ethnic || '01',
            provId: selectedEmployee.prov_id || '',
            distId: selectedEmployee.dist_id || '',
            villId: selectedEmployee.vill_id || '',
            cardIdDate: selectedEmployee.card_id_date || '',
            cardIdPlace: selectedEmployee.card_id_place || '',
            guardianName: selectedEmployee.guardian_name || '',
            guardianCccd: selectedEmployee.guardian_cccd || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedEmployee) return;
        try {
            if (!editForm.surname.trim() && !editForm.firstname.trim()) {
                toast.error("Vui lòng nhập Họ & Tên");
                return;
            }
            if (editForm.cardId && !/^\d{12}$/.test(editForm.cardId)) {
                toast.error("CCCD phải có độ dài chính xác 12 chữ số");
                return;
            }
            if (!editForm.phone.trim()) {
                toast.error("Vui lòng nhập số điện thoại");
                return;
            }
            if (editForm.phone && !/^\d{10}$/.test(editForm.phone)) {
                toast.error("Số điện thoại phải có độ dài chính xác 10 chữ số");
                return;
            }

            const res = await healthCheckService.updateEmployee(selectedEmployee.id, editForm);
            if (res.success) {
                toast.success(res.message || "Cập nhật thành công!");
                const selectedProv = provinces.find(p => String(p.id) === String(editForm.provId));
                const selectedVill = editWards.find(v => String(v.id) === String(editForm.villId));
                const updatedEmp = {
                    ...selectedEmployee,
                    surname: editForm.surname,
                    midname: editForm.midname,
                    firstname: editForm.firstname,
                    name: `${editForm.surname} ${editForm.midname} ${editForm.firstname}`.replace(/\s+/g, ' ').trim().toUpperCase(),
                    dob: editForm.dob,
                    gender: editForm.gender,
                    card_id: editForm.cardId,
                    phone: editForm.phone,
                    address: editForm.address,
                    ethnic: editForm.ethnic,
                    prov_id: editForm.provId,
                    dist_id: editForm.distId,
                    vill_id: editForm.villId,
                    prov_name: selectedProv ? selectedProv.name : '',
                    vill_name: selectedVill ? selectedVill.name : '',
                    card_id_date: editForm.cardIdDate,
                    card_id_place: editForm.cardIdPlace,
                    guardian_name: editForm.guardianName,
                    guardian_cccd: editForm.guardianCccd
                };
                setSelectedEmployee(updatedEmp);
                setSearchResults(prev => prev.map(emp => emp.id === selectedEmployee.id ? updatedEmp : emp));
                setIsEditModalOpen(false);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || "Không thể cập nhật thông tin");
        }
    };

    const selectEmployee = (emp: EmployeeSearchResult) => {
        setSelectedEmployee(emp);
        setReceptionInfo(null);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleReceive = async () => {
        if (!selectedEmployee) return;

        setIsSubmitting(true);
        const toastId = toast.loading("Đang thực hiện đăng ký tiếp đón trên HIS...");
        try {
            const res = await healthCheckService.receiveContractEmployee(
                selectedEmployee.id, 
                selectedRoomId ? parseInt(selectedRoomId, 10) : undefined
            );

            toast.dismiss(toastId);
            if (res.success) {
                toast.success(res.message || "Tiếp nhận nhân viên thành công!");
                setReceptionInfo({
                    docNo: res.docNo,
                    patientNo: res.patientNo,
                    services: res.services
                });

                setSelectedEmployee(prev => prev ? { ...prev, doc_no: res.docNo, status: 'R' } : null);
                setSearchResults(prevList => 
                    prevList.map(item => 
                        item.id === selectedEmployee.id 
                            ? { ...item, doc_no: res.docNo, status: 'R' } 
                            : item
                    )
                );
                
                setTimeout(() => {
                    printReceptionSlip(selectedEmployee, res.docNo, res.services);
                    
                    // Auto-reset workflow for next scan if enabled
                    if (autoReset) {
                        setSelectedEmployee(null);
                        setReceptionInfo(null);
                        setSearchQuery('');
                        setTimeout(() => {
                            if (inputRef.current) {
                                inputRef.current.focus();
                            }
                        }, 100);
                    }
                }, 300);
            } else {
                toast.error(res.message || "Tiếp nhận thất bại!");
            }
        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error(error.message || "Lỗi tiếp nhận hệ thống");
        } finally {
            setIsSubmitting(false);
        }
    };

    const DEFAULT_RECEPTION_TEMPLATE = `<div class="header">
    <div class="hospital-name">BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH</div>
    <div class="title">PHIẾU TIẾP ĐÓN</div>
</div>

<div class="divider"></div>

<table class="info-table">
    <tr>
        <td class="info-label">Số hồ sơ:</td>
        <td class="info-value" style="font-weight: bold; font-size: 15px;">{{docNo}}</td>
    </tr>
    <tr>
        <td class="info-label">Họ tên:</td>
        <td class="info-value" style="font-weight: bold; font-size: 15px;">{{name}}</td>
    </tr>
    <tr>
        <td class="info-label">Năm sinh:</td>
        <td class="info-value">{{dob}}</td>
    </tr>
    <tr>
        <td class="info-label">CCCD:</td>
        <td class="info-value">{{cardId}}</td>
    </tr>
    <tr>
        <td class="info-label">Địa chỉ:</td>
        <td class="info-value">{{address}}</td>
    </tr>
</table>

<div class="divider"></div>

<div class="barcode-section">
    <div class="barcode-container">
        <svg id="barcode"></svg>
    </div>
    <div class="barcode-time">In: {{dateStr}}</div>
</div>

<div class="divider"></div>

<table class="vitals-table">
    <tr>
        <td class="vitals-label">Cân nặng:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">kg</td>
    </tr>
    <tr>
        <td class="vitals-label">Chiều cao:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">cm</td>
    </tr>
    <tr>
        <td class="vitals-label">Mạch:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">lần/phút</td>
    </tr>
    <tr>
        <td class="vitals-label">Huyết áp:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">mmHg</td>
    </tr>
    <tr>
        <td class="vitals-label">Mắt phải:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit"></td>
    </tr>
    <tr>
        <td class="vitals-label">Mắt trái:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit"></td>
    </tr>
</table>

<div class="divider" style="margin-top: 15px;"></div>`;

    const printReceptionSlip = async (emp: EmployeeSearchResult, docNo: string, servicesList: any[]) => {
        const dateStr = new Date().toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const templateRaw = settings?.reception_slip_template || DEFAULT_RECEPTION_TEMPLATE;
        const templateBody = templateRaw
            .replace(/\{\{docNo\}\}/g, docNo)
            .replace(/\{\{name\}\}/g, emp.name.toUpperCase())
            .replace(/\{\{dob\}\}/g, emp.dob ? emp.dob.split('-').reverse().join('/') : '')
            .replace(/\{\{cardId\}\}/g, emp.card_id || '')
            .replace(/\{\{address\}\}/g, emp.address || '')
            .replace(/\{\{dateStr\}\}/g, dateStr);

        // 1. Kiểm tra cấu hình máy in để in im lặng qua QZ Tray
        if (settings?.barcode_printer_name) {
            try {
                toast.loading("Đang gửi lệnh in phiếu tiếp đón qua QZ Tray...");
                const cleanHtmlForQz = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8" />
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                color: #000;
                                padding: 2mm;
                                width: 76mm;
                                box-sizing: border-box;
                                line-height: 1.4;
                                font-size: 13px;
                            }
                            .header { text-align: center; margin-bottom: 8px; }
                            .hospital-name { font-weight: bold; font-size: 13px; text-transform: uppercase; }
                            .title { font-size: 16px; font-weight: bold; margin: 6px 0; text-transform: uppercase; }
                            .divider { border-top: 1px dashed #000; margin: 6px 0; }
                            .info-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
                            .info-table td { padding: 3px 0; vertical-align: top; }
                            .info-label { font-weight: bold; width: 80px; }
                            .info-value { padding-left: 6px; }
                            .barcode-section { text-align: center; margin: 8px 0; }
                            .barcode-container { display: flex; justify-content: center; }
                            .vitals-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                            .vitals-table td { padding: 6px 0; vertical-align: bottom; }
                            .vitals-label { font-weight: bold; width: 80px; }
                            .vitals-dots-cell { position: relative; }
                            .vitals-dots-border { border-bottom: 1px dotted #000; height: 16px; width: 100%; }
                            .vitals-unit { width: 60px; text-align: right; }
                        </style>
                    </head>
                    <body>
                        ${templateBody}
                        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                        <script>
                            window.onload = function() {
                                try {
                                    JsBarcode("#barcode", "${docNo}", {
                                        format: "CODE128",
                                        lineColor: "#000",
                                        width: 2,
                                        height: 40,
                                        displayValue: true,
                                        fontSize: 12,
                                        font: "Arial",
                                        margin: 0
                                    });
                                } catch(e) {}
                            }
                        </script>
                    </body>
                    </html>
                `;

                const success = await qzPrinterService.printHTML(settings.barcode_printer_name, cleanHtmlForQz, {
                    size: { width: 80, height: 150 }
                });
                
                toast.dismiss();
                if (success) {
                    toast.success("Đã in phiếu tiếp đón qua QZ Tray thành công!");
                    return;
                }
            } catch (err: any) {
                toast.dismiss();
                console.warn("QZ Tray print failed, falling back to browser print:", err);
                toast.error("Không thể in qua QZ Tray. Đang chuyển sang chế độ in qua trình duyệt...");
            }
        }

        // 2. Chế độ in dự phòng (Fallback): Mở cửa sổ in mặc định của trình duyệt
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            toast.error("Trình duyệt chặn mở cửa sổ mới. Vui lòng cấp quyền Pop-ups!");
            return;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Phiếu Tiếp Đón Khám Sức Khỏe</title>
                <meta charset="utf-8" />
                <style>
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        color: #000;
                        margin: 0 auto;
                        padding: 8mm 4mm 4mm 4mm;
                        width: 80mm;
                        box-sizing: border-box;
                        line-height: 1.4;
                        font-size: 14px;
                    }
                    .no-print {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .print-btn {
                        background: #0f766e;
                        color: white;
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 13px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .hospital-name {
                        font-weight: bold;
                        font-size: 15px;
                        text-transform: uppercase;
                        line-height: 1.3;
                    }
                    .title {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 8px 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 8px 0;
                    }
                    .info-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 8px 0;
                    }
                    .info-table td {
                        padding: 4px 0;
                        vertical-align: top;
                    }
                    .info-label {
                        font-weight: bold;
                        width: 85px;
                        white-space: nowrap;
                    }
                    .info-value {
                        padding-left: 8px;
                    }
                    .barcode-section {
                        text-align: center;
                        margin: 12px 0;
                    }
                    .barcode-container {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 2px;
                    }
                    .barcode-time {
                        font-size: 12px;
                        margin-top: 2px;
                    }
                    .vitals-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    .vitals-table td {
                        padding: 8px 0;
                        vertical-align: bottom;
                    }
                    .vitals-label {
                        font-weight: bold;
                        width: 90px;
                        white-space: nowrap;
                    }
                    .vitals-dots-cell {
                        position: relative;
                    }
                    .vitals-dots-border {
                        border-bottom: 1px dotted #000;
                        height: 18px;
                        width: 100%;
                    }
                    .vitals-unit {
                        width: 70px;
                        text-align: right;
                        padding-left: 5px;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                        body {
                            padding: 2mm;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <button class="print-btn" onclick="window.print()">IN PHIẾU TIẾP ĐÓN</button>
                </div>
                
                ${templateBody}
                
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <script>
                    window.onload = function() {
                        try {
                            JsBarcode("#barcode", "${docNo}", {
                                format: "CODE128",
                                lineColor: "#000",
                                width: 2,
                                height: 50,
                                displayValue: true,
                                fontSize: 14,
                                font: "Arial",
                                margin: 0
                            });
                        } catch(e) {
                            console.error("Barcode gen error:", e);
                        }
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    }
                    window.onafterprint = function() {
                        window.close();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleReprintSlip = () => {
        if (!selectedEmployee || !receptionInfo) return;
        printReceptionSlip(selectedEmployee, receptionInfo.docNo, receptionInfo.services);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[75vh]">
            <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Tiếp nhận bệnh nhân</h4>
                            <p className="text-[11px] text-slate-500">Quét mã CCCD hoặc tìm theo Họ tên / SĐT</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Từ ngày</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Đến ngày</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gói khám đoàn / Hợp đồng</label>
                            <select
                                value={selectedContractId}
                                onChange={(e) => setSelectedContractId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-bold text-slate-750 dark:text-white cursor-pointer"
                            >
                                <option value="">Tất cả gói khám (Chờ tiếp đón)</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Trạng thái tiếp đón</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs font-bold text-slate-750 dark:text-white cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="W">Chờ tiếp đón</option>
                                <option value="R">Đã tiếp nhận</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Quét thẻ CCCD hoặc nhập CCCD/SĐT/Tên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-9 pr-20 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm font-semibold"
                        />
                        <button
                            onClick={() => {
                                // Trigger immediate search by resetting searchQuery slightly or recalling API
                                healthCheckService.searchEmployeeByCard(searchQuery.trim(), selectedContractId)
                                    .then(setSearchResults)
                                    .catch(err => console.error(err));
                            }}
                            disabled={isSearching}
                            className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                            {isSearching ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : 'Tìm kiếm'}
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px] border border-slate-100 dark:border-slate-700 rounded-2xl overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-2 flex flex-col gap-1.5 custom-scrollbar">
                        {isSearching ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-10 gap-2">
                                <RefreshIcon className="w-5 h-5 animate-spin" />
                                <span>Đang tìm kiếm nhân viên...</span>
                            </div>
                        ) : filteredSearchResults.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs py-10 text-center px-4">
                                <span>Chưa có kết quả tìm kiếm</span>
                                <span className="text-[10px] text-slate-500 italic mt-1">Vui lòng quét thẻ CCCD hoặc gõ thông tin tìm kiếm nhân viên</span>
                            </div>
                        ) : (
                            filteredSearchResults.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => selectEmployee(emp)}
                                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1.5 cursor-pointer ${
                                        selectedEmployee?.id === emp.id
                                            ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/30'
                                            : 'bg-white dark:bg-slate-800 border-slate-150/80 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                    }`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{emp.name}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                            emp.status === 'R' 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 border border-emerald-100 dark:border-emerald-900/20'
                                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/10'
                                        }`}>
                                            {emp.status === 'R' ? 'Đã tiếp nhận' : 'Chờ tiếp đón'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 text-[11px] text-slate-500 font-semibold">
                                        <span>Ngày sinh: {emp.dob ? emp.dob.split('-').reverse().join('/') : 'N/A'}</span>
                                        <span>Giới tính: {emp.gender === 'F' || emp.gender === 'Nữ' ? 'Nữ' : 'Nam'}</span>
                                        <span>CCCD: {emp.card_id || 'Chưa có'}</span>
                                        <span>SĐT: {emp.phone || 'Chưa có'}</span>
                                        <span className="col-span-2 truncate">HĐ: {emp.contract_name}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-4">
                {selectedEmployee ? (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6 flex-1 animate-in fade-in duration-200">
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700/60 pb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider">{selectedEmployee.name}</h3>
                                <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedEmployee.company_name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    {selectedEmployee.status !== 'R' && (
                                        <button
                                            onClick={startEditing}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                            </svg>
                                            Sửa thông tin
                                        </button>
                                    )}
                                    {selectedEmployee.doc_no ? (
                                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1.5 rounded-lg uppercase tracking-wider">
                                            Mã HS HIS: {selectedEmployee.doc_no}
                                        </span>
                                    ) : (
                                        <span className="bg-slate-150 dark:bg-slate-750 text-slate-650 dark:text-slate-350 text-[10px] font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider">
                                            Chờ tiếp đón
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Họ và tên</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{selectedEmployee.name}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Giới tính</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.gender === 'F' || selectedEmployee.gender === 'Nữ' ? 'Nữ' : 'Nam'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ngày sinh</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.dob ? selectedEmployee.dob.split('-').reverse().join('/') : 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tuổi</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.dob ? calculateAge(selectedEmployee.dob) : 'Chưa cập nhật'}</span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số CCCD / Định danh</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.card_id || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ngày cấp CCCD</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.card_id_date || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nơi cấp CCCD</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.card_id_place || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số điện thoại</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.phone || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dân tộc</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{displayEthnic}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quốc tịch</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Việt Nam (VNM)</span>
                            </div>
                            <div className="flex flex-col gap-0.5 md:col-span-2">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tỉnh / Xã cư trú</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {displayLocation}
                                </span>
                            </div>

                            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-4">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Địa chỉ thường trú</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.address || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-2">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Họ và tên người giám hộ</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.guardian_name || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-2">
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số CCCD người giám hộ</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedEmployee.guardian_cccd || 'Chưa cập nhật'}</span>
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-700/60" />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="autoReset"
                                    checked={autoReset}
                                    onChange={(e) => setAutoReset(e.target.checked)}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                                />
                                <label htmlFor="autoReset" className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider select-none cursor-pointer">
                                    Tự động chuyển tiếp sau khi in (Quét liên tục)
                                </label>
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                                {selectedEmployee.status === 'R' || receptionInfo ? (
                                    <>
                                        <div className="flex-1 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                                            <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            <div>
                                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">Đã tiếp đón & đồng bộ HIS thành công</span>
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Hồ sơ đã được lưu, cận lâm sàng đã chuyển sang chỉ định lâm sàng.</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleReprintSlip}
                                            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md shadow-teal-500/10"
                                        >
                                            <PrinterIcon className="w-4 h-4" />
                                            In lại phiếu
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleReceive}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-700/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshIcon className="w-4 h-4 animate-spin" />
                                                Đang tiếp nhận...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="w-4 h-4" />
                                                Tiếp nhận & in
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-slate-400 dark:text-slate-500 flex-1 min-h-[400px]">
                        <UserGroupIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4 animate-pulse" />
                        <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-650 dark:text-slate-350">Thông tin chi tiết bệnh nhân</h4>
                        <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">Chọn một nhân viên từ danh sách kết quả tìm kiếm bên trái để bắt đầu quy trình tiếp đón và chỉ định cận lâm sàng.</p>
                    </div>
                )}
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-[#0f766e] px-6 py-4 text-white flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-wider">Chỉnh sửa thông tin hành chính bệnh nhân</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:text-slate-200 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Họ (đệm)</label>
                                    <input 
                                        type="text" 
                                        value={editForm.surname} 
                                        onChange={e => setEditForm(prev => ({ ...prev, surname: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Tên đệm</label>
                                    <input 
                                        type="text" 
                                        value={editForm.midname} 
                                        onChange={e => setEditForm(prev => ({ ...prev, midname: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Tên</label>
                                    <input 
                                        type="text" 
                                        value={editForm.firstname} 
                                        onChange={e => setEditForm(prev => ({ ...prev, firstname: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Ngày sinh</label>
                                    <input 
                                        type="date" 
                                        value={editForm.dob} 
                                        onChange={e => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Giới tính</label>
                                    <select 
                                        value={editForm.gender} 
                                        onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer"
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="M">Nam (Code M)</option>
                                        <option value="F">Nữ (Code F)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Số CCCD (12 số)</label>
                                    <input 
                                        type="text" 
                                        value={editForm.cardId} 
                                        onChange={e => setEditForm(prev => ({ ...prev, cardId: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Ngày cấp CCCD</label>
                                    <input 
                                        type="text" 
                                        placeholder="VD: 25/12/2021"
                                        value={editForm.cardIdDate} 
                                        onChange={e => setEditForm(prev => ({ ...prev, cardIdDate: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Nơi cấp CCCD</label>
                                    <input 
                                        type="text" 
                                        placeholder="Cục CSQLHC về trật tự xã hội"
                                        value={editForm.cardIdPlace} 
                                        onChange={e => setEditForm(prev => ({ ...prev, cardIdPlace: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Số điện thoại liên hệ (10 số)</label>
                                    <input 
                                        type="text" 
                                        value={editForm.phone} 
                                        onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div className="relative z-30">
                                    <Combobox<CatalogItem>
                                        label="Dân tộc"
                                        value={editForm.ethnic}
                                        displayValue={item => item.name}
                                        onChange={val => setEditForm(prev => ({ ...prev, ethnic: val }))}
                                        options={ethnicities}
                                        columns={commonColumns}
                                        placeholder="Chọn dân tộc..."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative z-20">
                                    <Combobox<CatalogItem>
                                        label="Tỉnh / Thành phố"
                                        value={editForm.provId}
                                        displayValue={item => item.name}
                                        onChange={val => setEditForm(prev => ({ ...prev, provId: val, villId: '' }))}
                                        options={provinces}
                                        columns={commonColumns}
                                        placeholder="Chọn tỉnh/thành..."
                                    />
                                </div>
                                <div className="relative z-10">
                                    <Combobox<CatalogItem>
                                        label="Phường / Xã"
                                        value={editForm.villId}
                                        displayValue={item => item.name}
                                        onChange={val => setEditForm(prev => ({ ...prev, villId: val }))}
                                        options={editWards}
                                        columns={commonColumns}
                                        placeholder="Chọn phường/xã..."
                                        disabled={!editForm.provId}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Địa chỉ thường trú</label>
                                <input 
                                    type="text" 
                                    value={editForm.address} 
                                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Họ tên người giám hộ</label>
                                    <input 
                                        type="text" 
                                        value={editForm.guardianName} 
                                        onChange={e => setEditForm(prev => ({ ...prev, guardianName: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1">Số CCCD người giám hộ</label>
                                    <input 
                                        type="text" 
                                        value={editForm.guardianCccd} 
                                        onChange={e => setEditForm(prev => ({ ...prev, guardianCccd: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition cursor-pointer flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Lưu thông tin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientReception;

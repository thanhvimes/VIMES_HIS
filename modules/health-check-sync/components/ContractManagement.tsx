// ==================== CONTRACT MANAGEMENT COMPONENT ====================
// File: modules/health-check-sync/components/ContractManagement.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { 
    PlusIcon, 
    SearchIcon, 
    RefreshIcon, 
    TrashIcon, 
    PencilIcon, 
    UserGroupIcon, 
    CalendarIcon,
    InfoIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    CloudUploadIcon,
    LockIcon,
    ShieldCheckIcon
} from '../../../components/Icons';
import { toast } from 'sonner';
import { formatDate } from '../../../utils/formatters';

interface Contract {
    id: number;
    code: string;
    name: string;
    company_id: string;
    contract_date: string;
    exam_date: string;
    type: string;
    object: string;
    form_type?: string;
    status: string;
    employee_count: number;
    synced_count: number;
}

interface Employee {
    id: string;
    code: string;
    name: string;
    birth_date: string;
    sex: string;
    doc_no: string;
    phone: string;
    note: string;
    status: string;
    sync_status: string;
}

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ContractManagement: React.FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [patientObjects, setPatientObjects] = useState<CatalogItem[]>([]);
    const [activeTab, setActiveTab] = useState<'employees' | 'services'>('employees');
    const [services, setServices] = useState<any[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    
    const [workplaces, setWorkplaces] = useState<CatalogItem[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [examFees, setExamFees] = useState<any[]>([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [formData, setFormData] = useState({
        code: '',
        company_id: '',
        description: '',
        contract_date: '',
        exam_date: '',
        type: 'DV',
        object: '',
        form_type: '2'
    });

    // Service Modal States
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceGroups, setServiceGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupServices, setGroupServices] = useState<any[]>([]);
    const [selectedServices, setSelectedServices] = useState<any[]>([]); // array of { item_id, name, unit, price, quantity, gender }
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingGroupServices, setIsLoadingGroupServices] = useState(false);

    const loadServiceGroups = async () => {
        setIsLoadingGroups(true);
        try {
            const data = await healthCheckService.getServiceGroups();
            setServiceGroups(data);
            if (data.length > 0) {
                setSelectedGroup(data[0].id);
            }
        } catch (err: any) {
            console.error("Failed to load service groups:", err);
            toast.error("Không thể tải nhóm dịch vụ!");
        } finally {
            setIsLoadingGroups(false);
        }
    };

    useEffect(() => {
        if (isServiceModalOpen) {
            loadServiceGroups();
        }
    }, [isServiceModalOpen]);

    const loadServicesByGroup = async (groupId: string) => {
        setIsLoadingGroupServices(true);
        try {
            const data = await healthCheckService.getServicesByGroup(groupId);
            setGroupServices(data);
        } catch (err: any) {
            console.error("Failed to load group services:", err);
        } finally {
            setIsLoadingGroupServices(false);
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            loadServicesByGroup(selectedGroup);
        }
    }, [selectedGroup]);

    const handleSearchServices = async (val: string) => {
        setServiceSearchTerm(val);
        if (!val.trim()) {
            if (selectedGroup) loadServicesByGroup(selectedGroup);
            return;
        }
        setIsLoadingGroupServices(true);
        try {
            const data = await healthCheckService.searchAvailableServices(val);
            setGroupServices(data);
        } catch (err: any) {
            console.error("Failed to search services:", err);
        } finally {
            setIsLoadingGroupServices(false);
        }
    };

    const handleAddServiceToSelection = (service: any) => {
        const exists = selectedServices.find(s => s.item_id === service.item_id);
        if (exists) {
            setSelectedServices(selectedServices.map(s => 
                s.item_id === service.item_id 
                    ? { ...s, quantity: (s.quantity || 1) + 1 }
                    : s
            ));
        } else {
            setSelectedServices([...selectedServices, { ...service, quantity: 1, gender: 'A' }]);
        }
    };

    const handleRemoveServiceFromSelection = (itemId: string) => {
        setSelectedServices(selectedServices.filter(s => s.item_id !== itemId));
    };

    const handleUpdateSelectionQuantity = (itemId: string, qty: number) => {
        setSelectedServices(selectedServices.map(s => 
            s.item_id === itemId ? { ...s, quantity: Math.max(1, qty) } : s
        ));
    };

    const handleUpdateSelectionGender = (itemId: string, gender: string) => {
        setSelectedServices(selectedServices.map(s => 
            s.item_id === itemId ? { ...s, gender } : s
        ));
    };

    const handleApplyServices = async () => {
        if (!selectedContract || selectedServices.length === 0) return;
        try {
            toast.loading("Đang thêm dịch vụ vào gói khám...");
            const res = await healthCheckService.addContractServices(selectedContract.id, selectedServices);
            toast.dismiss();
            if (res.success) {
                toast.success("Đã thêm dịch vụ thành công!");
                setIsServiceModalOpen(false);
                setSelectedServices([]);
                loadServices(selectedContract.id);
            } else {
                toast.error("Thêm dịch vụ thất bại!");
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Lỗi hệ thống");
        }
    };

    const handleDeleteService = async (serviceId: number) => {
        if (!selectedContract) return;
        if (!confirm("Bạn có chắc chắn muốn xóa dịch vụ này khỏi gói khám?")) return;
        try {
            toast.loading("Đang xóa dịch vụ...");
            const res = await healthCheckService.deleteContractService(selectedContract.id, serviceId);
            toast.dismiss();
            if (res.success) {
                toast.success("Đã xóa dịch vụ thành công!");
                loadServices(selectedContract.id);
            } else {
                toast.error("Xóa dịch vụ thất bại!");
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Lỗi hệ thống");
        }
    };

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p);

    const loadContracts = async () => {
        setIsLoadingContracts(true);
        try {
            const data = await healthCheckService.getContracts();
            setContracts(data as Contract[]);
            if (data.length > 0) {
                // Keep selection or select first
                const currentlySelected = selectedContract 
                    ? data.find((c: any) => c.id === selectedContract.id) 
                    : null;
                setSelectedContract(currentlySelected || data[0]);
            } else {
                setSelectedContract(null);
            }
        } catch (error) {
            console.error("Failed to load contracts:", error);
            toast.error("Không thể tải danh sách hợp đồng!");
        } finally {
            setIsLoadingContracts(false);
        }
    };

    const loadEmployees = async (contractId: number) => {
        setIsLoadingEmployees(true);
        try {
            const data = await healthCheckService.getContractEmployees(contractId);
            setEmployees(data);
        } catch (error) {
            console.error("Failed to load employees:", error);
            toast.error("Không thể tải danh sách nhân viên!");
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const loadServices = async (contractId: number) => {
        setIsLoadingServices(true);
        try {
            const data = await healthCheckService.getContractServices(contractId);
            setServices(data);
        } catch (error) {
            console.error("Failed to load services:", error);
            toast.error("Không thể tải danh sách dịch vụ!");
        } finally {
            setIsLoadingServices(false);
        }
    };

    const loadCatalogs = async () => {
        try {
            console.log('🔍 [loadCatalogs] Trực tiếp tải các danh mục...');
            catalogService.getWorkplaces()
                .then(data => {
                    console.log('🔍 [loadCatalogs] Workplaces loaded:', data);
                    setWorkplaces(data || []);
                })
                .catch(err => console.error("❌ [loadCatalogs] Lỗi tải workplaces:", err));

            catalogService.getObjects()
                .then(data => {
                    console.log('🔍 [loadCatalogs] Objects loaded:', data);
                    setPatientObjects(data || []);
                })
                .catch(err => console.error("❌ [loadCatalogs] Lỗi tải objects:", err));

            healthCheckService.getReceptionRooms()
                .then(data => {
                    console.log('🔍 [loadCatalogs] Rooms loaded:', data);
                    setRooms(data || []);
                })
                .catch(err => console.error("❌ [loadCatalogs] Lỗi tải reception rooms:", err));

            healthCheckService.getExamFees()
                .then(data => {
                    console.log('🔍 [loadCatalogs] Exam Fees loaded:', data);
                    setExamFees(data || []);
                })
                .catch(err => console.error("❌ [loadCatalogs] Lỗi tải exam fees:", err));
        } catch (error) {
            console.error("❌ Failed to load catalogs:", error);
        }
    };

    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            const matchesSearch = 
                (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (startDate && c.contract_date && c.contract_date < startDate) return false;
            if (endDate && c.contract_date && c.contract_date > endDate) return false;

            return true;
        });
    }, [contracts, searchTerm, startDate, endDate]);

    useEffect(() => {
        loadContracts();
        loadCatalogs();
    }, []);

    useEffect(() => {
        if (isFormOpen) {
            loadCatalogs();
        }
    }, [isFormOpen]);

    // Đồng bộ hợp đồng được chọn với danh sách hợp đồng sau khi lọc
    useEffect(() => {
        if (filteredContracts.length > 0) {
            const isStillAvailable = selectedContract
                ? filteredContracts.some(c => c.id === selectedContract.id)
                : false;
            if (!isStillAvailable) {
                setSelectedContract(filteredContracts[0]);
            }
        } else {
            setSelectedContract(null);
        }
    }, [filteredContracts]);

    useEffect(() => {
        if (selectedContract) {
            loadEmployees(selectedContract.id);
            loadServices(selectedContract.id);
        } else {
            setEmployees([]);
            setServices([]);
        }
    }, [selectedContract]);

    const handleAddClick = () => {
        setFormMode('ADD');
        setFormData({
            code: '',
            company_id: workplaces[0]?.id ? String(workplaces[0].id) : '',
            description: '',
            contract_date: new Date().toISOString().split('T')[0],
            exam_date: new Date().toISOString().split('T')[0],
            type: '',
            object: '',
            form_type: '2'
        });
        setIsFormOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, contract: Contract) => {
        e.stopPropagation();
        setFormMode('EDIT');
        setFormData({
            code: contract.code || '',
            company_id: contract.company_id || '',
            description: contract.name || '',
            contract_date: contract.contract_date || '',
            exam_date: contract.exam_date || '',
            type: contract.type || '',
            object: contract.object ? String(contract.object) : '',
            form_type: contract.form_type || '2'
        });
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.code.trim()) {
            toast.error("Vui lòng nhập Mã hợp đồng");
            return;
        }

        try {
            if (formMode === 'ADD') {
                await healthCheckService.createContract(formData);
                toast.success("Thêm hợp đồng thành công!");
            } else if (formMode === 'EDIT' && selectedContract) {
                await healthCheckService.updateContract(selectedContract.id, formData);
                toast.success("Cập nhật hợp đồng thành công!");
            }
            setIsFormOpen(false);
            await loadContracts();
        } catch (error: any) {
            toast.error("Thao tác thất bại: " + error.message);
        }
    };

    const handleDeleteClick = async (e: React.MouseEvent, contract: Contract) => {
        e.stopPropagation();
        if (contract.employee_count > 0) {
            toast.warning(`Chặn xóa: Đang tồn tại ${contract.employee_count} nhân viên đăng ký dưới hợp đồng này!`);
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa hợp đồng [${contract.code} - ${contract.name}] không?`)) {
            return;
        }

        try {
            const res = await healthCheckService.deleteContract(contract.id);
            if (res.success) {
                toast.success("Xóa hợp đồng thành công!");
                await loadContracts();
            } else {
                toast.error(res.message || "Xóa hợp đồng thất bại!");
            }
        } catch (error: any) {
            toast.error("Lỗi xóa hợp đồng: " + error.message);
        }
    };

    const handleToggleContractStatus = async (contract: Contract) => {
        const newStatus = contract.status === 'A' ? 'O' : 'A';
        const msg = newStatus === 'A' ? 'Đã duyệt khóa chốt gói khám!' : 'Đã mở khóa gói khám!';
        try {
            toast.loading("Đang cập nhật trạng thái gói khám...");
            const res = await healthCheckService.updateContractStatus(contract.id, newStatus);
            toast.dismiss();
            if (res.success) {
                toast.success(msg);
                setSelectedContract({ ...contract, status: newStatus });
                await loadContracts();
            } else {
                toast.error("Cập nhật trạng thái thất bại!");
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Lỗi hệ thống");
        }
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContract) return;

        const scriptId = 'sheetjs-cdn';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const parseFile = () => {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const XLSX = (window as any).XLSX;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];

                    if (data.length <= 1) {
                        toast.error("File excel không có dữ liệu!");
                        return;
                    }

                     const removeAccents = (str: string) => {
                        return str.normalize('NFD')
                                  .replace(/[\u0300-\u036f]/g, '')
                                  .replace(/đ/g, 'd')
                                  .replace(/Đ/g, 'd');
                    };
                    const headers = data[0].map(h => removeAccents(String(h).trim().toLowerCase()));
                    const nameIdx = headers.findIndex(h => h.includes('ten') || h.includes('ho') || h.includes('name'));
                    const dobIdx = headers.findIndex(h => h.includes('sinh') || h.includes('dob') || h.includes('birth'));
                    const sexIdx = headers.findIndex(h => h.includes('gioi') || h.includes('sex') || h.includes('gender'));
                    const docIdx = headers.findIndex(h => h.includes('cccd') || h.includes('ho so') || h.includes('doc') || h.includes('card'));
                    const phoneIdx = headers.findIndex(h => h.includes('thoai') || h.includes('sdt') || h.includes('phone'));
                    const noteIdx = headers.findIndex(h => h.includes('chu') || h.includes('note'));
                    
                    const deptIdx = headers.findIndex(h => h.includes('bo phan') || h.includes('bophan') || h.includes('dept'));
                    const posIdx = headers.findIndex(h => h.includes('chuc') || h.includes('position'));
                    const ownerIdx = headers.findIndex(h => h.includes('ban than') || h.includes('banthan') || h.includes('owner'));
                    const addrIdx = headers.findIndex(h => h.includes('noi o') || h.includes('noi_o') || h.includes('dia chi') || h.includes('address'));
                    const provIdx = headers.findIndex(h => h.includes('tinh') || h.includes('prov'));
                    const distIdx = headers.findIndex(h => h.includes('huyen') || h.includes('dist'));
                    const wardIdx = headers.findIndex(h => h.includes('xa') || h.includes('ward') || h.includes('vill'));

                    const cardDateIdx = headers.findIndex(h => h.includes('ngay cap') || h.includes('ngaycap') || h.includes('cardid_date'));
                    const cardPlaceIdx = headers.findIndex(h => h.includes('noi cap') || h.includes('noicap') || h.includes('cardid_place'));
                    const guardianNameIdx = headers.findIndex(h => h.includes('giam ho') || h.includes('guardian_name'));
                    const guardianCccdIdx = headers.findIndex(h => h.includes('cccd_ngh') || h.includes('guardian_cccd'));
                    const ethnicIdx = headers.findIndex(h => h.includes('dan toc') || h.includes('ethnic'));

                    if (nameIdx === -1) {
                        toast.error("Không tìm thấy cột 'Họ và tên' trong file!");
                        return;
                    }

                    const parsedEmployees = [];
                    for (let i = 1; i < data.length; i++) {
                        const row = data[i];
                        if (!row || row.length === 0 || !row[nameIdx]) continue;

                        let docNo = docIdx !== -1 ? String(row[docIdx]).trim() : '';
                        if (docNo && /^\d+$/.test(docNo) && docNo.length < 12) {
                            docNo = docNo.padStart(12, '0');
                        }

                        let phone = phoneIdx !== -1 ? String(row[phoneIdx]).trim() : '';
                        if (phone && /^\d{9}$/.test(phone)) {
                            phone = '0' + phone;
                        }

                        let guardianCccd = guardianCccdIdx !== -1 ? String(row[guardianCccdIdx]).trim() : '';
                        if (guardianCccd && /^\d+$/.test(guardianCccd) && guardianCccd.length < 12) {
                            guardianCccd = guardianCccd.padStart(12, '0');
                        }

                        parsedEmployees.push({
                            name: String(row[nameIdx]).trim(),
                            birth_date: dobIdx !== -1 ? String(row[dobIdx]).trim() : '',
                            sex: sexIdx !== -1 ? String(row[sexIdx]).trim() : 'Nam',
                            doc_no: docNo,
                            phone: phone,
                            note: noteIdx !== -1 ? String(row[noteIdx]).trim() : '',
                            dept: deptIdx !== -1 ? String(row[deptIdx]).trim() : '',
                            position: posIdx !== -1 ? String(row[posIdx]).trim() : '',
                            owner: ownerIdx !== -1 ? String(row[ownerIdx]).trim() : '',
                            detail_address: addrIdx !== -1 ? String(row[addrIdx]).trim() : '',
                            province_id: provIdx !== -1 ? parseInt(String(row[provIdx]), 10) || null : null,
                            district_id: distIdx !== -1 ? parseInt(String(row[distIdx]), 10) || null : null,
                            ward_id: wardIdx !== -1 ? parseInt(String(row[wardIdx]), 10) || null : null,
                            cardid_date: cardDateIdx !== -1 ? String(row[cardDateIdx]).trim() : '',
                            cardid_place: cardPlaceIdx !== -1 ? String(row[cardPlaceIdx]).trim() : '',
                            guardian_name: guardianNameIdx !== -1 ? String(row[guardianNameIdx]).trim() : '',
                            guardian_cccd: guardianCccd,
                            ethnic: ethnicIdx !== -1 ? String(row[ethnicIdx]).trim() : ''
                        });
                    }

                    if (parsedEmployees.length === 0) {
                        toast.error("Không parse được nhân viên nào hợp lệ!");
                        return;
                    }

                    toast.loading("Đang import danh sách nhân viên...");
                    const res = await healthCheckService.importEmployees(selectedContract.id, parsedEmployees);
                    toast.dismiss();
                    
                    if (res.success) {
                        toast.success(`Import thành công ${res.count} nhân viên!`);
                        loadContracts();
                        loadEmployees(selectedContract.id);
                    } else {
                        toast.error("Import thất bại!");
                    }
                } catch (err: any) {
                    toast.dismiss();
                    toast.error("Lỗi đọc file: " + err.message);
                }
            };
            reader.readAsBinaryString(file);
            e.target.value = '';
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
            script.onload = parseFile;
            document.head.appendChild(script);
        } else {
            parseFile();
        }
    };


    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-200">
            {/* Header Filter Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <SearchIcon className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã, tên hợp đồng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e] dark:focus:ring-teal-500 font-semibold"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Từ ngày</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e] font-semibold"
                        />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đến ngày</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e] font-semibold"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={loadContracts}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition text-slate-600 dark:text-slate-200 cursor-pointer"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl font-bold flex items-center gap-1.5 text-sm active:scale-95 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Thêm hợp đồng
                    </button>
                </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left Side: Contracts List */}
                <div className="lg:w-4/12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Danh sách hợp đồng ({filteredContracts.length})
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {isLoadingContracts ? (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <RefreshIcon className="w-8 h-8 animate-spin text-teal-500" />
                                <span className="text-slate-500 text-xs font-semibold mt-2">Đang tải danh sách hợp đồng...</span>
                            </div>
                        ) : filteredContracts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                                <InfoIcon className="w-8 h-8 mb-2" />
                                <span className="text-sm font-semibold">Không tìm thấy hợp đồng nào</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredContracts.map((c) => {
                                    const isSelected = selectedContract?.id === c.id;
                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedContract(c)}
                                            className={`p-4 transition-all duration-150 cursor-pointer flex justify-between items-center ${
                                                isSelected 
                                                    ? 'bg-rose-50/50 dark:bg-rose-950/10 border-l-4 border-rose-600' 
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                                        {c.code}
                                                    </span>
                                                    {c.status === 'A' ? (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/40 flex items-center gap-0.5" title="Đã chốt gói">
                                                            <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
                                                            Đã duyệt
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/40 flex items-center gap-0.5" title="Gói đang mở">
                                                            <LockIcon className="w-3 h-3 text-slate-500" />
                                                            Đang mở
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {formatDate(c.contract_date)}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-slate-800 dark:text-slate-100 text-[13px] line-clamp-2">
                                                    {c.name}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <UserGroupIcon className="w-3.5 h-3.5" />
                                                        {c.employee_count} nhân viên
                                                    </span>
                                                    <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                                        Đã đồng bộ {c.synced_count}
                                                    </span>
                                                </div>
                                            </div>

                                            {c.status !== 'A' ? (
                                                <div className="flex gap-1.5 opacity-80 hover:opacity-100">
                                                    <button
                                                        onClick={(e) => handleEditClick(e, c)}
                                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 transition cursor-pointer"
                                                        title="Sửa hợp đồng"
                                                    >
                                                        <PencilIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, c)}
                                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 transition cursor-pointer"
                                                        title="Xóa hợp đồng"
                                                    >
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-emerald-600 font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/15 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                    Đã khóa
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Employees List */}
                <div className="lg:w-8/12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-[#fff1f2] dark:bg-rose-950/20">
                        <span className="text-xs font-extrabold text-[#9f1239] dark:text-rose-300 uppercase tracking-wider flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" />
                            Gói khám: {selectedContract ? selectedContract.name : 'Chưa chọn'}
                        </span>
                        <div className="flex items-center gap-3">
                            {selectedContract && activeTab === 'employees' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                                    {employees.length} Nhân viên
                                </span>
                            )}
                            {selectedContract && activeTab === 'services' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                                    {services.length} Dịch vụ
                                </span>
                            )}
                            {selectedContract && selectedContract.status !== 'A' && activeTab === 'employees' && (
                                <label className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center gap-1 active:scale-95">
                                    <CloudUploadIcon className="w-3.5 h-3.5" />
                                    Import Excel
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleImportExcel}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            {selectedContract && selectedContract.status !== 'A' && (
                                <button
                                    onClick={() => setIsServiceModalOpen(true)}
                                    className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" />
                                    Thêm dịch vụ
                                </button>
                            )}
                            {selectedContract && (
                                <button
                                    onClick={() => handleToggleContractStatus(selectedContract)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer ${
                                        selectedContract.status === 'A'
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                                >
                                    {selectedContract.status === 'A' ? (
                                        <>
                                            <LockIcon className="w-3.5 h-3.5" />
                                            Mở khóa
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                                            Duyệt chốt
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs row matching C++ list view */}
                    {selectedContract && (
                        <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 px-5">
                            <button
                                onClick={() => setActiveTab('employees')}
                                className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'employees'
                                        ? 'border-[#9f1239] text-[#9f1239] dark:text-rose-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                DS nhân viên
                            </button>
                            <button
                                onClick={() => setActiveTab('services')}
                                className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'services'
                                        ? 'border-[#9f1239] text-[#9f1239] dark:text-rose-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                Gói DV
                            </button>
                        </div>
                    )}
 
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {!selectedContract ? (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                                <UserGroupIcon className="w-12 h-12 mb-2 text-slate-300" />
                                <span className="text-sm font-semibold">Vui lòng chọn một hợp đồng bên trái để xem chi tiết</span>
                            </div>
                        ) : activeTab === 'employees' ? (
                            isLoadingEmployees ? (
                                <div className="flex flex-col items-center justify-center h-full py-10">
                                    <RefreshIcon className="w-8 h-8 animate-spin text-rose-500" />
                                    <span className="text-slate-500 text-xs font-semibold mt-2">Đang tải danh sách nhân viên...</span>
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                                    <InfoIcon className="w-8 h-8 mb-2" />
                                    <span className="text-sm font-semibold">Chưa có nhân viên nào đăng ký trong gói này</span>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 w-12 text-center">STT</th>
                                            <th className="p-3 w-24 font-mono">Mã NV</th>
                                            <th className="p-3">Họ và tên</th>
                                            <th className="p-3 w-28 text-center">Ngày sinh</th>
                                            <th className="p-3 w-16 text-center">Giới</th>
                                            <th className="p-3 w-32 font-mono">Số CCCD</th>
                                            <th className="p-3 w-32 font-mono">Số hồ sơ</th>
                                            <th className="p-3 w-28 text-center">SĐT</th>
                                            <th className="p-3 w-32 text-center">VNeID Sync</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {employees.map((e, idx) => (
                                            <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                <td className="p-3 font-bold text-slate-950 dark:text-white font-mono text-xs">{e.code}</td>
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-800 dark:text-white text-[13px]">{e.name}</div>
                                                    {e.note && <div className="text-[10px] text-slate-400 italic line-clamp-1">{e.note}</div>}
                                                </td>
                                                <td className="p-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400">{e.birth_date}</td>
                                                <td className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    {e.sex === 'M' ? 'Nam' : e.sex === 'F' ? 'Nữ' : e.sex}
                                                </td>
                                                <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">{e.cccd || '---'}</td>
                                                <td className="p-3 font-mono text-xs">
                                                    {e.doc_no ? (
                                                        <span className="font-bold text-teal-600 dark:text-teal-400">{e.doc_no}</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-[11px]">Chưa tiếp đón</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center text-xs font-mono text-slate-600 dark:text-slate-300">{e.phone || '---'}</td>
                                                <td className="p-3 text-center">
                                                    {e.sync_status === 'success' ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200/50">
                                                            Thành công
                                                        </span>
                                                    ) : e.sync_status === 'error' ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200/50">
                                                            Lỗi đồng bộ
                                                        </span>
                                                    ) : e.sync_status === 'pending' ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200/50">
                                                            Chờ gửi
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold text-[10px] border border-slate-200/50 dark:border-slate-800">
                                                            Chưa gửi
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        ) : isLoadingServices ? (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <RefreshIcon className="w-8 h-8 animate-spin text-rose-500" />
                                <span className="text-slate-500 text-xs font-semibold mt-2">Đang tải danh sách dịch vụ...</span>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                                <InfoIcon className="w-8 h-8 mb-2" />
                                <span className="text-sm font-semibold">Chưa có dịch vụ nào trong gói này</span>
                                {selectedContract?.status !== 'A' && (
                                    <button
                                        onClick={() => setIsServiceModalOpen(true)}
                                        className="mt-4 px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-sm cursor-pointer"
                                    >
                                        + Thêm chỉ định
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-5 flex flex-col min-h-full">
                                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 w-12 text-center">STT</th>
                                                <th className="p-3">Diễn giải (Tên dịch vụ)</th>
                                                <th className="p-3 w-24 text-center">Đơn vị</th>
                                                <th className="p-3 w-24 text-center">Số lượng</th>
                                                <th className="p-3 w-32 text-right">Đơn giá</th>
                                                <th className="p-3 w-28 text-center">Đối tượng</th>
                                                <th className="p-3 w-36 text-right">Thành tiền</th>
                                                {selectedContract?.status !== 'A' && (
                                                    <th className="p-3 w-16 text-center">Tác vụ</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {services.map((s, idx) => (
                                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200 text-[13px]">{s.name}</td>
                                                    <td className="p-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">{s.unit || 'Lần'}</td>
                                                    <td className="p-3 text-center text-xs font-bold text-slate-950 dark:text-white font-mono">{s.quantity}</td>
                                                    <td className="p-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300">{formatPrice(parseFloat(s.price))} đ</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            s.gender === 'M' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' :
                                                            s.gender === 'F' ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30' :
                                                            'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800'
                                                        }`}>
                                                            {s.gender === 'M' ? 'Nam' : s.gender === 'F' ? 'Nữ' : 'Nam, Nữ'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono text-xs">
                                                        {formatPrice(parseFloat(s.price) * s.quantity)} đ
                                                    </td>
                                                    {selectedContract?.status !== 'A' && (
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={() => handleDeleteService(s.id)}
                                                                className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 rounded transition cursor-pointer"
                                                                title="Xóa dịch vụ"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {/* Total Row */}
                                            <tr className="bg-slate-50 dark:bg-slate-900/50 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                                <td colSpan={6} className="p-3 text-right text-xs uppercase tracking-wider font-extrabold">Tổng tiền:</td>
                                                <td className="p-3 text-right text-sm font-black text-[#9f1239] dark:text-rose-400 font-mono">
                                                    {formatPrice(services.reduce((sum, s) => sum + (parseFloat(s.price) * s.quantity), 0))} đ
                                                </td>
                                                {selectedContract?.status !== 'A' && <td className="p-3"></td>}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {formMode === 'ADD' ? 'Thêm hợp đồng khám' : 'Sửa hợp đồng khám'}
                            </h5>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleFormSubmit}>
                            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã hợp đồng *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                            placeholder="Ví dụ: HD01/2026"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công ty/Đối tác</label>
                                        <select
                                            value={formData.company_id}
                                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                        >
                                            {workplaces.map((w) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diễn giải/Mô tả *</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm h-20 resize-none"
                                        placeholder="Ví dụ: Khám sức khỏe toàn dân hoặc Tên đoàn khám..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày hợp đồng</label>
                                        <input
                                            type="date"
                                            value={formData.contract_date}
                                            onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày khám dự kiến</label>
                                        <input
                                            type="date"
                                            value={formData.exam_date}
                                            onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại phí khám *</label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                        >
                                            <option value="">-- Chọn phí khám --</option>
                                            {examFees.map((fee) => (
                                                <option key={fee.id} value={fee.id}>{fee.id} - {fee.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phòng khám *</label>
                                        <select
                                            required
                                            value={formData.object}
                                            onChange={(e) => setFormData({ ...formData, object: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                        >
                                            <option value="">-- Chọn phòng khám --</option>
                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.id}>{room.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mẫu khám sức khỏe mặc định *</label>
                                    <select
                                        required
                                        value={formData.form_type}
                                        onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
                                        className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm w-full"
                                    >
                                        <optgroup label="Nhóm Phổ Biến">
                                            <option value="2">{"Mẫu 2: Người lớn (>= 18T)"}</option>
                                            <option value="3">Mẫu 3: Khám sức khỏe lái xe</option>
                                        </optgroup>
                                        <optgroup label="Nhóm Học Sinh">
                                            <option value="1">Mẫu 1: Trẻ em 6T - dưới 18T</option>
                                            <option value="14">Mẫu 14: Học sinh 3M - dưới 6T</option>
                                            <option value="15">Mẫu 15: Học sinh cấp 1</option>
                                            <option value="16">Mẫu 16: Học sinh cấp 2</option>
                                            <option value="17">Mẫu 17: Học sinh cấp 3</option>
                                        </optgroup>
                                        <optgroup label="Nhóm Trẻ Em">
                                            <option value="6">Mẫu 6: Trẻ em 0 - dưới 2 tháng</option>
                                            <option value="7">Mẫu 7: Trẻ em 2 - 3 tháng</option>
                                            <option value="8">Mẫu 8: Trẻ em 4 - 6 tháng</option>
                                            <option value="9">Mẫu 9: Trẻ em 7 - 9 tháng</option>
                                            <option value="10">Mẫu 10: Trẻ em 10 - 12 tháng</option>
                                            <option value="11">Mẫu 11: Trẻ em 13 - 18 tháng</option>
                                            <option value="12">Mẫu 12: Trẻ em 19 - 24 tháng</option>
                                            <option value="13">Mẫu 13: Trẻ em 2 - dưới 6 tuổi</option>
                                        </optgroup>
                                        <optgroup label="Đặc Thù Ngành">
                                            <option value="4">Mẫu 4: Nhân viên đường sắt</option>
                                            <option value="5">Mẫu 5: Thuyền viên tàu biển</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-teal-500/10 cursor-pointer"
                                >
                                    Lưu lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Service Selection Modal (Image 2) */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-6xl w-full h-[85vh] shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                                    <PlusIcon className="w-5 h-5" />
                                </div>
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Thêm chỉ định cận lâm sàng vào gói
                                </h5>
                            </div>
                            <button
                                onClick={() => {
                                    setIsServiceModalOpen(false);
                                    setSelectedServices([]);
                                }}
                                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Three-Column Layout */}
                        <div className="flex-1 flex min-h-0 overflow-hidden divide-x divide-slate-100 dark:divide-slate-800">
                            {/* Col 1: Service Groups (Categories) */}
                            <div className="w-3/12 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/20 p-4">
                                <h6 className="text-[11px] font-extrabold text-[#9f1239] dark:text-rose-400 uppercase tracking-wider mb-3">Nhóm dịch vụ</h6>
                                {isLoadingGroups ? (
                                    <div className="py-4 text-center text-xs text-slate-500">Đang tải...</div>
                                ) : (
                                    <div className="space-y-1">
                                        {serviceGroups.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => setSelectedGroup(g.id)}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                                                    selectedGroup === g.id
                                                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold border border-rose-100 dark:border-rose-900/30'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                {g.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Col 2: Services in Group */}
                            <div className="w-5/12 overflow-y-auto p-4 flex flex-col">
                                <div className="flex justify-between items-center mb-3">
                                    <h6 className="text-[11px] font-extrabold text-[#9f1239] dark:text-rose-400 uppercase tracking-wider">Danh sách dịch vụ kỹ thuật</h6>
                                </div>
                                <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto bg-white dark:bg-slate-800">
                                    {isLoadingGroupServices ? (
                                        <div className="py-10 text-center text-xs text-slate-500">Đang tải dịch vụ...</div>
                                    ) : groupServices.length === 0 ? (
                                        <div className="py-10 text-center text-xs text-slate-400">Không có dịch vụ nào</div>
                                    ) : (
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                                                    <th className="p-2 w-12 text-center">STT</th>
                                                    <th className="p-2">Tên dịch vụ</th>
                                                    <th className="p-2 w-24 text-right">Đơn giá</th>
                                                    <th className="p-2 w-12 text-center">Chọn</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {groupServices.map((gs, idx) => (
                                                    <tr 
                                                        key={gs.item_id} 
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                                        onDoubleClick={() => handleAddServiceToSelection(gs)}
                                                    >
                                                        <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                                        <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{gs.name}</td>
                                                        <td className="p-2 text-right font-mono text-slate-600 dark:text-slate-400">{formatPrice(parseFloat(gs.price))}</td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => handleAddServiceToSelection(gs)}
                                                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 text-teal-600 rounded text-[10px] font-bold cursor-pointer"
                                                            >
                                                                Chọn
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            {/* Col 3: Selected Services for Package */}
                            <div className="w-4/12 overflow-y-auto p-4 flex flex-col">
                                <h6 className="text-[11px] font-extrabold text-[#9f1239] dark:text-rose-400 uppercase tracking-wider mb-3">Dịch vụ đã chọn cho gói</h6>
                                <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto bg-white dark:bg-slate-800 mb-3">
                                    {selectedServices.length === 0 ? (
                                        <div className="h-full flex flex-col justify-center items-center text-slate-400 text-xs py-10">
                                            <span>Chưa chọn dịch vụ nào</span>
                                            <span className="text-[10px] text-slate-500 italic mt-1">(Kích đúp dịch vụ ở giữa để chọn nhanh)</span>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse text-[11px]">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                                                    <th className="p-2">Tên</th>
                                                    <th className="p-2 w-12 text-center">SL</th>
                                                    <th className="p-2 w-20 text-center">Giới</th>
                                                    <th className="p-2 w-10 text-center">Xóa</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {selectedServices.map(ss => (
                                                    <tr key={ss.item_id}>
                                                        <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{ss.name}</td>
                                                        <td className="p-2 text-center">
                                                            <input
                                                                type="number"
                                                                value={ss.quantity}
                                                                onChange={(e) => handleUpdateSelectionQuantity(ss.item_id, parseInt(e.target.value, 10))}
                                                                className="w-10 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-xs p-0.5"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <select
                                                                value={ss.gender}
                                                                onChange={(e) => handleUpdateSelectionGender(ss.item_id, e.target.value)}
                                                                className="text-[10px] border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white p-0.5"
                                                            >
                                                                <option value="A">Nam, Nữ</option>
                                                                <option value="M">Nam</option>
                                                                <option value="F">Nữ</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => handleRemoveServiceFromSelection(ss.item_id)}
                                                                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-0.5 rounded transition cursor-pointer"
                                                            >
                                                                &times;
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between items-center">
                                    <span>Tổng số lượng dịch vụ:</span>
                                    <span className="font-extrabold text-rose-600 dark:text-rose-400">{selectedServices.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer (Search input, action buttons) */}
                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 max-w-sm w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-600 transition">
                                <SearchIcon className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm nhanh theo mã hoặc tên dịch vụ..."
                                    value={serviceSearchTerm}
                                    onChange={(e) => handleSearchServices(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && groupServices.length > 0) {
                                            e.preventDefault();
                                            handleAddServiceToSelection(groupServices[0]);
                                            setServiceSearchTerm('');
                                            handleSearchServices('');
                                            toast.success(`Đã chọn: ${groupServices[0].name}`);
                                        }
                                    }}
                                    className="border-none bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none w-full p-0"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setIsServiceModalOpen(false);
                                        setSelectedServices([]);
                                    }}
                                    className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleApplyServices}
                                    disabled={selectedServices.length === 0}
                                    className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md cursor-pointer ${
                                        selectedServices.length === 0
                                            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                            : 'bg-[#0f766e] hover:bg-[#0d645c] text-white shadow-teal-500/10'
                                    }`}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractManagement;

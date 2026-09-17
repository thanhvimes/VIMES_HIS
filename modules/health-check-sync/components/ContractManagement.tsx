// ==================== CONTRACT MANAGEMENT COMPONENT ====================
// File: modules/health-check-sync/components/ContractManagement.tsx

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { healthCheckService } from '../../../services/healthCheckService';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { useCatalogs } from '../../../contexts/CatalogContext';
import Combobox from '../../../components/ui/Combobox';
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
    DownloadIcon,
    LockIcon,
    ShieldCheckIcon,
    SparklesIcon
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
    def_roomid?: number | string;
    room_id?: number | string;
    room_name?: string;
    def_examtype?: string;
    status: string;
    employee_count: number;
    synced_count: number;
}

interface Employee {
    id: string;
    code: string;
    name: string;
    surname?: string;
    midname?: string;
    firstname?: string;
    birth_date: string;
    sex: string;
    doc_no: string;
    cccd?: string;
    phone: string;
    note: string;
    status: string;
    sync_status: string;
    funding_source?: string;
    nguon_chi_tra?: string;
    has_cls_result?: boolean;
    card_id_date?: string;
    card_id_place?: string;
    ethnic?: string | number;
    occupation?: string | number;
    occupation_name?: string;
    ma_nghe_nghiep?: string | number;
    target_group?: string;
    doi_tuong_ksk?: string;
    prov_id?: string | number;
    vill_id?: string | number;
    address?: string;
    height?: number;
    weight?: number;
    blood_pressure?: string;
    pulse?: number;
    temperature?: number;
    respiration?: number;
    conclusion?: string;
    comment?: string;
    has_clinical_data?: boolean;
    clinical_data?: any;
    conclusion_data?: any;
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
    const [isReceivingAll, setIsReceivingAll] = useState(false);
    const [isSyncingCls, setIsSyncingCls] = useState(false);
    const [isSyncClsModalOpen, setIsSyncClsModalOpen] = useState(false);
    const [syncClsMode, setSyncClsMode] = useState<'missing_only' | 'all_new'>('missing_only');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());

    // Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        company_id: '',
        description: '',
        contract_date: '',
        exam_date: '',
        type: 'DV',
        object: '3',
        def_roomid: '22',
        def_examtype: 'D0000001',
        form_type: '2'
    });

    const { provinces, ethnicities, getWards } = useCatalogs();
    const [editWards, setEditWards] = useState<CatalogItem[]>([]);

    const [isEmployeeEditOpen, setIsEmployeeEditOpen] = useState(false);
    const [employeeFormMode, setEmployeeFormMode] = useState<'ADD' | 'EDIT'>('EDIT');
    const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
    const [employeeFormData, setEmployeeFormData] = useState({
        surname: '',
        midname: '',
        firstname: '',
        birth_date: '',
        sex: 'M',
        cccd: '',
        cardIdDate: '',
        cardIdPlace: '',
        phone: '',
        ethnic: '',
        provId: '',
        villId: '',
        address: '',
        note: ''
    });

    const commonColumns = [
        { key: 'code', label: 'Mã', width: '100px' },
        { key: 'name', label: 'Tên' }
    ];

    const parseDobToInputDate = (dobStr: string) => {
        if (!dobStr) return '';
        const parts = dobStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dobStr;
    };

    useEffect(() => {
        const provIdValue = employeeFormData.provId;
        if (provIdValue) {
            getWards(provIdValue).then(data => {
                setEditWards(data.map((w: any) => ({ id: String(w.id || ''), code: String(w.code || w.id || ''), name: w.name })));
            }).catch(() => setEditWards([]));
        } else {
            setEditWards([]);
        }
    }, [employeeFormData.provId, getWards]);

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
            setSelectedServices([...selectedServices, { ...service, quantity: 1, gender: 'A', min_age: undefined, max_age: undefined }]);
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

    const handleUpdateSelectionMinAge = (itemId: string, minAge: number | undefined) => {
        setSelectedServices(selectedServices.map(s => 
            s.item_id === itemId ? { ...s, min_age: minAge } : s
        ));
    };

    const handleUpdateSelectionMaxAge = (itemId: string, maxAge: number | undefined) => {
        setSelectedServices(selectedServices.map(s => 
            s.item_id === itemId ? { ...s, max_age: maxAge } : s
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
        showConfirm(
            "Xác nhận xóa dịch vụ",
            "Bạn có chắc chắn muốn xóa dịch vụ này khỏi gói khám?",
            async () => {
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
            }
        );
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
        setEditingContract(null);
        setFormData({
            code: '',
            company_id: workplaces[0]?.id ? String(workplaces[0].id) : '',
            description: '',
            contract_date: new Date().toISOString().split('T')[0],
            exam_date: new Date().toISOString().split('T')[0],
            type: 'DV',
            object: '3',
            def_roomid: rooms[0]?.id ? String(rooms[0].id) : '22',
            def_examtype: 'D0000001',
            form_type: '2'
        });
        setIsFormOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, contract: Contract) => {
        e.stopPropagation();
        setFormMode('EDIT');
        setEditingContract(contract);
        setSelectedContract(contract);
        setFormData({
            code: contract.code || '',
            company_id: contract.company_id || '',
            description: contract.name || '',
            contract_date: contract.contract_date || '',
            exam_date: contract.exam_date || '',
            type: contract.type || 'DV',
            object: contract.object ? String(contract.object) : '3',
            def_roomid: contract.def_roomid ? String(contract.def_roomid) : (rooms[0]?.id ? String(rooms[0].id) : '22'),
            def_examtype: contract.def_examtype || 'D0000001',
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
            } else if (formMode === 'EDIT') {
                const targetId = editingContract?.id || selectedContract?.id;
                if (!targetId) {
                    toast.error("Không xác định được hợp đồng cần sửa!");
                    return;
                }
                await healthCheckService.updateContract(targetId, formData);
                toast.success("Cập nhật hợp đồng thành công!");
            }
            setIsFormOpen(false);
            setEditingContract(null);
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

        showConfirm(
            "Xác nhận xóa hợp đồng",
            `Bạn có chắc chắn muốn xóa hợp đồng [${contract.code} - ${contract.name}] không?`,
            async () => {
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
            }
        );
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

    const handleEditEmployeeClick = (employee: Employee) => {
        setSelectedEmployeeForEdit(employee);
        setEmployeeFormMode('EDIT');
        
        setEmployeeFormData({
            surname: employee.surname || '',
            midname: employee.midname || '',
            firstname: employee.firstname || '',
            birth_date: parseDobToInputDate(employee.birth_date),
            sex: employee.sex === 'F' ? 'F' : 'M',
            cccd: employee.cccd || '',
            cardIdDate: employee.card_id_date || '',
            cardIdPlace: employee.card_id_place || '',
            phone: employee.phone || '',
            ethnic: employee.ethnic ? String(employee.ethnic) : '01',
            provId: employee.prov_id ? String(employee.prov_id) : '',
            villId: employee.vill_id ? String(employee.vill_id) : '',
            address: employee.address || '',
            note: employee.note || ''
        });
        setIsEmployeeEditOpen(true);
    };

    const handleAddNewEmployeeClick = () => {
        if (!selectedContract) {
            toast.error("Vui lòng chọn một gói khám!");
            return;
        }
        setEmployeeFormMode('ADD');
        setSelectedEmployeeForEdit(null);
        setEmployeeFormData({
            surname: '',
            midname: '',
            firstname: '',
            birth_date: '',
            sex: 'M',
            cccd: '',
            cardIdDate: '',
            cardIdPlace: '',
            phone: '',
            ethnic: '01',
            provId: '',
            villId: '',
            address: '',
            note: ''
        });
        setIsEmployeeEditOpen(true);
    };

    const handleEmployeeEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (employeeFormMode === 'EDIT' && !selectedEmployeeForEdit) return;
        if (employeeFormMode === 'ADD' && !selectedContract) return;

        if (!employeeFormData.surname.trim() && !employeeFormData.firstname.trim()) {
            toast.error("Vui lòng nhập Họ & Tên nhân viên");
            return;
        }

        if (employeeFormData.cccd && !/^\d{12}$/.test(employeeFormData.cccd)) {
            toast.error("CCCD phải có độ dài chính xác 12 chữ số");
            return;
        }

        if (employeeFormData.phone && !/^\d{10}$/.test(employeeFormData.phone.trim())) {
            toast.error("Số điện thoại (nếu có) phải có độ dài chính xác 10 chữ số");
            return;
        }

        const payload = {
            surname: employeeFormData.surname.trim(),
            midname: employeeFormData.midname.trim(),
            firstname: employeeFormData.firstname.trim(),
            dob: employeeFormData.birth_date || null,
            gender: employeeFormData.sex,
            cardId: employeeFormData.cccd,
            cardIdDate: employeeFormData.cardIdDate || null,
            cardIdPlace: employeeFormData.cardIdPlace || null,
            phone: employeeFormData.phone,
            ethnic: employeeFormData.ethnic || null,
            provId: employeeFormData.provId || null,
            villId: employeeFormData.villId || null,
            address: employeeFormData.address,
            note: employeeFormData.note
        };

        try {
            toast.loading(employeeFormMode === 'ADD' ? "Đang thêm nhân viên..." : "Đang cập nhật thông tin...");
            let res;
            if (employeeFormMode === 'ADD' && selectedContract) {
                res = await healthCheckService.createEmployee({
                    contractId: selectedContract.id,
                    ...payload
                });
            } else if (selectedEmployeeForEdit) {
                res = await healthCheckService.updateEmployee(parseInt(selectedEmployeeForEdit.id, 10), payload);
            }
            
            toast.dismiss();
            if (res && res.success) {
                toast.success(employeeFormMode === 'ADD' ? "Thêm nhân viên thành công!" : "Cập nhật nhân viên thành công!");
                setIsEmployeeEditOpen(false);
                if (selectedContract) {
                    loadEmployees(selectedContract.id);
                    loadContracts();
                }
            } else {
                toast.error(res?.message || "Thao tác thất bại!");
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Lỗi hệ thống");
        }
    };

    const [isImportHisModalOpen, setIsImportHisModalOpen] = useState(false);
    const [importHisDocsText, setImportHisDocsText] = useState('');
    const [importHisAutoSync, setImportHisAutoSync] = useState(true);
    const [isImportingHisDocs, setIsImportingHisDocs] = useState(false);

    const handleImportHisDocsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContract) return;

        const docNos = importHisDocsText
            .split(/[\s,;\n\r]+/)
            .map(s => s.trim())
            .filter(s => /^\d+$/.test(s));

        if (docNos.length === 0) {
            toast.error("Vui lòng nhập ít nhất một số hồ sơ HIS hợp lệ (chữ số)!");
            return;
        }

        setIsImportingHisDocs(true);
        const toastId = toast.loading(`Đang kiểm tra và nhập ${docNos.length} hồ sơ từ HIS vào gói khám...`);
        try {
            const res = await healthCheckService.importHisDocsToContract(selectedContract.id, docNos, importHisAutoSync);
            toast.dismiss(toastId);
            if (res.success) {
                toast.success(res.message || `Đã nhập thành công ${res.importedCount} hồ sơ!`);
                setIsImportHisModalOpen(false);
                setImportHisDocsText('');
                await loadEmployees(selectedContract.id);
                await loadContracts();
            } else {
                toast.error(res.message || "Nhập hồ sơ từ HIS thất bại!");
            }
        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error(err.response?.data?.message || err.message || "Lỗi hệ thống");
        } finally {
            setIsImportingHisDocs(false);
        }
    };

    const handleCancelReceptionEmployee = async (employee: Employee) => {
        if (!employee.doc_no) return;
        showConfirm(
            "Hủy tiếp nhận bệnh nhân",
            `Bạn có chắc chắn muốn HỦY TIẾP NHẬN cho bệnh nhân "${employee.name}" (Số hồ sơ: ${employee.doc_no})?\n\nToàn bộ chỉ định cận lâm sàng và hồ sơ HIS liên quan sẽ bị xóa!`,
            async () => {
                try {
                    toast.loading("Đang hủy tiếp nhận...");
                    const res = await healthCheckService.cancelReception({
                        employeeId: parseInt(employee.id, 10),
                        docNo: parseInt(employee.doc_no, 10)
                    });
                    toast.dismiss();
                    if (res.success) {
                        toast.success(res.message || "Hủy tiếp nhận thành công!");
                        if (selectedContract) {
                            loadEmployees(selectedContract.id);
                            loadContracts();
                        }
                    } else {
                        toast.error(res.message || "Hủy tiếp nhận thất bại!");
                    }
                } catch (err: any) {
                    toast.dismiss();
                    toast.error(err.response?.data?.message || err.message || "Lỗi hệ thống");
                }
            }
        );
    };

    const handleDeleteEmployeeClick = async (employee: Employee) => {
        showConfirm(
            "Xác nhận xóa nhân viên",
            `Bạn có chắc chắn muốn xóa nhân viên ${employee.name} (${employee.code || employee.id}) khỏi gói khám này?`,
            async () => {
                try {
                    toast.loading("Đang kiểm tra và xóa nhân viên...");
                    const res = await healthCheckService.deleteEmployee(employee.id);
                    toast.dismiss();
                    if (res.success) {
                        toast.success(res.message || "Xóa nhân viên thành công!");
                        if (selectedContract) {
                            loadEmployees(selectedContract.id);
                            loadContracts();
                        }
                    } else {
                        toast.error(res.message || "Xóa nhân viên thất bại!");
                    }
                } catch (err: any) {
                    toast.dismiss();
                    const errData = err.response?.data;
                    if (errData?.isReceived) {
                        // Nhân viên đã tiếp đón -> hỏi người dùng có muốn force hủy tiếp nhận và xóa luôn không
                        showConfirm(
                            "Hủy tiếp nhận & Xóa nhân viên",
                            `Nhân viên ${employee.name} đã được tiếp đón (Số hồ sơ: ${errData.docNo || employee.doc_no}). Bạn có muốn HỦY TIẾP NHẬN và XÓA nhân viên này khỏi gói khám?`,
                            async () => {
                                try {
                                    toast.loading("Đang hủy tiếp nhận và xóa nhân viên...");
                                    const forceRes = await healthCheckService.deleteEmployee(employee.id, true);
                                    toast.dismiss();
                                    if (forceRes.success) {
                                        toast.success(forceRes.message || "Hủy tiếp nhận và xóa thành công!");
                                        if (selectedContract) {
                                            loadEmployees(selectedContract.id);
                                            loadContracts();
                                        }
                                    } else {
                                        toast.error(forceRes.message || "Xóa thất bại!");
                                    }
                                } catch (forceErr: any) {
                                    toast.dismiss();
                                    toast.error(forceErr.response?.data?.message || forceErr.message || "Lỗi hệ thống");
                                }
                            }
                        );
                    } else {
                        toast.error(errData?.message || errData?.error || err.message || "Lỗi hệ thống");
                    }
                }
            }
        );
    };

    const handleReceiveAllEmployees = async () => {
        if (!selectedContract) return;
        const unreceivedEmployees = employees.filter(e => !e.doc_no || e.doc_no === '0' || e.doc_no === '');
        if (unreceivedEmployees.length === 0) {
            toast.info("Tất cả nhân viên trong gói khám này đã được tiếp đón!");
            return;
        }

        showConfirm(
            "Tiếp đón toàn bộ nhân viên",
            `Bạn có chắc chắn muốn thực hiện tiếp đón và sinh số hồ sơ tự động cho toàn bộ ${unreceivedEmployees.length} nhân viên chưa tiếp đón trong gói [${selectedContract.name}]?`,
            async () => {
                setIsReceivingAll(true);
                const toastId = toast.loading(`Đang tiếp đón ${unreceivedEmployees.length} nhân viên...`);
                try {
                    const res = await healthCheckService.receiveAllContractEmployees(selectedContract.id);
                    toast.dismiss(toastId);
                    if (res.success) {
                        toast.success(res.message || `Đã tiếp đón thành công ${res.count} nhân viên!`);
                        await loadEmployees(selectedContract.id);
                        await loadContracts();
                    } else {
                        toast.error(res.message || "Tiếp đón hàng loạt thất bại!");
                    }
                } catch (err: any) {
                    toast.dismiss(toastId);
                    toast.error("Lỗi tiếp đón: " + (err.message || "Lỗi hệ thống"));
                } finally {
                    setIsReceivingAll(false);
                }
            }
        );
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'MA_KH',
            'HO_TEN',
            'GIOI_TINH',
            'NGAY_SINH',
            'MA_DAN_TOC',
            'MA_NGHE_NGHIEP',
            'MA_DOI_TUONG_KSK',
            'SO_CCCD',
            'NGAYCAP_CCCD',
            'NOICAP_CCCD',
            'NGUOI_GIAM_HO',
            'SO_CCCD_NGH',
            'DIA_CHI',
            'MATINH_CU_TRU',
            'MAXA_CU_TRU',
            'DIEN_THOAI',
            'BOPHAN',
            'CHUCVU',
            'NGUON_CHI_TRA',
            'GHICHU',
            // --- CÁC CỘT THỂ LỰC & SINH HIỆU (TÙY CHỌN) ---
            'CHIEU_CAO',
            'CAN_NANG',
            'HUYET_AP',
            'MACH',
            'NHIET_DO',
            'NHIP_THO',
            'THE_LUC',
            // --- CÁC CỘT CHUYÊN KHOA LÂM SÀNG (TÙY CHỌN) ---
            'NOI_KHOA',
            'NGOAI_KHOA',
            'DA_LIEU',
            'SAN_PHU_KHOA',
            'MAT',
            'TAI_MUI_HONG',
            'RANG_HAM_MAT',
            // --- CỘT PHÂN LOẠI & KẾT LUẬN (TÙY CHỌN) ---
            'PHAN_LOAI_SK',
            'KET_LUAN',
            'BENH_TAT_LUU_Y'
        ];

        const sampleRows = [
            [
                'NV001',
                'Nguyễn Văn An',
                'Nam',
                '15/05/1990',
                '1',
                '1471',
                '14',
                '037095000123',
                '20/10/2021',
                'Cục C06',
                '',
                '',
                '12 Láng Hạ, Ba Đình, Hà Nội',
                '01',
                '00001',
                '0912345678',
                'Phòng Kỹ thuật',
                'Lái xe / Kỹ sư',
                '9',
                'Khám sức khỏe định kỳ',
                170,
                68,
                '120/80',
                75,
                36.5,
                18,
                'Thể lực tốt',
                'Tim đều, phổi trong',
                'Bình thường',
                'Bình thường',
                '',
                'Mắt phải 10/10, Mắt trái 10/10',
                'Tai mũi họng bình thường',
                'Không sâu răng, không viêm lợi',
                'Loại 1',
                'Đủ sức khỏe làm việc',
                ''
            ],
            [
                'NV002',
                'Phạm Minh Thư',
                'Nữ',
                '22/08/1955',
                '1',
                '1539',
                '1',
                '038096000234',
                '15/12/2022',
                'Cục C06',
                '',
                '',
                '45 Nguyễn Trãi, Thanh Xuân, Hà Nội',
                '01',
                '00003',
                '0987654321',
                'Hội Người cao tuổi',
                'Hội viên',
                '9',
                'Khám sức khỏe người cao tuổi',
                156,
                52,
                '125/80',
                78,
                36.6,
                19,
                'Thể lực trung bình',
                'Tăng huyết áp độ 1 kiểm soát tốt',
                'Bình thường',
                'Da lão hóa theo tuổi',
                'Khám phụ khoa bình thường',
                'Lão thị hai mắt',
                'Thính lực giảm nhẹ',
                'Mất răng R36 đã phục hình',
                'Loại 3',
                'Đủ sức khỏe',
                'Theo dõi huyết áp định kỳ'
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
        
        ws['!cols'] = [
            { wch: 12 }, // MA_KH
            { wch: 22 }, // HO_TEN
            { wch: 10 }, // GIOI_TINH
            { wch: 14 }, // NGAY_SINH
            { wch: 12 }, // MA_DAN_TOC
            { wch: 18 }, // MA_NGHE_NGHIEP
            { wch: 20 }, // MA_DOI_TUONG_KSK
            { wch: 16 }, // SO_CCCD
            { wch: 14 }, // NGAYCAP_CCCD
            { wch: 16 }, // NOICAP_CCCD
            { wch: 20 }, // NGUOI_GIAM_HO
            { wch: 16 }, // SO_CCCD_NGH
            { wch: 30 }, // DIA_CHI
            { wch: 15 }, // MATINH_CU_TRU
            { wch: 15 }, // MAXA_CU_TRU
            { wch: 14 }, // DIEN_THOAI
            { wch: 18 }, // BOPHAN
            { wch: 18 }, // CHUCVU
            { wch: 18 }, // NGUON_CHI_TRA
            { wch: 25 }, // GHICHU
            { wch: 12 }, // CHIEU_CAO
            { wch: 12 }, // CAN_NANG
            { wch: 14 }, // HUYET_AP
            { wch: 10 }, // MACH
            { wch: 12 }, // NHIET_DO
            { wch: 12 }, // NHIP_THO
            { wch: 18 }, // THE_LUC
            { wch: 25 }, // NOI_KHOA
            { wch: 25 }, // NGOAI_KHOA
            { wch: 20 }, // DA_LIEU
            { wch: 25 }, // SAN_PHU_KHOA
            { wch: 25 }, // MAT
            { wch: 25 }, // TAI_MUI_HONG
            { wch: 25 }, // RANG_HAM_MAT
            { wch: 16 }, // PHAN_LOAI_SK
            { wch: 25 }, // KET_LUAN
            { wch: 25 }  // BENH_TAT_LUU_Y
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Nhan_Vien');

        // Sheet hướng dẫn và danh mục mã chuẩn
        const guideData = [
            ['HƯỚNG DẪN ĐIỀN FILE EXCEL DANH SÁCH KHÁM SỨC KHỎE'],
            [''],
            ['1. Cột bắt buộc (*):', 'HO_TEN (Họ và tên nhân viên/người khám)'],
            ['2. Cột MA_NGHE_NGHIEP:', 'Nhập mã nghề nghiệp theo danh mục (Ví dụ: 1539 - Không có nghề nghiệp cụ thể, 1471 - Lái xe, 824 - Lực lượng công an, 990 - Y tế...). Nếu để trống, hệ thống tự động gán mặc định là 1539.'],
            ['3. Cột MA_DOI_TUONG_KSK:', 'Nhập mã hoặc tên nhóm đối tượng KSK (Ví dụ: 1 - Người cao tuổi, 2 - Người khuyết tật, 14 - Người lao động không chính thức...). Nếu để trống, hệ thống tự động gán mặc định là 14.'],
            ['4. Cột GIOI_TINH:', 'Nhập "Nam" hoặc "Nữ" (hoặc M/F)'],
            ['5. Cột NGAY_SINH & NGAYCAP_CCCD:', 'Định dạng ngày/tháng/năm: DD/MM/YYYY (ví dụ: 15/05/1990)'],
            ['6. Cột SO_CCCD:', '12 chữ số căn cước công dân hoặc CMND 9 số'],
            ['7. Cột MATINH_CU_TRU & MAXA_CU_TRU:', 'Mã tỉnh/thành phố và mã xã/phường cư trú chuẩn theo danh mục hành chính'],
            ['8. Cột DIEN_THOAI:', 'Số điện thoại liên hệ (10 chữ số)'],
            [''],
            ['--- CÁC CỘT KẾT QUẢ KHÁM (TÙY CHỌN - ĐIỀN NẾU MUỐN IMPORT KẾT QUẢ CÓ SẴN) ---'],
            ['9. Thể lực & Sinh hiệu:', 'CHIEU_CAO (cm), CAN_NANG (kg), HUYET_AP (mmHg, vd: 120/80), MACH (lần/phút), NHIET_DO (°C), NHIP_THO (lần/phút), THE_LUC (vd: Thể lực tốt).'],
            ['10. Chuyên khoa lâm sàng:', 'NOI_KHOA, NGOAI_KHOA, DA_LIEU, SAN_PHU_KHOA (khám phụ khoa nếu là nữ), MAT (thị lực/bệnh mắt), TAI_MUI_HONG, RANG_HAM_MAT.'],
            ['11. Phân loại & Kết luận:', 'PHAN_LOAI_SK (Loại 1/2/3/4/5 hoặc 1, 2, 3, 4, 5 hoặc Loại I, II, III), KET_LUAN (vd: Đủ sức khỏe làm việc), BENH_TAT_LUU_Y (lời dặn bác sĩ).'],
            ['* Lưu ý:', 'Các cột kết quả khám là không bắt buộc. Nếu để trống, bác sĩ sẽ khám và nhập trên giao diện HIS sau. Nếu có dữ liệu, hệ thống tự động lưu vào KSK và đẩy thẳng vào HIS Core khi tiếp đón.'],
            [''],
            ['DANH MỤC MÃ ĐỐI TƯỢNG KHÁM SỨC KHỎE QUY CHUẨN (BỘ Y TẾ)'],
            ['Mã', 'Tên Đối Tượng KSK'],
            ['1', '1 - Người cao tuổi'],
            ['2', '2 - Người khuyết tật'],
            ['3', '3 - Người thuộc hộ nghèo, cận nghèo'],
            ['4', '4 - Người có công'],
            ['5', '5 - Người mắc bệnh mạn tính'],
            ['6', '6 - Người sống tại vùng đồng bào dân tộc thiểu số và miền núi'],
            ['7', '7 - Người sống tại vùng có điều kiện kinh tế - xã hội đặc biệt khó khăn'],
            ['8', '8 - Người sống tại xã đảo'],
            ['9', '9 - Người sống tại đặc khu'],
            ['10', '10 - Trẻ em trong cơ sở giáo dục mầm non'],
            ['11', '11 - Học sinh trong các cơ sở giáo dục phổ thông'],
            ['12', '12 - Sinh viên'],
            ['13', '13 - Người lao động'],
            ['14', '14 - Người lao động không chính thức (Mặc định)'],
            ['15', '15 - Người chưa có Bảo hiểm y tế'],
            ['16', '16 - Các đối tượng khác']
        ];
        const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
        wsGuide['!cols'] = [{ wch: 25 }, { wch: 95 }];
        XLSX.utils.book_append_sheet(wb, wsGuide, 'Huong_Dan_Va_Danh_Muc');

        XLSX.writeFile(wb, 'mau_import_nhan_vien_ksk.xlsx');
        toast.success("Đã tải file Excel mẫu thành công!");
    };

    const handleExportEmployeesReport = () => {
        if (!selectedContract) {
            toast.warning("Vui lòng chọn một hợp đồng trước khi xuất báo cáo!");
            return;
        }
        if (employees.length === 0) {
            toast.warning("Hợp đồng chưa có nhân viên nào để xuất báo cáo!");
            return;
        }

        const toastId = toast.loading("Đang tổng hợp báo cáo kết quả khám đoàn...");
        try {
            const headers = [
                'STT',
                'Mã nhân viên',
                'Họ và tên',
                'Giới tính',
                'Ngày sinh',
                'Số CCCD/CMND',
                'Số điện thoại',
                'Số hồ sơ HIS',
                'Trạng thái tiếp nhận',
                'Nguồn chi trả',
                'Chiều cao (cm)',
                'Cân nặng (kg)',
                'Huyết áp',
                'Mạch (l/p)',
                'Phân loại SK',
                'Kết luận sức khỏe',
                'Bệnh tật lưu ý / Lời dặn'
            ];

            const rows = employees.map((emp, index) => {
                const clinData = emp.clinical_data || {};
                const conclData = emp.conclusion_data || {};
                const exam = clinData.examination || {};

                return [
                    index + 1,
                    emp.code || emp.id || '',
                    emp.name || '',
                    emp.sex || '',
                    emp.birth_date ? formatDate(emp.birth_date) : '',
                    emp.doc_no || emp.cccd || '',
                    emp.phone || '',
                    emp.doc_no && emp.doc_no !== '0' ? emp.doc_no : '',
                    emp.doc_no && emp.doc_no !== '0' ? 'Đã tiếp nhận' : 'Chưa tiếp nhận',
                    emp.funding_source || emp.nguon_chi_tra || '',
                    emp.height || exam.height || '',
                    emp.weight || exam.weight || '',
                    emp.blood_pressure || exam.blood_pressure || '',
                    emp.pulse || exam.pulse || '',
                    emp.conclusion || conclData.fitness_class || '',
                    emp.comment || conclData.diagnosis || '',
                    conclData.cac_van_de_luu_y || ''
                ];
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

            // Căn chỉnh độ rộng cột
            ws['!cols'] = [
                { wch: 6 },  // STT
                { wch: 14 }, // Mã NV
                { wch: 24 }, // Họ tên
                { wch: 10 }, // Giới tính
                { wch: 12 }, // Ngày sinh
                { wch: 16 }, // CCCD
                { wch: 14 }, // SĐT
                { wch: 14 }, // Số HS
                { wch: 16 }, // Trạng thái
                { wch: 14 }, // Nguồn chi
                { wch: 12 }, // Cao
                { wch: 12 }, // Nặng
                { wch: 12 }, // Huyết áp
                { wch: 10 }, // Mạch
                { wch: 14 }, // Phân loại
                { wch: 30 }, // Kết luận
                { wch: 35 }  // Ghi chú
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Doan_KSK");
            const safeCode = (selectedContract.code || `HD_${selectedContract.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            XLSX.writeFile(wb, `Bao_cao_tong_ket_KSK_${safeCode}_${getLocalDateString()}.xlsx`);
            toast.success("Xuất file báo cáo kết quả khám đoàn thành công!", { id: toastId });
        } catch (err: any) {
            console.error("Lỗi xuất báo cáo:", err);
            toast.error(`Lỗi xuất file Excel: ${err.message}`, { id: toastId });
        }
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContract) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const dataArray = evt.target?.result;
                if (!dataArray) return;
                
                const wb = XLSX.read(dataArray, { type: 'array' });
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
                              .replace(/Đ/g, 'd')
                              .replace(/[_\-\s]+/g, ' ')
                              .trim()
                              .toLowerCase();
                };

                const parseNum = (val: any): number | null => {
                    if (val === undefined || val === null || val === '') return null;
                    const s = String(val).replace(',', '.').trim();
                    const n = parseFloat(s);
                    return isNaN(n) ? null : n;
                };

                const formatExcelDate = (val: any): string => {
                    if (val === undefined || val === null || val === '') return '';
                    if (typeof val === 'number') {
                        const parsed = new Date(Math.round((val - 25569) * 86400 * 1000));
                        if (!isNaN(parsed.getTime())) {
                            const y = parsed.getFullYear();
                            const m = String(parsed.getMonth() + 1).padStart(2, '0');
                            const d = String(parsed.getDate()).padStart(2, '0');
                            return `${d}/${m}/${y}`;
                        }
                    }
                    const s = String(val).trim();
                    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
                        const parts = s.split('T')[0].split('-');
                        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                    }
                    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                    if (dmy) {
                        return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
                    }
                    if (/^\d{4}$/.test(s)) {
                        return `01/01/${s}`;
                    }
                    return s;
                };

                const sanitizeCccd = (val: any): string => {
                    if (val === undefined || val === null) return '';
                    return String(val).replace(/\D/g, '').slice(0, 12);
                };

                const sanitizePhone = (val: any): string => {
                    if (val === undefined || val === null) return '';
                    let p = String(val).replace(/\D/g, '');
                    if (p.startsWith('84') && (p.length === 11 || p.length === 12)) {
                        p = '0' + p.slice(2);
                    } else if (p.length === 9) {
                        p = '0' + p;
                    }
                    return p.slice(0, 10);
                };

                const rawHeaders = data[0].map(h => removeAccents(String(h || '')));
                const compactHeaders = rawHeaders.map(h => h.replace(/\s+/g, ''));
                
                // Thuật toán tìm tiêu đề cột chính xác tuyệt đối, chống xung đột chuỗi con nguy hiểm
                const findHeaderIdx = (exactPatterns: string[], fallbackSubstrings: string[] = []) => {
                    // 1. Ưu tiên so khớp chính xác 100%
                    const exactIdx = compactHeaders.findIndex(h => exactPatterns.includes(h));
                    if (exactIdx !== -1) return exactIdx;
                    
                    // 2. Thử so khớp tiền tố (prefix) với từ khóa có nghĩa dài >= 4 ký tự
                    const prefixIdx = compactHeaders.findIndex(h => exactPatterns.some(p => p.length >= 4 && h.startsWith(p)));
                    if (prefixIdx !== -1) return prefixIdx;
                    
                    // 3. Thử từ khóa phụ trợ an toàn (độ dài >= 4 ký tự để tránh nhầm lẫn)
                    if (fallbackSubstrings.length > 0) {
                        return compactHeaders.findIndex(h => fallbackSubstrings.some(fb => fb.length >= 4 && h.includes(fb)));
                    }
                    return -1;
                };

                const nameIdx = findHeaderIdx(['hoten', 'ten', 'fullname', 'name', 'hovaten'], ['hovaten']);
                const dobIdx = findHeaderIdx(['ngaysinh', 'dob', 'dateofbirth', 'birthdate', 'sinhngay'], ['ngaysinh']);
                const sexIdx = findHeaderIdx(['gioitinh', 'gioi', 'sex', 'gender', 'namnu']);
                const docIdx = findHeaderIdx(['socccd', 'cccd', 'socmnd', 'cmnd', 'cancuoc', 'cmndcccd', 'soid']);
                const cardDateIdx = findHeaderIdx(['ngaycapcccd', 'ngaycap', 'cardiddate', 'issuedate', 'dateofissue', 'ngaycapcmnd']);
                const cardPlaceIdx = findHeaderIdx(['noicapcccd', 'noicap', 'cardidplace', 'placeofissue', 'noicapcmnd']);
                const guardianNameIdx = findHeaderIdx(['nguoigiamho', 'giamho', 'guardianname', 'hotennguoigiamho']);
                const guardianCccdIdx = findHeaderIdx(['socccdngh', 'cccdngh', 'guardiancccd', 'cccdgiamho', 'socccdnguoigiamho']);
                const ethnicIdx = findHeaderIdx(['madantoc', 'dantoc', 'ethnic', 'ethnicity']);
                const occIdx = findHeaderIdx(['manghenghiep', 'nghenghiep', 'occupation', 'job', 'chucdanh', 'nghenghiepchucvu']);
                const tgIdx = findHeaderIdx(['madoituongksk', 'doituongksk', 'madoituong', 'doituong', 'targetgroup', 'target_group']);
                const maKhIdx = findHeaderIdx(['makh', 'manhanvien', 'manv', 'code', 'empcode', 'employeecode']);

                const addrIdx = findHeaderIdx(['diachi', 'noio', 'address', 'choo', 'thuongtru', 'diachithuongtru'], ['diachi']);
                const provIdx = findHeaderIdx(['matinhcutru', 'matinh', 'tinh', 'province', 'prov', 'thanhpho', 'tinhthanh']);
                const distIdx = findHeaderIdx(['mahuyencutru', 'mahuyen', 'huyen', 'quan', 'district', 'quanhuyen']);
                const wardIdx = findHeaderIdx(['maxacutru', 'maxa', 'xa', 'phuong', 'ward', 'vill', 'xaphuong']);
                const phoneIdx = findHeaderIdx(['dienthoai', 'sdt', 'phone', 'telephone', 'sodienthoai', 'mobile']);
                const fundingIdx = findHeaderIdx(['nguonchitra', 'nguonchi', 'fundingsource', 'funding', 'nguon_chi_tra']);
                const deptIdx = findHeaderIdx(['bophan', 'phongban', 'dept', 'khoaphong', 'department']);
                const posIdx = findHeaderIdx(['chucvu', 'vitri', 'position']);
                const ownerIdx = findHeaderIdx(['banthan', 'owner']);
                const noteIdx = findHeaderIdx(['ghichu', 'note', 'ghichukhac']);

                // Thể lực & sinh hiệu
                const heightIdx = findHeaderIdx(['chieucao', 'height', 'cao']);
                const weightIdx = findHeaderIdx(['cannang', 'weight', 'nang']);
                const bpIdx = findHeaderIdx(['huyetap', 'bloodpressure', 'ha', 'bp', 'huyetapmmhg']);
                const pulseIdx = findHeaderIdx(['mach', 'pulse', 'nhipmach', 'nhiptim']);
                const tempIdx = findHeaderIdx(['nhietdo', 'temperature', 'thannhiet', 'temp']);
                const respIdx = findHeaderIdx(['nhiptho', 'respiration', 'breathingrate', 'resp']);
                const theLucIdx = findHeaderIdx(['theluc', 'thetrang', 'physical', 'toantrang', 'khamtheluc', 'thelucsuckhoe']);

                // Khám lâm sàng chuyên khoa (TUYỆT ĐỐI không dùng chuỗi con 2-3 ký tự như 'ent', 'noi', 'mat', 'da', 'tho')
                const noiKhoaIdx = findHeaderIdx(['noikhoa', 'khamnoikhoa', 'internal', 'noikhoatongquat', 'chuyenkhoanoikhoa'], ['noikhoa']);
                const ngoaiKhoaIdx = findHeaderIdx(['ngoaikhoa', 'khamngoaikhoa', 'surgery', 'ngoaitongquat', 'external', 'chuyenkhoangoaikhoa'], ['ngoaikhoa']);
                const daLieuIdx = findHeaderIdx(['dalieu', 'khamdalieu', 'dermatology', 'chuyenkhoadalieu'], ['dalieu']);
                const phuKhoaIdx = findHeaderIdx(['sanphukhoa', 'khamsanphukhoa', 'phukhoa', 'khamphukhoa', 'gynecology', 'obgyn'], ['phukhoa', 'sanphukhoa']);
                const matIdx = findHeaderIdx(['mat', 'khammat', 'chuyenkhoamat', 'eye', 'nhankhoa', 'khamnhankhoa', 'thiluc'], ['chuyenkhoamat', 'khammat']);
                const tmhIdx = findHeaderIdx(['taimuihong', 'khamtaimuihong', 'chuyenkhoataimuihong', 'chuyenkhoatmh', 'tmh', 'ent'], ['taimuihong']);
                const rhmIdx = findHeaderIdx(['ranghammat', 'khamranghammat', 'chuyenkhoaranghammat', 'chuyenkhoarhm', 'rhm', 'dental'], ['ranghammat']);

                // Phân loại & kết luận
                const phanLoaiIdx = findHeaderIdx(['phanloaisk', 'phanloai', 'loaisuckhoe', 'xeploai', 'xeploaisk', 'fitnessclass', 'phanloaisuckhoe']);
                const ketLuanIdx = findHeaderIdx(['ketluan', 'conclusion', 'ketluansuckhoe', 'danhgia', 'ketluanchung']);
                const ghiChuBslxIdx = findHeaderIdx(['benhtatluuy', 'cacvanbeluuy', 'cacvanlyuy', 'luuy', 'benhtat', 'remark', 'comment', 'ghichubs', 'ghichubacsi', 'loidancuabacsi', 'loidan']);

                if (nameIdx === -1) {
                    toast.error("Không tìm thấy cột 'Họ và tên' trong file!");
                    return;
                }

                const cleanField = (val: any) => {
                    if (val === undefined || val === null) return '';
                    const s = String(val).trim();
                    return s === 'undefined' || s === 'null' ? '' : s;
                };

                let clinicalCountInFile = 0;
                const parsedEmployees = [];
                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0 || !row[nameIdx]) continue;

                    let docNo = docIdx !== -1 ? sanitizeCccd(row[docIdx]) : '';
                    let phone = phoneIdx !== -1 ? sanitizePhone(row[phoneIdx]) : '';
                    let guardianCccd = guardianCccdIdx !== -1 ? sanitizeCccd(row[guardianCccdIdx]) : '';
                    let maKh = maKhIdx !== -1 && row[maKhIdx] ? String(row[maKhIdx] ?? '').trim().slice(0, 30) : '';
                    let birthDate = dobIdx !== -1 ? formatExcelDate(row[dobIdx]) : '';
                    let cardIdDate = cardDateIdx !== -1 ? formatExcelDate(row[cardDateIdx]) : '';
                    let cardIdPlace = cardPlaceIdx !== -1 ? cleanField(row[cardPlaceIdx]).slice(0, 100) : '';
                    let rawOcc = occIdx !== -1 ? cleanField(row[occIdx]) : '';
                    let rawTg = tgIdx !== -1 ? cleanField(row[tgIdx]) : '';
                    let fundingSource = fundingIdx !== -1 ? cleanField(row[fundingIdx]) : '9';

                    const hVal = heightIdx !== -1 ? parseNum(row[heightIdx]) : null;
                    const wVal = weightIdx !== -1 ? parseNum(row[weightIdx]) : null;
                    const bpVal = bpIdx !== -1 ? cleanField(row[bpIdx]).slice(0, 20) : '';
                    const pulseVal = pulseIdx !== -1 ? parseNum(row[pulseIdx]) : null;
                    const tempVal = tempIdx !== -1 ? parseNum(row[tempIdx]) : null;
                    const respVal = respIdx !== -1 ? parseNum(row[respIdx]) : null;
                    const theLucVal = theLucIdx !== -1 ? cleanField(row[theLucIdx]).slice(0, 254) : '';

                    const noiVal = noiKhoaIdx !== -1 ? cleanField(row[noiKhoaIdx]).slice(0, 254) : '';
                    const ngoaiVal = ngoaiKhoaIdx !== -1 ? cleanField(row[ngoaiKhoaIdx]).slice(0, 254) : '';
                    const daLieuVal = daLieuIdx !== -1 ? cleanField(row[daLieuIdx]).slice(0, 254) : '';
                    const phuKhoaVal = phuKhoaIdx !== -1 ? cleanField(row[phuKhoaIdx]).slice(0, 254) : '';
                    const matVal = matIdx !== -1 ? cleanField(row[matIdx]).slice(0, 100) : '';
                    const tmhVal = tmhIdx !== -1 ? cleanField(row[tmhIdx]).slice(0, 254) : '';
                    const rhmVal = rhmIdx !== -1 ? cleanField(row[rhmIdx]).slice(0, 254) : '';

                    const phanLoaiVal = phanLoaiIdx !== -1 ? cleanField(row[phanLoaiIdx]) : '';
                    const ketLuanVal = ketLuanIdx !== -1 ? cleanField(row[ketLuanIdx]).slice(0, 254) : '';
                    const benhTatVal = ghiChuBslxIdx !== -1 ? cleanField(row[ghiChuBslxIdx]).slice(0, 254) : '';

                    if (hVal || wVal || bpVal || pulseVal || tempVal || respVal || theLucVal || noiVal || ngoaiVal || daLieuVal || phuKhoaVal || matVal || tmhVal || rhmVal || phanLoaiVal || ketLuanVal) {
                        clinicalCountInFile++;
                    }

                    parsedEmployees.push({
                        code: maKh,
                        name: String(row[nameIdx]).replace(/\s+/g, ' ').trim(),
                        birth_date: birthDate,
                        sex: sexIdx !== -1 ? (cleanField(row[sexIdx]) === 'Nữ' || cleanField(row[sexIdx]) === 'F' ? 'Nữ' : 'Nam') : 'Nam',
                        doc_no: docNo,
                        phone: phone,
                        note: noteIdx !== -1 ? cleanField(row[noteIdx]).slice(0, 255) : '',
                        funding_source: fundingSource || '9',
                        nguon_chi_tra: fundingSource || '9',
                        dept: deptIdx !== -1 ? cleanField(row[deptIdx]).slice(0, 100) : '',
                        position: posIdx !== -1 ? cleanField(row[posIdx]).slice(0, 100) : '',
                        owner: ownerIdx !== -1 ? cleanField(row[ownerIdx]) : '',
                        detail_address: addrIdx !== -1 ? cleanField(row[addrIdx]).slice(0, 255) : '',
                        province_code: provIdx !== -1 ? cleanField(row[provIdx]) : '',
                        province_id: provIdx !== -1 ? cleanField(row[provIdx]) : null,
                        district_id: distIdx !== -1 ? parseInt(cleanField(row[distIdx]), 10) || null : null,
                        ward_code: wardIdx !== -1 ? cleanField(row[wardIdx]) : '',
                        ward_id: wardIdx !== -1 ? cleanField(row[wardIdx]) : null,
                        cardid_date: cardIdDate,
                        cardid_place: cardIdPlace,
                        guardian_name: guardianNameIdx !== -1 ? cleanField(row[guardianNameIdx]).slice(0, 100) : '',
                        guardian_cccd: guardianCccd,
                        ethnic: ethnicIdx !== -1 ? cleanField(row[ethnicIdx]) : '',
                        occupation: rawOcc,
                        ma_nghe_nghiep: rawOcc,
                        target_group: rawTg,
                        doi_tuong_ksk: rawTg,
                        // Thể lực & sinh hiệu
                        height: hVal,
                        weight: wVal,
                        blood_pressure: bpVal,
                        pulse: pulseVal,
                        temperature: tempVal,
                        respiration: respVal,
                        the_luc: theLucVal,
                        // Chuyên khoa lâm sàng
                        noi_khoa: noiVal,
                        ngoai_khoa: ngoaiVal,
                        da_lieu: daLieuVal,
                        san_phu_khoa: phuKhoaVal,
                        mat: matVal,
                        tai_mui_hong: tmhVal,
                        rang_ham_mat: rhmVal,
                        // Phân loại & kết luận
                        phan_loai_sk: phanLoaiVal,
                        ket_luan: ketLuanVal,
                        benh_tat_luu_y: benhTatVal
                    });
                }

                if (parsedEmployees.length === 0) {
                    toast.error("Không parse được nhân viên nào hợp lệ!");
                    return;
                }

                // Kiểm tra trùng lặp trong file
                const dupCodes = new Set<string>();
                const dupCccds = new Set<string>();
                const dupNames = new Set<string>();
                const duplicatesInFile: string[] = [];

                parsedEmployees.forEach((emp, idx) => {
                    const rowNum = idx + 2;

                    if (emp.code) {
                        if (dupCodes.has(emp.code)) {
                            duplicatesInFile.push(`Trùng Mã KH '${emp.code}' ở dòng ${rowNum} (${emp.name})`);
                        } else {
                            dupCodes.add(emp.code);
                        }
                    }

                    if (emp.doc_no) {
                        if (dupCccds.has(emp.doc_no)) {
                            duplicatesInFile.push(`Trùng CCCD '${emp.doc_no}' ở dòng ${rowNum} (${emp.name})`);
                        } else {
                            dupCccds.add(emp.doc_no);
                        }
                    }

                    // Nếu có CCCD thì kiểm tra Họ tên + Ngày sinh + CCCD để không chặn 2 người trùng tên, ngày sinh nhưng khác CCCD
                    const nameKey = emp.doc_no 
                        ? `${emp.name.toLowerCase()}_${emp.birth_date}_${emp.doc_no}` 
                        : `${emp.name.toLowerCase()}_${emp.birth_date}`;
                    if (dupNames.has(nameKey)) {
                        duplicatesInFile.push(`Trùng lặp Họ tên & Ngày sinh '${emp.name} - ${emp.birth_date}' ở dòng ${rowNum}`);
                    } else {
                        dupNames.add(nameKey);
                    }
                });

                if (duplicatesInFile.length > 0) {
                    toast.error(
                        <div>
                            <div className="font-bold text-red-650 dark:text-red-400 mb-1.5 text-xs uppercase tracking-wider">Phát hiện trùng lặp dữ liệu trong file Excel:</div>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] max-h-40 overflow-y-auto">
                                {duplicatesInFile.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {duplicatesInFile.length > 5 && <li>...và {duplicatesInFile.length - 5} dòng trùng lặp khác.</li>}
                            </ul>
                            <div className="mt-2 text-[10px] text-slate-500 italic">Vui lòng sửa các dòng trùng trước khi import.</div>
                        </div>,
                        { duration: 8000 }
                    );
                    return;
                }

                toast.loading("Đang import danh sách nhân viên...");
                const res = await healthCheckService.importEmployees(selectedContract.id, parsedEmployees);
                toast.dismiss();
                
                if (res.success) {
                    toast.success(
                        `Import thành công ${res.count} nhân viên${clinicalCountInFile > 0 ? ` (kèm ${clinicalCountInFile} hồ sơ có KQ khám lâm sàng)` : ''}!`
                    );
                    loadContracts();
                    loadEmployees(selectedContract.id);
                } else {
                    toast.error("Import thất bại!");
                }
            } catch (err: any) {
                toast.dismiss();
                toast.error(err.message || "Lỗi import file Excel");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleCleanupTrash = () => {
        if (!selectedContract) return;
        const unreceivedEmps = employees.filter(e => !e.doc_no || e.doc_no === '0');
        if (unreceivedEmps.length === 0) {
            toast.info("Không có bệnh nhân chưa tiếp nhận nào trong hợp đồng này.");
            return;
        }

        showConfirm(
            "Xác nhận xóa dữ liệu rác",
            `Bạn có chắc chắn muốn xóa toàn bộ ${unreceivedEmps.length} bệnh nhân chưa tiếp nhận (chưa có số hồ sơ) trong hợp đồng "${selectedContract.name}" không? Thao tác này sẽ không ảnh hưởng đến các bệnh nhân đã tiếp nhận.`,
            async () => {
                try {
                    toast.loading("Đang xóa dữ liệu rác...");
                    const res = await healthCheckService.cleanupUnreceivedEmployees(selectedContract.id);
                    toast.dismiss();
                    if (res.success) {
                        toast.success(res.message || "Đã xóa dữ liệu rác thành công!");
                        await loadEmployees(selectedContract.id);
                        await loadContracts();
                    } else {
                        toast.error(res.message || "Xóa dữ liệu rác thất bại!");
                    }
                } catch (err: any) {
                    toast.dismiss();
                    toast.error(err.message || "Lỗi hệ thống khi xóa dữ liệu rác");
                }
            }
        );
    };

    const handleExecuteSyncCls = async () => {
        if (!selectedContract) return;
        const receivedCount = employees.filter(e => !!e.doc_no && e.doc_no !== '0').length;
        if (receivedCount === 0) {
            toast.info("Không có bệnh nhân nào đã tiếp nhận trong hợp đồng này.");
            return;
        }

        try {
            setIsSyncingCls(true);
            toast.loading("Đang đồng bộ kết quả CLS từ HIS sang KSK...");
            const res = await healthCheckService.syncContractParaclinicalResults(selectedContract.id, { mode: syncClsMode });
            toast.dismiss();

            if (res.success) {
                if (res.stats?.updatedCount === 0 && res.stats?.skippedNoHisResults > 0) {
                    toast.warning(res.message || "Không có kết quả CLS mới nào trên HIS để đồng bộ!");
                } else {
                    toast.success(res.message || "Đã đồng bộ kết quả CLS thành công!");
                }
                setIsSyncClsModalOpen(false);
                await loadEmployees(selectedContract.id);
                await loadContracts();
            } else {
                toast.error(res.message || "Đồng bộ kết quả CLS thất bại!");
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Lỗi hệ thống khi đồng bộ kết quả CLS từ HIS");
        } finally {
            setIsSyncingCls(false);
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
                    {/* Header Row: Contract Title & High-level Status */}
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/80 flex flex-wrap justify-between items-center bg-gradient-to-r from-rose-50/60 via-slate-50/40 to-transparent dark:from-rose-950/20 dark:via-slate-900/40 dark:to-transparent gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="p-1.5 bg-rose-100/80 dark:bg-rose-950/60 rounded-lg text-[#9f1239] dark:text-rose-300 shrink-0">
                                <UserGroupIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={selectedContract?.name}>
                                        {selectedContract ? selectedContract.name : 'Chưa chọn hợp đồng'}
                                    </h3>
                                    {selectedContract && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0 ${
                                            selectedContract.status === 'A'
                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        }`}>
                                            {selectedContract.status === 'A' ? 'Đã chốt duyệt' : 'Đang xử lý'}
                                        </span>
                                    )}
                                </div>
                                {selectedContract && (
                                    <div className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                        <span>Mã HĐ: <strong className="text-slate-600 dark:text-slate-300">{selectedContract.code || '---'}</strong></span>
                                        <span>•</span>
                                        <span>Tổng: <strong className="text-slate-600 dark:text-slate-300">{employees.length}</strong> NV</span>
                                        <span>•</span>
                                        <span>Đã tiếp đón: <strong className="text-teal-600 dark:text-teal-400">{employees.filter(e => !!e.doc_no && e.doc_no !== '0').length}</strong></span>
                                        <span>•</span>
                                        <span>Có KQ CLS: <strong className="text-emerald-600 dark:text-emerald-400">{employees.filter(e => !!e.has_cls_result).length}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedContract && (
                            <button
                                onClick={() => handleToggleContractStatus(selectedContract)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 ${
                                    selectedContract.status === 'A'
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                            >
                                {selectedContract.status === 'A' ? (
                                    <>
                                        <LockIcon className="w-3.5 h-3.5" />
                                        Mở khóa gói
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                                        Duyệt chốt gói
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Tabs row & Action Toolbar */}
                    {selectedContract && (
                        <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 px-5 py-2 gap-3">
                            {/* Left: Navigation Tabs */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setActiveTab('employees')}
                                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                        activeTab === 'employees'
                                            ? 'bg-white dark:bg-slate-800 text-[#9f1239] dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <span>DS Nhân viên</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        activeTab === 'employees' 
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {employees.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('services')}
                                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                        activeTab === 'services'
                                            ? 'bg-white dark:bg-slate-800 text-[#9f1239] dark:text-rose-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <span>Gói dịch vụ</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        activeTab === 'services' 
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {services.length}
                                    </span>
                                </button>
                            </div>

                            {/* Right: Contextual Toolbar */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {activeTab === 'employees' && selectedContract.status !== 'A' && (
                                    <>
                                        {/* Group: Excel operations */}
                                        <div className="flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm">
                                            <button
                                                onClick={handleDownloadTemplate}
                                                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-[#0f766e] dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                title="Tải file Excel mẫu 17 cột chuẩn QĐ 1551"
                                            >
                                                <DownloadIcon className="w-3.5 h-3.5 text-[#0f766e] dark:text-teal-400" />
                                                Tải file mẫu
                                            </button>
                                            <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                                            <label className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-[#0f766e] dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap">
                                                <CloudUploadIcon className="w-3.5 h-3.5 text-[#0f766e] dark:text-teal-400" />
                                                Nhập Excel
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls"
                                                    onChange={handleImportExcel}
                                                    className="hidden"
                                                />
                                            </label>
                                            <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                                            <button
                                                onClick={handleExportEmployeesReport}
                                                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                title="Xuất file Excel tổng hợp kết quả khám đoàn cho doanh nghiệp"
                                            >
                                                <DownloadIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                Xuất báo cáo
                                            </button>
                                        </div>

                                        {/* Nhập HS từ HIS Button */}
                                        <button
                                            onClick={() => setIsImportHisModalOpen(true)}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                                            title="Nhập số hồ sơ bệnh nhân từ HIS vào gói khám này"
                                        >
                                            <CloudUploadIcon className="w-3.5 h-3.5" />
                                            Nhập HS từ HIS
                                        </button>

                                        {/* Add Employee Button */}
                                        <button
                                            onClick={handleAddNewEmployeeClick}
                                            className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            Thêm nhân viên
                                        </button>

                                        {/* Đồng bộ kết quả CLS Button */}
                                        <button
                                            onClick={() => setIsSyncClsModalOpen(true)}
                                            disabled={isSyncingCls || !employees.some(e => !!e.doc_no && e.doc_no !== '0')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer ${
                                                employees.some(e => !!e.doc_no && e.doc_no !== '0')
                                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/20'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                                            }`}
                                            title="Đồng bộ tất cả kết quả Xét nghiệm (LIS), Chẩn đoán hình ảnh & Siêu âm (PACS) từ HIS sang hồ sơ KSK"
                                        >
                                            {isSyncingCls ? (
                                                <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                                            )}
                                            <span>
                                                {isSyncingCls ? 'Đang đồng bộ CLS...' : 'Đồng bộ kết quả CLS'}
                                            </span>
                                        </button>

                                        {/* Clean Trash Button */}
                                        {employees.some(e => !e.doc_no || e.doc_no === '0') && (
                                            <button
                                                onClick={handleCleanupTrash}
                                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer"
                                                title="Xóa toàn bộ các bệnh nhân chưa tiếp nhận (chưa có số hồ sơ) trong hợp đồng này"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5 text-rose-600" />
                                                <span>Xóa dữ liệu rác ({employees.filter(e => !e.doc_no || e.doc_no === '0').length})</span>
                                            </button>
                                        )}

                                        {/* Bulk Reception Button */}
                                        <button
                                            onClick={handleReceiveAllEmployees}
                                            disabled={isReceivingAll || employees.every(e => !!e.doc_no && e.doc_no !== '0')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer ${
                                                employees.some(e => !e.doc_no || e.doc_no === '0')
                                                    ? 'bg-[#9f1239] hover:bg-[#881337] text-white shadow-rose-900/20 ring-1 ring-rose-700/50'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                                            }`}
                                            title="Duyệt tiếp đón và sinh số hồ sơ HIS tự động cho toàn bộ nhân viên chưa tiếp đón"
                                        >
                                            {isReceivingAll ? (
                                                <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                            )}
                                            <span>
                                                {isReceivingAll 
                                                    ? 'Đang tiếp đón...' 
                                                    : `Tiếp đón tất cả${employees.filter(e => !e.doc_no || e.doc_no === '0').length > 0 ? ` (${employees.filter(e => !e.doc_no || e.doc_no === '0').length})` : ''}`
                                                }
                                            </span>
                                        </button>
                                    </>
                                )}

                                {activeTab === 'services' && selectedContract.status !== 'A' && (
                                    <button
                                        onClick={() => setIsServiceModalOpen(true)}
                                        className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" />
                                        Thêm dịch vụ
                                    </button>
                                )}
                            </div>
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
                                            <th className="p-3 w-28 text-center">Kết quả CLS</th>
                                            <th className="p-3 w-28 text-center">Khám lâm sàng</th>
                                            <th className="p-3 w-24 text-center">Nguồn chi</th>
                                            <th className="p-3 w-28 text-center">SĐT</th>
                                            <th className="p-3 w-32 text-center">VNeID Sync</th>
                                            {selectedContract?.status !== 'A' && (
                                                <th className="p-3 w-24 text-center">Tác vụ</th>
                                            )}
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
                                                <td className="p-3 text-center">
                                                    {e.doc_no && e.doc_no !== '0' ? (
                                                        e.has_cls_result ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200/60">
                                                                <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                                                                Đã có KQ
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200/60">
                                                                <AlertCircleIcon className="w-3 h-3 text-amber-600" />
                                                                Chưa có KQ
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {e.has_clinical_data ? (
                                                        <span 
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200/60 cursor-help"
                                                            title={`Thể lực: ${e.height ? e.height + ' cm' : '-'} / ${e.weight ? e.weight + ' kg' : '-'} | HA: ${e.blood_pressure || '-'}\nKết luận: ${e.conclusion || '-'}${e.comment ? `\nLưu ý: ${e.comment}` : ''}`}
                                                        >
                                                            <CheckCircleIcon className="w-3 h-3 text-blue-600" />
                                                            Đã có KQ
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold text-[10px] border border-slate-200/50">
                                                            Chưa có
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                                        {e.funding_source || e.nguon_chi_tra || '9'}
                                                    </span>
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
                                                {selectedContract?.status !== 'A' && (
                                                    <td className="p-3 text-center">
                                                        <div className="flex justify-center items-center gap-1.5">
                                                            {e.doc_no && e.doc_no !== '0' && (
                                                                <button
                                                                    onClick={() => handleCancelReceptionEmployee(e)}
                                                                    className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 rounded-lg text-amber-700 dark:text-amber-300 transition cursor-pointer"
                                                                    title="Hủy tiếp nhận (Xóa HS và CLS trên HIS)"
                                                                >
                                                                    <RefreshIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleEditEmployeeClick(e)}
                                                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 transition cursor-pointer"
                                                                title="Sửa thông tin nhân viên"
                                                            >
                                                                <PencilIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEmployeeClick(e)}
                                                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 transition cursor-pointer"
                                                                title="Xóa nhân viên"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
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
                                                    <th className="p-3 w-28 text-center">Độ tuổi</th>
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
                                                        <td className="p-3 text-center">
                                                            {s.min_age !== null || s.max_age !== null ? (
                                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    {s.min_age !== null && s.max_age !== null ? `${s.min_age} - ${s.max_age} tuổi` :
                                                                     s.min_age !== null ? `>= ${s.min_age} tuổi` :
                                                                     `<= ${s.max_age} tuổi`}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Mọi lứa tuổi</span>
                                                            )}
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
                                                    <td colSpan={7} className="p-3 text-right text-xs uppercase tracking-wider font-extrabold">Tổng tiền:</td>
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
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phòng tiếp nhận mặc định *</label>
                                        <select
                                            required
                                            value={formData.def_roomid}
                                            onChange={(e) => setFormData({ ...formData, def_roomid: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                        >
                                            <option value="">-- Chọn phòng tiếp nhận --</option>
                                            {rooms.map((room) => (
                                                <option key={room.id} value={room.id}>{room.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đối tượng bệnh nhân *</label>
                                        <select
                                            required
                                            value={formData.object}
                                            onChange={(e) => setFormData({ ...formData, object: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                        >
                                            <option value="3">3 - Khám sức khỏe / Miễn giảm (Mặc định)</option>
                                            {patientObjects.filter(o => String(o.id) !== '3').map((obj) => (
                                                <option key={obj.id} value={obj.id}>{obj.code || obj.id} - {obj.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mục phí công khám mặc định *</label>
                                        <select
                                            required
                                            value={formData.def_examtype}
                                            onChange={(e) => setFormData({ ...formData, def_examtype: e.target.value, type: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                        >
                                            <option value="D0000001">D0000001 - Công khám (Mặc định)</option>
                                            {examFees.filter(f => f.id !== 'D0000001').map((fee) => (
                                                <option key={fee.id} value={fee.id}>{fee.id} - {fee.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mẫu khám sức khỏe mặc định *</label>
                                        <select
                                            required
                                            value={formData.form_type}
                                            onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
                                            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm w-full cursor-pointer"
                                        >
                                            <option value="1">Mẫu 1: Trẻ em dưới 06 tuổi</option>
                                            <option value="2">Mẫu 2: Người từ đủ 06 tuổi đến dưới 18 tuổi</option>
                                            <option value="3">Mẫu 3: Người từ đủ 18 tuổi trở lên</option>
                                            <option value="driver">Giấy KSK người lái xe (Học lái xe / Nâng hạng / Đổi GPLX)</option>
                                        </select>
                                    </div>
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
                                                    <th className="p-2 w-16 text-center">Giới</th>
                                                    <th className="p-2 w-12 text-center">Từ</th>
                                                    <th className="p-2 w-12 text-center">Đến</th>
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
                                                                className="w-8 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-[10px] p-0.5"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <select
                                                                value={ss.gender}
                                                                onChange={(e) => handleUpdateSelectionGender(ss.item_id, e.target.value)}
                                                                className="text-[10px] border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white p-0.5 w-14"
                                                            >
                                                                <option value="A">Cả hai</option>
                                                                <option value="M">Nam</option>
                                                                <option value="F">Nữ</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <input
                                                                type="number"
                                                                placeholder=">="
                                                                value={ss.min_age !== undefined && ss.min_age !== null ? ss.min_age : ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    handleUpdateSelectionMinAge(ss.item_id, val === '' ? undefined : parseInt(val, 10));
                                                                }}
                                                                className="w-10 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-[10px] p-0.5"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <input
                                                                type="number"
                                                                placeholder="<="
                                                                value={ss.max_age !== undefined && ss.max_age !== null ? ss.max_age : ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    handleUpdateSelectionMaxAge(ss.item_id, val === '' ? undefined : parseInt(val, 10));
                                                                }}
                                                                className="w-10 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-[10px] p-0.5"
                                                            />
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
            {/* Edit Employee Modal */}
            {isEmployeeEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                                <UserGroupIcon className="w-5 h-5" />
                            </div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {employeeFormMode === 'ADD' ? 'Thêm mới nhân viên' : 'Sửa thông tin nhân viên'}
                            </h5>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleEmployeeEditSubmit}>
                            <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Họ (đệm) *</label>
                                        <input
                                            type="text"
                                            required
                                            value={employeeFormData.surname}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, surname: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                            placeholder="ĐỖ"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tên đệm</label>
                                        <input
                                            type="text"
                                            value={employeeFormData.midname}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, midname: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                            placeholder="GIA"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tên *</label>
                                        <input
                                            type="text"
                                            required
                                            value={employeeFormData.firstname}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, firstname: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                            placeholder="HUY"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ngày sinh *</label>
                                        <input
                                            type="date"
                                            required
                                            value={employeeFormData.birth_date}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, birth_date: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Giới tính *</label>
                                        <select
                                            required
                                            value={employeeFormData.sex}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, sex: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer"
                                        >
                                            <option value="M">Nam</option>
                                            <option value="F">Nữ</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Số CCCD (12 số)</label>
                                        <input
                                            type="text"
                                            value={employeeFormData.cccd}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, cccd: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                            placeholder="007095001012"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ngày cấp CCCD</label>
                                        <input
                                            type="text"
                                            placeholder="15/12/2024"
                                            value={employeeFormData.cardIdDate}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, cardIdDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Nơi cấp CCCD</label>
                                        <input
                                            type="text"
                                            placeholder="Cục C06"
                                            value={employeeFormData.cardIdPlace}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, cardIdPlace: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Số điện thoại liên hệ</label>
                                        <input
                                            type="text"
                                            value={employeeFormData.phone}
                                            onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                            placeholder="0909123456"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 relative z-30">
                                        <Combobox<CatalogItem>
                                            label="Dân tộc"
                                            value={employeeFormData.ethnic}
                                            displayValue={item => item?.name || ''}
                                            onChange={val => setEmployeeFormData(prev => ({ ...prev, ethnic: val }))}
                                            options={ethnicities}
                                            columns={commonColumns}
                                            placeholder="Chọn dân tộc..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5 relative z-20">
                                        <Combobox<CatalogItem>
                                            label="Tỉnh / Thành phố"
                                            value={employeeFormData.provId}
                                            displayValue={item => item?.name || ''}
                                            onChange={val => setEmployeeFormData(prev => ({ ...prev, provId: val, villId: null }))}
                                            options={provinces}
                                            columns={commonColumns}
                                            placeholder="Chọn tỉnh/thành..."
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 relative z-10">
                                        <Combobox<CatalogItem>
                                            label="Phường / Xã"
                                            value={employeeFormData.villId}
                                            displayValue={item => item?.name || ''}
                                            onChange={val => setEmployeeFormData(prev => ({ ...prev, villId: val }))}
                                            options={editWards}
                                            columns={commonColumns}
                                            placeholder="Chọn phường/xã..."
                                            disabled={!employeeFormData.provId}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Địa chỉ thường trú</label>
                                    <input
                                        type="text"
                                        value={employeeFormData.address}
                                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, address: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                        placeholder="Nhập số nhà, tên đường, thôn/xóm..."
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ghi chú</label>
                                    <textarea
                                        value={employeeFormData.note}
                                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, note: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white h-16 resize-none"
                                        placeholder="Gói dịch vụ bổ sung, ghi chú sức khỏe..."
                                    />
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEmployeeEditOpen(false)}
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

            {/* Modal: Nhập HS từ HIS vào gói khám */}
            {isImportHisModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                <CloudUploadIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Nhập hồ sơ từ HIS vào gói khám
                                </h5>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Gói khám: <strong className="text-slate-700 dark:text-slate-300">{selectedContract?.name}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleImportHisDocsSubmit}>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        Danh sách số hồ sơ HIS *
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={importHisDocsText}
                                        onChange={(e) => setImportHisDocsText(e.target.value)}
                                        placeholder="Nhập hoặc dán các số hồ sơ HIS (phân tách bởi dấu phẩy, dấu cách hoặc xuống dòng).&#10;Ví dụ:&#10;26036157, 26065238, 26062077"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm resize-none"
                                    />
                                    <span className="text-[11px] text-slate-400">
                                        Hệ thống sẽ tự động tra cứu họ tên, ngày sinh, CCCD, phân loại đối tượng KSK và kết quả khám từ HIS.
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                                    <input
                                        type="checkbox"
                                        id="autoSyncKsk"
                                        checked={importHisAutoSync}
                                        onChange={(e) => setImportHisAutoSync(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="autoSyncKsk" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                        Tự động đồng bộ và sinh hồ sơ KSK VNeID ngay sau khi nhập
                                    </label>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsImportHisModalOpen(false)}
                                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={isImportingHisDocs}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isImportingHisDocs ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CloudUploadIcon className="w-4 h-4" />}
                                    Thực hiện nhập
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Đồng bộ kết quả CLS từ HIS sang KSK */}
            {isSyncClsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Đồng bộ kết quả Cận lâm sàng từ HIS
                                </h5>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Gói khám: <strong className="text-slate-700 dark:text-slate-300">{selectedContract?.name}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 flex flex-col gap-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Đã tiếp đón</div>
                                    <div className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
                                        {employees.filter(e => !!e.doc_no && e.doc_no !== '0').length}
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-center">
                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Đã có KQ KSK</div>
                                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                                        {employees.filter(e => !!e.has_cls_result).length}
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-center">
                                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Chưa có KQ KSK</div>
                                    <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                                        {employees.filter(e => !!e.doc_no && e.doc_no !== '0' && !e.has_cls_result).length}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Hệ thống sẽ tự động quét kết quả Xét nghiệm (LIS), Chẩn đoán hình ảnh và Siêu âm (PACS) đã hoàn thành trên hệ thống HIS Core, tự động nạp vào hồ sơ KSK và cập nhật lại XML liên thông chuẩn QĐ 2062.
                            </p>

                            {/* Mode Selection */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Tùy chọn đồng bộ:
                                </label>
                                
                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                    syncClsMode === 'missing_only' 
                                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/30' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="syncClsMode"
                                        value="missing_only"
                                        checked={syncClsMode === 'missing_only'}
                                        onChange={() => setSyncClsMode('missing_only')}
                                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                                            Chỉ đồng bộ hồ sơ chưa có kết quả hoặc có chỉ số mới từ HIS (Khuyến nghị)
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-0.5">
                                            Bỏ qua các hồ sơ đã có đủ kết quả CLS trong KSK, chỉ nạp cho hồ sơ đang thiếu hoặc có thêm chỉ số mới từ HIS.
                                        </span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                    syncClsMode === 'all_new' 
                                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/30' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="syncClsMode"
                                        value="all_new"
                                        checked={syncClsMode === 'all_new'}
                                        onChange={() => setSyncClsMode('all_new')}
                                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                                            Cập nhật lại toàn bộ kết quả CLS mới nhất từ HIS
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-0.5">
                                            Rà soát và làm mới toàn bộ kết quả xét nghiệm và hình ảnh từ HIS (vẫn bảo toàn các kết quả bác sĩ đã chỉnh sửa tay).
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-300">
                                <strong>Lưu ý:</strong> Các hồ sơ đã ký số hoặc đã gửi liên thông VNeID thành công sẽ tự động được bảo vệ và không bị thay đổi.
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsSyncClsModalOpen(false)}
                                disabled={isSyncingCls}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteSyncCls}
                                disabled={isSyncingCls}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isSyncingCls ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                {isSyncingCls ? 'Đang đồng bộ...' : 'Bắt đầu đồng bộ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Dialog */}
            {confirmDialog.isOpen && (
                <div 
                    className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                    style={{ zIndex: 100 }}
                >
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        <div className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                                <AlertCircleIcon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    {confirmDialog.title}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {confirmDialog.message}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={confirmDialog.onConfirm}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-rose-600/10 cursor-pointer active:scale-95"
                                >
                                    Đồng ý
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

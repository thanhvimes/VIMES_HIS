import React, { useState, useEffect } from 'react';
import { smsTemplateService, SMSTemplate } from '../../../services/smsTemplateService';

interface Props {
    onClose?: () => void;
}

const SMSTemplatesManagement: React.FC<Props> = ({ onClose }) => {
    const [templates, setTemplates] = useState<SMSTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<string>('');
    const [filterDept, setFilterDept] = useState<string>('');
    const [filterPatientType, setFilterPatientType] = useState<string>('');

    // Editor state
    const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        templateType: 'confirmation',
        deptCode: '',
        patientType: '',
        templateContent: '',
        description: ''
    });

    // Metadata
    const [templateTypes, setTemplateTypes] = useState<string[]>([]);
    const [patientTypes, setPatientTypes] = useState<Array<{ code: string; name: string }>>([]);

    // Preview data
    const [previewData] = useState({
        patientName: 'Nguyễn Văn A',
        date: '25/01/2026',
        time: '09:30',
        specialty: 'Nội tổng hợp',
        queueNumber: '15',
        bookingId: 'BK001',
        hospitalName: 'Bệnh viện Đa khoa Quốc tế VIMES',
        hotline: '1900886684',
        reason: 'Bệnh nhân yêu cầu',
        newDate: '26/01/2026',
        newTime: '14:00',
        roomName: 'Phòng 237 - Khám nội'
    });

    useEffect(() => {
        loadData();
    }, [filterType, filterDept, filterPatientType]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load templates with filters
            const filters: any = {};
            if (filterType) filters.templateType = filterType;
            if (filterDept) filters.deptCode = filterDept === 'ALL' ? null : filterDept;
            if (filterPatientType) filters.patientType = filterPatientType === 'ALL' ? null : filterPatientType;

            const [templatesData, typesData, patientTypesData] = await Promise.all([
                smsTemplateService.getAllTemplates(filters),
                smsTemplateService.getTemplateTypes(),
                smsTemplateService.getPatientTypes()
            ]);

            setTemplates(templatesData);
            setTemplateTypes(typesData);
            setPatientTypes(patientTypesData);
        } catch (error: any) {
            showMessage('error', `Lỗi tải dữ liệu: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleCreate = () => {
        setIsCreating(true);
        setEditingTemplate(null);
        setFormData({
            templateType: 'confirmation',
            deptCode: '',
            patientType: '',
            templateContent: '',
            description: ''
        });
    };

    const handleEdit = (template: SMSTemplate) => {
        setIsCreating(false);
        setEditingTemplate(template);
        setFormData({
            templateType: template.template_type,
            deptCode: template.dept_code || '',
            patientType: template.patient_type || '',
            templateContent: template.template_content,
            description: template.description || ''
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (isCreating) {
                await smsTemplateService.createTemplate({
                    template_type: formData.templateType,
                    dept_code: formData.deptCode || null,
                    patient_type: formData.patientType || null,
                    template_content: formData.templateContent,
                    description: formData.description
                });
                showMessage('success', 'Tạo template thành công!');
            } else if (editingTemplate) {
                await smsTemplateService.updateTemplate(editingTemplate.template_id, {
                    template_content: formData.templateContent,
                    description: formData.description
                });
                showMessage('success', 'Cập nhật template thành công!');
            }

            setIsCreating(false);
            setEditingTemplate(null);
            await loadData();
        } catch (error: any) {
            showMessage('error', `Lỗi lưu template: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa template này?')) return;

        try {
            await smsTemplateService.deleteTemplate(id);
            showMessage('success', 'Xóa template thành công!');
            await loadData();
        } catch (error: any) {
            showMessage('error', `Lỗi xóa template: ${error.message}`);
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingTemplate(null);
    };

    const getPreview = (content: string) => {
        let preview = content;
        Object.entries(previewData).forEach(([key, value]) => {
            preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value as string);
        });
        return preview;
    };

    const getTemplateTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'confirmation': 'Xác nhận đặt lịch',
            'approved': 'Duyệt lịch khám',
            'cancellation': 'Hủy lịch khám',
            'reminder': 'Nhắc lịch khám',
            'reschedule': 'Đổi lịch khám'
        };
        return labels[type] || type;
    };

    const getDeptLabel = (code: string | null) => {
        if (!code) return 'Tất cả khoa';
        return code;
    };

    const getPatientTypeLabel = (code: string | null) => {
        if (!code) return 'Tất cả đối tượng';
        const type = patientTypes.find(t => t.code === code);
        return type ? type.name : code;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="mt-4 text-slate-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">📱 Quản lý SMS Templates</h2>
                <p className="text-slate-600">Quản lý template SMS theo khoa và đối tượng bệnh nhân</p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
                        <span className="font-medium">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                        <option value="">Tất cả loại</option>
                        {templateTypes.map(type => (
                            <option key={type} value={type}>{getTemplateTypeLabel(type)}</option>
                        ))}
                    </select>

                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                        <option value="">Tất cả khoa</option>
                        <option value="ALL">Mặc định (không chọn khoa)</option>
                        <option value="KB">KB - Khám bệnh</option>
                        <option value="KBYC">KBYC - Khám bệnh yêu cầu</option>
                    </select>

                    <select
                        value={filterPatientType}
                        onChange={(e) => setFilterPatientType(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                        <option value="">Tất cả đối tượng</option>
                        <option value="ALL">Mặc định (không chọn đối tượng)</option>
                        {patientTypes.map(type => (
                            <option key={type.code} value={type.code}>{type.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
                >
                    + Thêm template mới
                </button>
            </div>

            {/* Template List */}
            {!isCreating && !editingTemplate && (
                <div className="space-y-3">
                    {templates.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Không tìm thấy template nào
                        </div>
                    ) : (
                        templates.map(template => (
                            <div key={template.template_id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-slate-800">{getTemplateTypeLabel(template.template_type)}</span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{getDeptLabel(template.dept_code)}</span>
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">{getPatientTypeLabel(template.patient_type)}</span>
                                            {!template.is_active && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Không hoạt động</span>}
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2">{template.template_content}</p>
                                        {template.description && (
                                            <p className="text-xs text-slate-500 mt-1 italic">{template.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.template_id)}
                                            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Editor */}
            {(isCreating || editingTemplate) && (
                <div className="bg-white border-2 border-teal-500 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                        {isCreating ? '➕ Tạo template mới' : '✏️ Sửa template'}
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Loại template *</label>
                                <select
                                    value={formData.templateType}
                                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                                    disabled={!isCreating}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                                >
                                    {templateTypes.map(type => (
                                        <option key={type} value={type}>{getTemplateTypeLabel(type)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Khoa</label>
                                <select
                                    value={formData.deptCode}
                                    onChange={(e) => setFormData({ ...formData, deptCode: e.target.value })}
                                    disabled={!isCreating}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                                >
                                    <option value="">Tất cả khoa (mặc định)</option>
                                    <option value="KB">KB - Khám bệnh</option>
                                    <option value="KBYC">KBYC - Khám bệnh yêu cầu</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Để trống nếu áp dụng cho tất cả khoa</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Đối tượng</label>
                                <select
                                    value={formData.patientType}
                                    onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
                                    disabled={!isCreating}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                                >
                                    <option value="">Tất cả đối tượng (mặc định)</option>
                                    {patientTypes.map(type => (
                                        <option key={type.code} value={type.code}>{type.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Để trống nếu áp dụng cho tất cả đối tượng</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung template *</label>
                                <textarea
                                    value={formData.templateContent}
                                    onChange={(e) => setFormData({ ...formData, templateContent: e.target.value })}
                                    className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                                    placeholder="Nhập nội dung SMS..."
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Biến có sẵn: {'{patientName}, {date}, {time}, {specialty}, {roomName}, {queueNumber}, {hotline}'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    placeholder="Mô tả ngắn gọn về template này"
                                />
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Xem trước</label>
                            <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
                                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                            SMS
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">Bệnh viện VIMES</div>
                                            <div className="text-xs text-slate-500">Tin nhắn SMS</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-800 whitespace-pre-wrap">
                                        {getPreview(formData.templateContent || 'Nhập nội dung để xem trước...')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !formData.templateContent}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
                        >
                            {saving ? 'Đang lưu...' : '💾 Lưu template'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SMSTemplatesManagement;

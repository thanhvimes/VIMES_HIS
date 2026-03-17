import React, { useState, useEffect } from 'react';
import { Setting } from '../../../services/settingsService';
import { useSession } from '../../../contexts/SessionContext';
import { smsTemplateService, SMSTemplate } from '../../../services/smsTemplateService';

interface Props {
    settings: Setting[];
    onSave: (updates: Array<{ key: string; value: any }>) => Promise<void>;
    saving: boolean;
}

const SMSTemplatesTab: React.FC<Props> = ({ settings }) => {
    const { user } = useSession();
    const [templates, setTemplates] = useState<Record<string, SMSTemplate>>({});
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [patientType, setPatientType] = useState<string>('ALL'); // 'ALL', 'DV', 'BH'
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewData, setPreviewData] = useState({
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

    // Load templates from backend based on patient type
    useEffect(() => {
        loadTemplates();
    }, [patientType, user?.deptCode]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const deptCode = user?.deptCode || null;
            const pType = patientType === 'ALL' ? null : patientType;

            // Load EFFECTIVE templates for this dept/patient type combination
            const allTemplates = await smsTemplateService.getAllTemplates({
                deptCode,
                patientType: pType,
                effective: true
            });

            // Organize by template type
            const templateMap: Record<string, SMSTemplate> = {};
            allTemplates.forEach(template => {
                const key = `sms_template_${template.template_type}`;

                // CRITICAL: If the returned template's context doesn't match our selection,
                // it's a fallback template. Clear the template_id so that saving it
                // will create a NEW SPECIFIC record for the current context.
                const isExactMatch =
                    (template.dept_code === deptCode) &&
                    (template.patient_type === pType);

                templateMap[key] = {
                    ...template,
                    template_id: isExactMatch ? template.template_id : 0
                };
            });

            setTemplates(templateMap);

            // Set first template as selected if none selected
            if (!selectedTemplate && Object.keys(templateMap).length > 0) {
                setSelectedTemplate(Object.keys(templateMap)[0]);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const templateInfo = {
        'sms_template_confirmation': {
            name: 'Xác nhận đặt lịch',
            description: 'Gửi khi bệnh nhân đăng ký lịch khám thành công',
            icon: '✅'
        },
        'sms_template_approved': {
            name: 'Duyệt lịch khám',
            description: 'Gửi khi nhân viên duyệt lịch khám',
            icon: '👍'
        },
        'sms_template_cancellation': {
            name: 'Hủy lịch khám',
            description: 'Gửi khi lịch khám bị hủy',
            icon: '❌'
        },
        'sms_template_reminder': {
            name: 'Nhắc lịch khám',
            description: 'Gửi trước 1 ngày để nhắc nhở bệnh nhân',
            icon: '⏰'
        },
        'sms_template_reschedule': {
            name: 'Đổi lịch khám',
            description: 'Gửi khi lịch khám được đổi sang ngày/giờ khác',
            icon: '🔄'
        }
    };

    const variables = [
        { key: '{patientName}', label: 'Tên bệnh nhân' },
        { key: '{date}', label: 'Ngày khám' },
        { key: '{time}', label: 'Giờ khám' },
        { key: '{specialty}', label: 'Chuyên khoa' },
        { key: '{queueNumber}', label: 'Số thứ tự' },
        { key: '{bookingId}', label: 'Mã booking' },
        { key: '{hospitalName}', label: 'Tên bệnh viện' },
        { key: '{hotline}', label: 'Hotline' },
        { key: '{reason}', label: 'Lý do (hủy)' },
        { key: '{newDate}', label: 'Ngày mới (đổi lịch)' },
        { key: '{newTime}', label: 'Giờ mới (đổi lịch)' },
        { key: '{roomName}', label: 'Tên phòng khám' },
    ];

    const handleTemplateChange = (key: string, value: string) => {
        setTemplates(prev => {
            const current = (prev[key] || {}) as any;
            return {
                ...prev,
                [key]: {
                    ...current,
                    template_content: value
                }
            };
        });
    };

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById(`template-${selectedTemplate}`) as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentTemplate = templates[selectedTemplate];
            const currentValue = currentTemplate?.template_content || '';
            const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);

            handleTemplateChange(selectedTemplate, newValue);

            // Set cursor position after inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const deptCode = user?.deptCode || null;
            const pType = patientType === 'ALL' ? null : patientType;

            // Save or update each template
            for (const [key, template] of Object.entries(templates)) {
                const tmpl = template as SMSTemplate;
                if (tmpl.template_id) {
                    // Update existing template
                    await smsTemplateService.updateTemplate(tmpl.template_id, {
                        template_content: tmpl.template_content
                    });
                } else {
                    // Create new template
                    const templateType = key.replace('sms_template_', '');
                    await smsTemplateService.createTemplate({
                        template_type: templateType,
                        dept_code: deptCode,
                        patient_type: pType,
                        template_content: tmpl.template_content,
                        description: templateInfo[key as keyof typeof templateInfo]?.description
                    });
                }
            }

            // Reload templates
            await loadTemplates();
            alert('✅ Lưu thành công!');
        } catch (error) {
            console.error('Error saving templates:', error);
            alert('❌ Lỗi lưu template!');
        } finally {
            setIsSaving(false);
        }
    };

    const getPreview = (template: string) => {
        let preview = template;
        Object.entries(previewData).forEach(([key, value]) => {
            preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value as string);
        });
        return preview;
    };



    const getCharCount = (text: string) => {
        return text.length;
    };

    const getSMSCount = (text: string) => {
        // Vietnamese SMS: 70 chars per SMS (Unicode)
        return Math.ceil(text.length / 70);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">📱 Quản lý SMS Templates</h2>
                <p className="text-slate-600">Tùy chỉnh nội dung tin nhắn SMS gửi cho bệnh nhân</p>
            </div>

            {/* Patient Type Selector */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-blue-900">Đối tượng bệnh nhân:</label>
                    <select
                        value={patientType}
                        onChange={(e) => setPatientType(e.target.value)}
                        className="px-4 py-2 border border-blue-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Tất cả đối tượng</option>
                        <option value="DV">Dịch vụ</option>
                        <option value="BH">Bảo hiểm</option>
                    </select>
                    {user?.deptCode && (
                        <span className="text-sm text-blue-700">
                            📍 Khoa: <strong>{user.deptCode}</strong>
                        </span>
                    )}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                    💡 Template sẽ được lưu theo khoa <strong>{user?.deptCode || 'hiện tại'}</strong> và đối tượng đã chọn
                </p>
            </div>

            {/* Template Selector */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(templateInfo).map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedTemplate(key)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${selectedTemplate === key
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-teal-300'
                            }`}
                    >
                        <div className="text-2xl mb-2">{info.icon}</div>
                        <div className="font-semibold text-sm text-slate-800">{info.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{info.description}</div>
                    </button>
                ))}
            </div>

            {/* Editor */}
            {selectedTemplate && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Editor */}
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nội dung template
                            </label>
                            {loading && (
                                <div className="absolute inset-x-0 bottom-0 top-8 bg-white/50 flex items-center justify-center z-10 rounded-lg">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                                </div>
                            )}
                            <textarea
                                id={`template-${selectedTemplate}`}
                                value={templates[selectedTemplate]?.template_content || ''}
                                onChange={(e) => handleTemplateChange(selectedTemplate, e.target.value)}
                                className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                                placeholder="Nhập nội dung SMS..."
                            />
                            <div className="flex justify-between items-center mt-2 text-sm">
                                <span className="text-slate-600">
                                    {getCharCount(templates[selectedTemplate]?.template_content || '')} ký tự •
                                    {getSMSCount(templates[selectedTemplate]?.template_content || '')} SMS
                                </span>
                                <span className="text-slate-500">
                                    {getSMSCount(templates[selectedTemplate]?.template_content || '') > 1 && '⚠️ Nhiều hơn 1 SMS'}
                                </span>
                            </div>
                        </div>

                        {/* Variables */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Biến có sẵn (Click để chèn)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {variables.map(variable => (
                                    <button
                                        key={variable.key}
                                        onClick={() => insertVariable(variable.key)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-100 border border-slate-300 hover:border-teal-400 rounded-md text-xs font-mono transition-colors"
                                        title={variable.label}
                                    >
                                        {variable.key}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                💡 Click vào biến để chèn vào vị trí con trỏ
                            </p>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Xem trước
                            </label>
                            <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 h-64 overflow-y-auto">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
                                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                            SMS
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">Bệnh viện VIMES</div>
                                            <div className="text-xs text-slate-500">Tin nhắn SMS</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-800 whitespace-pre-wrap">
                                        {getPreview(templates[selectedTemplate]?.template_content || '')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 text-sm mb-2">📝 Dữ liệu mẫu</h4>
                            <div className="space-y-1 text-xs text-blue-800">
                                {Object.entries(previewData).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span className="font-mono">{`{${key}}`}</span>
                                        <span className="font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
                >
                    {isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default SMSTemplatesTab;

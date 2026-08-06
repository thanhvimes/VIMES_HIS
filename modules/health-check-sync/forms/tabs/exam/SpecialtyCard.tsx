import React, { useContext } from 'react';
import { DynamicFormContext } from '../../DynamicFormContext';
import { ChildFormContext } from '../../mau1-child/ChildFormContext';
import { useSession } from '../../../../../contexts/SessionContext';
import Combobox from '../../../../../components/ui/Combobox';

interface SpecialtyCardProps {
    specialtyKey: string;
    title: string;
    children: React.ReactNode;
}

const doctorColumns = [
    { key: 'id', label: 'Mã người dùng (su_userid)', width: '180px' },
    { key: 'name', label: 'Họ tên bác sĩ' }
];

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ specialtyKey, title, children }) => {
    const adultContext = useContext(DynamicFormContext);
    const childContext = useContext(ChildFormContext);
    const context = adultContext || childContext || {};
    
    const { specialtyMetadata, setSpecialtyMetadata, doctors, handleSubmit, isLocked: parentIsLocked } = context;
    const { user } = useSession();

    const safeMetadata = specialtyMetadata || {};
    const initialMetadata = { ...(safeMetadata[specialtyKey] || { doctorId: '', status: 'CHUA_KHAM' }) };
    
    // Default to the currently logged in doctor if not selected
    if (!initialMetadata.doctorId && user) {
        initialMetadata.doctorId = user.userId || '';
        initialMetadata.doctorName = user.name || '';
    }
    
    const metadata = initialMetadata;
    const doctorsList = doctors || [];

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...metadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
        }
        
        if (setSpecialtyMetadata) {
            setSpecialtyMetadata(prev => {
                const updated = {
                    ...prev,
                    [specialtyKey]: payload
                };
                if (action === 'DUYỆT' && handleSubmit) {
                    setTimeout(() => {
                        handleSubmit();
                    }, 100);
                }
                return updated;
            });
        }
    };

    const isLocked = parentIsLocked || (metadata?.status !== 'ĐANG_KHÁM' && metadata?.status !== 'ĐÃ_KHÁM');

    const renderBadge = () => {
        switch (metadata?.status) {
            case 'ĐANG_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Đã duyệt</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Chưa khám</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 font-medium">Bác sĩ khám:</label>
                        <Combobox
                            value={metadata.doctorId}
                            options={doctorsList}
                            columns={doctorColumns}
                            onChange={(val, item) => {
                                if (setSpecialtyMetadata) {
                                    setSpecialtyMetadata(prev => ({
                                        ...prev,
                                        [specialtyKey]: {
                                            ...metadata,
                                            doctorId: val,
                                            doctorName: item?.name || '',
                                            updatedAt: new Date().toISOString()
                                        }
                                    }));
                                }
                            }}
                            disabled={isLocked}
                            placeholder="-- Chọn bác sĩ --"
                            className="min-w-[250px]"
                        />
                    </div>
                    
                     {metadata.status === 'CHUA_KHAM' || !metadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
                        >
                            Khám
                        </button>
                    ) : (metadata.status === 'ĐANG_KHÁM' || metadata.status === 'ĐÃ_KHÁM') ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleAction('DUYỆT')}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 cursor-pointer"
                            >
                                Duyệt
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAction('THOÁT')}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 cursor-pointer"
                            >
                                Thoát
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÓA')}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200 cursor-pointer"
                            title="Mở khóa để sửa"
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </div>
            
            <div className={`p-4 ${isLocked ? 'opacity-80 pointer-events-none' : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default SpecialtyCard;

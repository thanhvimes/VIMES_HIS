import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import { useSession } from '../../../../../contexts/SessionContext';

interface SpecialtyCardProps {
    specialtyKey: string;
    title: string;
    children: React.ReactNode;
}

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ specialtyKey, title, children }) => {
    const { specialtyMetadata, setSpecialtyMetadata, doctors } = useDynamicFormContext() || {};
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

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA') => {
        const payload = { ...metadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
        }
        
        if (setSpecialtyMetadata) {
            setSpecialtyMetadata(prev => ({
                ...prev,
                [specialtyKey]: payload
            }));
        }
    };

    const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedDoctor = doctorsList.find(d => d.id === selectedId);
        if (setSpecialtyMetadata) {
            setSpecialtyMetadata(prev => ({
                ...prev,
                [specialtyKey]: {
                    ...metadata,
                    doctorId: selectedId,
                    doctorName: selectedDoctor?.name || '',
                    updatedAt: new Date().toISOString()
                }
            }));
        }
    };

    const isLocked = metadata?.status !== 'ĐANG_KHÁM';

    const renderBadge = () => {
        switch (metadata?.status) {
            case 'ĐANG_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã duyệt</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Chưa khám</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 font-medium">Bác sĩ khám:</label>
                        <select
                            value={metadata.doctorId}
                            onChange={handleDoctorChange}
                            disabled={isLocked}
                            className="text-xs md:text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0f766e] focus:ring-[#0f766e] disabled:bg-gray-100 min-w-[200px] h-9"
                        >
                            <option value="">-- Chọn bác sĩ --</option>
                            {doctorsList.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {metadata.status === 'CHUA_KHAM' || !metadata.status ? (
                        <button
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Mở khám
                        </button>
                    ) : metadata.status === 'ĐANG_KHÁM' ? (
                        <button
                            onClick={() => handleAction('DUYỆT')}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                            Duyệt
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('MỞ_KHÓA')}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200"
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

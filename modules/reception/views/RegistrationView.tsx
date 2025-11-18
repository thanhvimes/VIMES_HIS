import React from 'react';
import { 
    UserPlusIcon, 
    PencilIcon, 
    TrashIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon 
} from '../../../components/Icons';
import ActionButton from '../../../components/shared/ActionButton';
import { FormInput, FormSelect } from '../../../components/shared/forms';

const RegistrationView: React.FC = () => {
    // Mock API event handlers
    const handleAdd = () => console.log('API Call: Add new record initialized.');
    const handleEdit = () => console.log('API Call: Edit mode enabled for record.');
    const handleDelete = () => console.log('API Call: Delete record.');
    const handleSave = () => console.log('API Call: Save record.');
    const handleCancel = () => console.log('API Call: Action cancelled.');
    const handlePrint = () => console.log('API Call: Print record.');

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    {/* Main form section */}
                    <div className="col-span-12 lg:col-span-9 space-y-3">
                        {/* Patient Info */}
                        <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
                             <p className="font-semibold text-primary dark:text-dark-primary mb-3">Thông tin bệnh nhân</p>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
                                <div className="md:col-span-2 grid grid-cols-3 gap-x-2">
                                    <FormInput label="Mã BN" value="20025251" readOnly/>
                                    <FormInput label="Số hồ sơ" value="21024067" labelClassName="text-red-500"/>
                                    <FormSelect label="Thẻ"><option>...</option></FormSelect>
                                </div>
                                <FormInput className="md:col-span-2" label="Tên bệnh nhân" value="Trương Thị Hồng Vân"/>
                                
                                <FormInput label="Tuổi" value="22 Tuổi" readOnly/>
                                <FormInput label="Năm sinh" value="01/01/1999" />
                                <FormSelect label="Giới"><option>Nữ</option></FormSelect>
                                <FormSelect label="Dân tộc"><option>Kinh</option></FormSelect>
                                
                                <FormSelect className="md:col-span-2" label="Nghề nghiệp"><option>Cung ứng và phân phối</option></FormSelect>
                                <FormInput className="md:col-span-2" label="Giấy" />

                                <FormSelect label="Tỉnh"><option>...</option></FormSelect>
                                <FormSelect label="Phường / Xã"><option>...</option></FormSelect>
                                <FormInput className="md:col-span-2" label="Địa chỉ chi tiết" value="thôn 7"/>

                                <FormInput className="md:col-span-2" label="Số điện thoại" value="0978856402"/>
                                <FormSelect className="md:col-span-1" label="Người GT"><option>...</option></FormSelect>
                                <FormInput className="md:col-span-1" label="Thẻ căn cước" value="//"/>
                                
                                <FormInput className="md:col-span-4" label="Người thân"/>
                             </div>
                        </div>
                        {/* Patient Type */}
                        <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
                             <p className="font-semibold text-primary dark:text-dark-primary mb-3">Đối tượng bệnh nhân</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                <FormSelect label="Đối tượng"><option>Dịch vụ</option></FormSelect>
                                <FormSelect label="Số thẻ"><option>...</option></FormSelect>
                             </div>
                        </div>

                         {/* Examination Info */}
                        <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
                             <p className="font-semibold text-primary dark:text-dark-primary mb-3">Thông tin khám</p>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                                <FormSelect label="T/trạng BN"><option>Không khỏe</option></FormSelect>
                                <FormInput label="Ngày" value="17/11/2021"/>
                                <FormInput label="Số phiếu" value="6.1"/>
                                
                                <FormSelect label="Kiểu khám"><option>Khám Phụ sản</option></FormSelect>
                                <FormSelect label="Phòng"><option>Phòng Khám Sản - Phụ Khoa</option></FormSelect>
                                <FormInput className="md:col-span-3" label="Triệu chứng"/>
                             </div>
                        </div>

                        {/* Examination History */}
                        <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700 flex-grow">
                            <div className="flex items-center space-x-4 mb-2">
                                <p className="font-semibold text-primary dark:text-dark-primary">Thông tin phiếu khám</p>
                                <div className="flex items-center"><input type="checkbox" className="h-4 w-4 rounded"/><span className="text-sm ml-2">Quốc tịch</span></div>
                                <div className="flex items-center"><input type="checkbox" className="h-4 w-4 rounded"/><span className="text-sm ml-2">Hẹn khám lại</span></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm whitespace-nowrap">
                                    <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            {['Số HS', 'Ngày khám', 'Phòng khám', 'Số phiếu', 'Bác sĩ', 'Trạng thái', 'Chẩn đoán'].map(h => <th key={h} className="p-2 font-medium text-left">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        <tr><td className="p-2">23011618</td><td className="p-2">09/05/2023</td><td className="p-2">Phòng Khám Sản -...</td><td className="p-2">9</td><td className="p-2">lvduong</td><td className="p-2">Đã kết t...</td><td className="p-2">Viêm lộ tuyến cổ t...</td></tr>
                                        <tr><td className="p-2">21024067</td><td className="p-2">17/11/2021</td><td className="p-2">Phòng Khám Sản -...</td><td className="p-2">1</td><td className="p-2">ntthien</td><td className="p-2">Đã kết t...</td><td className="p-2">Theo dõi thai cổ n...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Side Info */}
                    <div className="col-span-12 lg:col-span-3">
                         <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
                             <p className="font-semibold text-primary dark:text-dark-primary mb-2">Thông tin các phòng khám</p>
                             <table className="w-full text-sm">
                                <thead className="text-left font-medium text-slate-600 dark:text-slate-300"><tr><th className="p-1.5">Phòng</th><th className="p-1.5">Tổng</th><th className="p-1.5">BH</th><th className="p-1.5">Đã khám</th></tr></thead>
                                <tbody><tr className="text-slate-500 dark:text-slate-400"><td className="p-1.5">Tổng số</td><td className="p-1.5">0</td><td className="p-1.5">0</td><td className="p-1.5">0</td></tr></tbody>
                             </table>
                         </div>
                    </div>
                </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex-shrink-0 mt-4 bg-surface dark:bg-dark-surface p-3 rounded-lg shadow-md border border-slate-200/50 dark:border-slate-700">
                <div className="flex items-center flex-wrap gap-3">
                    <ActionButton label="Thêm" icon={<UserPlusIcon className="w-4 h-4"/>} onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600 text-white"/>
                    <ActionButton label="Sửa" icon={<PencilIcon className="w-4 h-4"/>} onClick={handleEdit} className="bg-yellow-500 hover:bg-yellow-600 text-white"/>
                    <ActionButton label="Xóa" icon={<TrashIcon className="w-4 h-4"/>} onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white"/>
                    <ActionButton label="Lưu" icon={<SaveIcon className="w-4 h-4"/>} onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white"/>
                    <ActionButton label="Hủy" icon={<BanIcon className="w-4 h-4"/>} onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600 text-white"/>
                    <ActionButton label="In" icon={<PrinterIcon className="w-4 h-4"/>} onClick={handlePrint} className="bg-gray-500 hover:bg-gray-600 text-white"/>
                </div>
            </div>
        </div>
    );
};

export default RegistrationView;
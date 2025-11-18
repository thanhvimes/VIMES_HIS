import React, { useState } from 'react';
import { Drug } from '../../../types';

const mockDrugs: Drug[] = [
  { id: 'D01', name: 'Ginkgo Biloba 120mg', dosage: 'Viên', stock: 150 },
  { id: 'D02', name: 'Paracetamol 500mg', dosage: 'Viên', stock: 875 },
  { id: 'D03', name: 'Amoxicillin 500mg', dosage: 'Viên', stock: 320 },
  { id: 'D04', name: 'Berberin', dosage: 'Viên', stock: 450 },
  { id: 'D05', name: 'Omeprazol 20mg', dosage: 'Viên', stock: 25 },
];

const InventoryView: React.FC = () => {
  const [drugs] = useState<Drug[]>(mockDrugs);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-slate-500 dark:text-slate-400">Quản lý kho thuốc và vật tư y tế của phòng khám.</p>
        <div className="w-full sm:w-auto flex gap-2">
            <input 
                type="text" 
                placeholder="Tìm kiếm thuốc..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <button className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                Thêm mới
            </button>
        </div>
      </div>
      
      <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">Mã Thuốc</th>
                <th className="p-3">Tên thuốc</th>
                <th className="p-3">Đơn vị</th>
                <th className="p-3 text-right">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.map(drug => (
                <tr key={drug.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-primary dark:text-dark-primary">{drug.id}</td>
                  <td className="p-3 font-medium text-onSurface dark:text-dark-onSurface">{drug.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{drug.dosage}</td>
                  <td className={`p-3 text-right font-bold ${drug.stock < 50 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                    {drug.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;

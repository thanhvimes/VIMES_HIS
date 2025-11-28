
import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SearchIcon, PlusIcon, ExclamationCircleIcon, CheckIcon, BanIcon } from '../../../components/Icons';

// Extended Drug Type for Inventory Management
interface InventoryItem {
    id: string;
    name: string;
    dosage: string;
    stock: number;
    batchNumber: string;
    importDate: string;
    expiryDate: string;
    category: string;
    minStock: number;
    supplier: string;
    price: number;
}

const mockInventory: InventoryItem[] = [
  { id: 'D01', name: 'Ginkgo Biloba 120mg', dosage: 'Viên', stock: 150, batchNumber: 'GB2301', importDate: '2023-01-10', expiryDate: '2025-01-10', category: 'Thuốc bổ não', minStock: 50, supplier: 'Dược Hậu Giang', price: 5000 },
  { id: 'D02', name: 'Paracetamol 500mg', dosage: 'Viên', stock: 875, batchNumber: 'PA2305', importDate: '2023-05-20', expiryDate: '2026-05-20', category: 'Giảm đau', minStock: 200, supplier: 'Mekophar', price: 500 },
  { id: 'D03', name: 'Amoxicillin 500mg', dosage: 'Viên', stock: 320, batchNumber: 'AM2302', importDate: '2023-02-15', expiryDate: '2025-02-15', category: 'Kháng sinh', minStock: 100, supplier: 'Imexpharm', price: 1200 },
  { id: 'D04', name: 'Berberin', dosage: 'Viên', stock: 450, batchNumber: 'BE2303', importDate: '2023-03-10', expiryDate: '2025-03-10', category: 'Tiêu hóa', minStock: 100, supplier: 'Traphaco', price: 500 },
  { id: 'D05', name: 'Omeprazol 20mg', dosage: 'Viên', stock: 25, batchNumber: 'OM2304', importDate: '2023-04-05', expiryDate: '2023-12-01', category: 'Dạ dày', minStock: 50, supplier: 'Stada', price: 2000 },
];

const InventoryView: React.FC = () => {
  const { fontSettings } = useTheme();
  const [inventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'expired'>('all');

  const filteredInventory = useMemo(() => {
    const now = new Date();
    return inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        const expiry = new Date(item.expiryDate);
        const isExpired = expiry < now;
        const isLowStock = item.stock <= item.minStock;

        if (filterStatus === 'low') return isLowStock;
        if (filterStatus === 'expired') return isExpired;
        
        return true;
    });
  }, [inventory, searchTerm, filterStatus]);

  const getStatusBadge = (item: InventoryItem) => {
      const now = new Date();
      const expiry = new Date(item.expiryDate);
      const monthsToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (expiry < now) {
          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200"><BanIcon className="w-3 h-3"/> Hết hạn</span>;
      }
      if (monthsToExpiry < 3) {
          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"><ExclamationCircleIcon className="w-3 h-3"/> Sắp hết hạn</span>;
      }
      if (item.stock <= item.minStock) {
          return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><ExclamationCircleIcon className="w-3 h-3"/> Sắp hết hàng</span>;
      }
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckIcon className="w-3 h-3"/> Sẵn sàng</span>;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kho Dược & Vật tư</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý tồn kho, hạn dùng và lô thuốc.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md font-bold flex items-center gap-2 transition">
            <PlusIcon className="w-5 h-5"/> Nhập kho mới
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center flex-shrink-0">
          <div className="relative flex-1 w-full">
              <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
              <input 
                  type="text" 
                  placeholder="Tìm kiếm thuốc, mã, hoạt chất..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
              />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filterStatus === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
              >
                  Tất cả
              </button>
              <button 
                onClick={() => setFilterStatus('low')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filterStatus === 'low' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
              >
                  Sắp hết
              </button>
              <button 
                onClick={() => setFilterStatus('expired')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${filterStatus === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
              >
                  Hết hạn
              </button>
          </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className={`w-full text-left ${fontSettings.listPrimary}`}>
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 shadow-sm">
              <tr>
                <th className="p-4 w-20">Mã</th>
                <th className="p-4">Tên thuốc / Vật tư</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Số lô / Hạn dùng</th>
                <th className="p-4 text-right">Đơn giá</th>
                <th className="p-4 text-right">Tồn kho</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-mono text-slate-500 text-sm">{item.id}</td>
                  <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.dosage} - {item.supplier}</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">{item.category}</td>
                  <td className="p-4 text-sm">
                      <div className="font-mono text-slate-700 dark:text-slate-300">{item.batchNumber}</div>
                      <div className="text-xs text-slate-500">HSD: {new Date(item.expiryDate).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300 font-medium">
                      {(item.price || 0).toLocaleString()} đ
                  </td>
                  <td className={`p-4 text-right font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>
                    {item.stock.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                      {getStatusBadge(item)}
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
    
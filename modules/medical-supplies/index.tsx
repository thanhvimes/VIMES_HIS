
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SuppliesDashboard from './views/SuppliesDashboard';
import SuppliesInventoryView from './views/SuppliesInventoryView';
import SuppliesTransactionHistoryView from './views/SuppliesTransactionHistoryView';
import SuppliesReceiptEditorView from './views/SuppliesReceiptEditorView';

const MedicalSupplies: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<SuppliesDashboard />} />
      <Route path="inventory" element={<SuppliesInventoryView />} />
      <Route path="transactions" element={<SuppliesTransactionHistoryView />} />
      <Route path="receipt/new" element={<SuppliesReceiptEditorView />} />
      <Route path="receipt/edit/:id" element={<SuppliesReceiptEditorView />} />
      <Route path="*" element={<div className="p-10 text-center text-slate-400">Chức năng đang được phát triển.</div>} />
    </Routes>
  );
};

export default MedicalSupplies;

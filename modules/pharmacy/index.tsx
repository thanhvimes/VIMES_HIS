
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PharmacyDashboard from './views/PharmacyDashboard';
import InventoryView from './views/InventoryView';
import TransactionHistoryView from './views/TransactionHistoryView';
import ReceiptEditorView from './views/ReceiptEditorView';
import RequisitionListView from './views/RequisitionListView';
import RequisitionEditorView from './views/RequisitionEditorView';
import TransferListView from './views/TransferListView';
import TransferEditorView from './views/TransferEditorView';
import ReplenishmentListView from './views/ReplenishmentListView';
import ReplenishmentEditorView from './views/ReplenishmentEditorView';
import MiscVoucherListView from './views/MiscVoucherListView';
import MiscVoucherEditorView from './views/MiscVoucherEditorView';
import ReturnListView from './views/ReturnListView';
import ReturnEditorView from './views/ReturnEditorView';
import WarehouseSetupView from './views/WarehouseSetupView';
import InteractionView from './views/InteractionView';
import ReportsLayout from '../reports/ReportsLayout';

const Pharmacy: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<PharmacyDashboard />} />
      <Route path="inventory" element={<InventoryView />} />
      
      {/* Nghiệp vụ nhập xuất */}
      <Route path="transactions" element={<TransactionHistoryView />} />
      <Route path="receipt/new" element={<ReceiptEditorView />} />
      <Route path="receipt/edit/:id" element={<ReceiptEditorView />} />

      {/* Nghiệp vụ dự trù & lĩnh thuốc */}
      <Route path="requisitions" element={<RequisitionListView />} />
      <Route path="requisition/new" element={<RequisitionEditorView />} />
      <Route path="requisition/edit/:id" element={<RequisitionEditorView />} />

      {/* Nghiệp vụ điều chuyển */}
      <Route path="transfer" element={<TransferListView />} />
      <Route path="transfer/new" element={<TransferEditorView />} />
      <Route path="transfer/edit/:id" element={<TransferEditorView />} />

      {/* Nghiệp vụ nhập xuất khác */}
      <Route path="misc-vouchers" element={<MiscVoucherListView />} />
      <Route path="misc-voucher/new" element={<MiscVoucherEditorView />} />
      <Route path="misc-voucher/edit/:id" element={<MiscVoucherEditorView />} />

      {/* Nghiệp vụ hoàn trả */}
      <Route path="returns" element={<ReturnListView />} />
      <Route path="return/new" element={<ReturnEditorView />} />
      <Route path="return/edit/:id" element={<ReturnEditorView />} />

      {/* Nghiệp vụ bổ sung tủ trực */}
      <Route path="replenishments" element={<ReplenishmentListView />} />
      <Route path="replenishment/new" element={<ReplenishmentEditorView />} />
      <Route path="replenishment/edit/:id" element={<ReplenishmentEditorView />} />
      
      <Route path="interactions" element={<InteractionView />} />
      <Route path="setup" element={<WarehouseSetupView />} />
      <Route path="reports" element={<ReportsLayout moduleFilter="pharmacy" />} />
      
      <Route path="*" element={<div className="p-10 text-center text-slate-400">Chức năng đang được phát triển.</div>} />
    </Routes>
  );
};

export default Pharmacy;

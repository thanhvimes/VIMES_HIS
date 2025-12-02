
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import InvoiceListView from './views/InvoiceListView';
import DepositListView from './views/DepositListView';
import ReportsLayout from '../reports/ReportsLayout'; 
import PaymentsView from './views/PaymentsView';
import BillingRecordView from './views/BillingRecordView';
import CashFlowView from './views/CashFlowView';
import BillingSettingsView from './views/BillingSettingsView';
import { mockBills, mockCustomers } from './data';
import { Bill } from '../../types';

const Billing: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [customers] = useState(mockCustomers);

  const addBill = (newBill: Omit<Bill, 'id' | 'status'>) => {
    const bill: Bill = {
      ...newBill,
      id: `INV${Date.now()}`,
      status: 'unpaid',
    };
    setBills([bill, ...bills]);
  };

  const deleteBill = (id: string) => {
    setBills(bills.filter((b) => b.id !== id));
  };

  const updateBillStatus = (id: string, status: 'paid' | 'unpaid') => {
    setBills(bills.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route 
        path="dashboard" 
        element={<DashboardView bills={bills} customers={customers} />} 
      />
      <Route 
        path="invoices" 
        element={
            <InvoiceListView 
                bills={bills} 
                customers={customers} 
                addBill={addBill} 
                deleteBill={deleteBill} 
                updateBillStatus={updateBillStatus}
            />
        } 
      />
      <Route path="deposits" element={<DepositListView />} />
      <Route path="record" element={<BillingRecordView />} />
      <Route path="record/:patientId" element={<BillingRecordView />} />
      
       <Route 
        path="payments" 
        element={
            <PaymentsView 
                bills={bills} 
                customers={customers} 
                updateBillStatus={updateBillStatus}
            />
        } 
      />
      <Route path="cash-flow" element={<CashFlowView />} />
      <Route path="settings" element={<BillingSettingsView />} />
      <Route 
        path="reports" 
        element={<ReportsLayout moduleFilter="billing" />} 
      />
    </Routes>
  );
};

export default Billing;


import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from './views/DashboardView';
import InvoiceListView from './views/InvoiceListView';
import ReportsLayout from '../reports/ReportsLayout'; // Updated Import
import PaymentsView from './views/PaymentsView';
import { mockBills, mockCustomers } from './data';
import { Bill } from '../../types';

const Billing: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [customers] = useState(mockCustomers);
  const [filter, setFilter] = useState<{ customerId: string | null }>({ customerId: null });

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

  const clearFilter = () => setFilter({ customerId: null });

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
                filter={filter}
                clearFilter={clearFilter}
            />
        } 
      />
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
      {/* Use ReportsLayout with module filter */}
      <Route 
        path="reports" 
        element={<ReportsLayout moduleFilter="billing" />} 
      />
    </Routes>
  );
};

export default Billing;

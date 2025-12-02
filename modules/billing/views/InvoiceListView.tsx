
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BillsManager } from './Invoices';
import { Bill, Customer } from '../../../types';

interface InvoiceListViewProps {
  bills: Bill[];
  customers: Customer[];
  addBill: (bill: Omit<Bill, 'id' | 'status'>) => void;
  deleteBill: (id: string) => void;
  updateBillStatus: (id: string, status: 'paid' | 'unpaid') => void;
  filter: { customerId: string | null };
  clearFilter: () => void;
}

const InvoiceListView: React.FC<InvoiceListViewProps> = (props) => {
  const navigate = useNavigate();
  
  // Wrapper to pass navigation handler
  const handleRowClick = (patientId: string) => {
      navigate(`/billing/record/${patientId}`);
  };

  return <BillsManager {...props} onRowClick={handleRowClick} />;
};

export default InvoiceListView;

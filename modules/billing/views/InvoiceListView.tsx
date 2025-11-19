
import React from 'react';
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
  return <BillsManager {...props} />;
};

export default InvoiceListView;


import React from 'react';
import { Payments } from './Invoices';
import { Bill, Customer } from '../../../types';

interface PaymentsViewProps {
  bills: Bill[];
  customers: Customer[];
  updateBillStatus: (id: string, status: 'paid' | 'unpaid') => void;
}

const PaymentsView: React.FC<PaymentsViewProps> = (props) => {
  return <Payments {...props} />;
};

export default PaymentsView;

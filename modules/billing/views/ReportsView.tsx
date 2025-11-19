
import React from 'react';
import { Reports } from './Invoices';
import { Bill, Customer } from '../../../types';

interface ReportsViewProps {
  bills: Bill[];
  customers: Customer[];
}

const ReportsView: React.FC<ReportsViewProps> = (props) => {
  return <Reports {...props} />;
};

export default ReportsView;

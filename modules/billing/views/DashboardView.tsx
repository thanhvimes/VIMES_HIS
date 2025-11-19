
import React from 'react';
import { Overview } from './Invoices';
import { Bill, Customer } from '../../../types';

interface DashboardViewProps {
  bills: Bill[];
  customers: Customer[];
}

const DashboardView: React.FC<DashboardViewProps> = (props) => {
  return <Overview {...props} />;
};

export default DashboardView;

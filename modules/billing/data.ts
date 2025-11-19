
import { Bill, Customer } from '../../types';

export const mockCustomers: Customer[] = [
    { id: 'C001', name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', address: '123 Đường Giải Phóng, Hà Nội' },
    { id: 'C002', name: 'Trần Thị Bích', email: 'bich.tran@example.com', address: '456 Đường Minh Khai, Hà Nội' },
    { id: 'C003', name: 'Lê Hoàng Cường', email: 'cuong.le@example.com', address: '789 Đường Trường Chinh, Hà Nội' },
    { id: 'C004', name: 'Phạm Thị Dung', email: 'dung.pham@example.com', address: '101 Đường Láng, Hà Nội' },
];

export const mockBills: Bill[] = [
    { id: 'INV001', customerId: 'C001', date: '2023-10-27', consumption: 150, cost: 350000, status: 'paid' },
    { id: 'INV002', customerId: 'C002', date: '2023-10-27', consumption: 80, cost: 200000, status: 'unpaid' },
    { id: 'INV003', customerId: 'C003', date: '2023-10-26', consumption: 300, cost: 750000, status: 'paid' },
    { id: 'INV004', customerId: 'C004', date: '2023-10-25', consumption: 60, cost: 150000, status: 'paid' },
    { id: 'INV005', customerId: 'C001', date: '2023-09-27', consumption: 140, cost: 320000, status: 'paid' },
    { id: 'INV006', customerId: 'C002', date: '2023-09-27', consumption: 90, cost: 220000, status: 'paid' },
];

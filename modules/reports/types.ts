
import React from 'react';

// Dữ liệu bộ lọc được truyền từ FilterComponent sang ContentComponent
export interface FilterValues {
    [key: string]: any;
}

// Interface mà mỗi file báo cáo BẮT BUỘC phải tuân theo
export interface ReportDefinition {
    id: string;
    title: string;
    description?: string;
    module: 'reception' | 'consultation' | 'pharmacy' | 'billing' | 'admin' | 'general' | 'insurance'; // Phân nhóm module
    
    // Component hiển thị bộ lọc (bên phải, phía trên)
    // onFilterChange: gọi khi người dùng thay đổi giá trị nhưng chưa bấm "Xem"
    // onRun: gọi khi người dùng bấm nút "Xuất báo cáo"
    FilterComponent: React.FC<{
        onRun: (filters: FilterValues) => void;
    }>;

    // Component hiển thị nội dung báo cáo (bên phải, phía dưới)
    // Nhận vào filters đã được submit
    ContentComponent: React.FC<{
        filters: FilterValues | null;
    }>;
}

export interface ReportGroup {
    id: string;
    label: string;
    reports: ReportDefinition[];
}
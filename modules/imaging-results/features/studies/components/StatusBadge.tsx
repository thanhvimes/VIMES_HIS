import React from 'react';
import { CheckCircle, FileText, Clock } from 'lucide-react';
import { UnifiedItem } from '../types';

export const StatusBadge: React.FC<{ item: UnifiedItem }> = ({ item }) => {
  if (item.status === 'REPORT_SIGNED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 whitespace-nowrap shadow-sm">
        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        Đã Ký Số
      </span>
    );
  }
  if (item.status === 'REPORT_DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap shadow-sm">
        <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        Đã Lưu Nháp
      </span>
    );
  }
  if (item.status === 'UNREPORTED' || item.type === 'PACS' || item.status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 whitespace-nowrap shadow-sm">
        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
        Chờ Đọc KQ
      </span>
    );
  }
  if (item.status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
        <Clock className="w-3 h-3 text-slate-500" />
        Chờ Chụp
      </span>
    );
  }
  if (item.status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Đang Chụp
      </span>
    );
  }
  return null;
};

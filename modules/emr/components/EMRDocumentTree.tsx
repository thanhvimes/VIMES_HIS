import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Lock, 
  FileHeart, 
  Stethoscope, 
  Activity, 
  FlaskConical, 
  Scan, 
  Scissors, 
  Users, 
  FileCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { EMRDocumentItem, EMRDocumentCategory } from '../types';
import { EMR_DOCUMENT_CATEGORIES } from '../constants';

interface EMRDocumentTreeProps {
  documents: EMRDocumentItem[];
  selectedDocumentId?: string;
  onSelectDocument: (doc: EMRDocumentItem) => void;
  recordNumber: string;
  admissionDate: string;
}

const getCategoryIcon = (category: EMRDocumentCategory) => {
  switch (category) {
    case 'administrative': return <Users className="w-4 h-4 text-blue-500" />;
    case 'medical_record': return <FileHeart className="w-4 h-4 text-rose-500" />;
    case 'treatment_sheets': return <Stethoscope className="w-4 h-4 text-emerald-500" />;
    case 'care_sheets': return <Activity className="w-4 h-4 text-amber-500" />;
    case 'lab_results': return <FlaskConical className="w-4 h-4 text-purple-500" />;
    case 'imaging_results': return <Scan className="w-4 h-4 text-indigo-500" />;
    case 'surgery_procedure': return <Scissors className="w-4 h-4 text-cyan-500" />;
    case 'consultation': return <Users className="w-4 h-4 text-orange-500" />;
    case 'discharge_summary': return <FileCheck className="w-4 h-4 text-teal-500" />;
    default: return <FileText className="w-4 h-4 text-slate-500" />;
  }
};

export const EMRDocumentTree: React.FC<EMRDocumentTreeProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  recordNumber,
  admissionDate,
}) => {
  // Quản lý trạng thái mở/đóng từng nhóm thư mục
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Root Node: Hồ sơ đợt điều trị */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
              {recordNumber}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nhập viện: {admissionDate}
            </p>
          </div>
        </div>
      </div>

      {/* Cây danh mục tài liệu */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {EMR_DOCUMENT_CATEGORIES.map(category => {
          const categoryDocs = documents.filter(d => d.category === category.id);
          const isCollapsed = !!collapsedCategories[category.id];
          const hasDocs = categoryDocs.length > 0;

          return (
            <div key={category.id} className="space-y-0.5">
              {/* Category Header Node */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors text-xs font-medium ${
                  hasDocs 
                    ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80' 
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-slate-400">
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                  <span className="shrink-0">{getCategoryIcon(category.id as EMRDocumentCategory)}</span>
                  <span className="truncate">{category.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  hasDocs 
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' 
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  {categoryDocs.length}
                </span>
              </button>

              {/* Documents under Category */}
              {!isCollapsed && hasDocs && (
                <div className="pl-6 pr-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4 my-1">
                  {categoryDocs.map(doc => {
                    const isSelected = doc.id === selectedDocumentId;
                    const isSigned = doc.status === 'signed';

                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => onSelectDocument(doc)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-all text-xs group ${
                          isSelected
                            ? 'bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                          <span className="truncate">{doc.name}</span>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0 ml-1">
                          {isSigned ? (
                            <span title="Đã ký số điện tử">
                              <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                            </span>
                          ) : doc.isLocked ? (
                            <span title="Đã khóa">
                              <Lock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                            </span>
                          ) : (
                            <span title="Chưa ký số">
                              <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

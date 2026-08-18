import React from 'react';
import { Database, AlertCircle, Activity, ExternalLink, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UnifiedItem, formatStudyDate } from '../types';
import { StatusBadge } from './StatusBadge';
import { ModalityBadge } from './ModalityBadge';

interface StudyTableProps {
  unifiedList: UnifiedItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean | string;
  onClearFilters: () => void;
  onSelectStudy: (study: any) => void;
  onUpdateMWLStatus: (id: string, newStatus: string) => void;
  onOpenQuickViewer?: (study: any) => void;
}

export const StudyTable: React.FC<StudyTableProps> = ({
  unifiedList,
  loading,
  error,
  hasActiveFilters,
  onClearFilters,
  onSelectStudy,
  onUpdateMWLStatus,
  onOpenQuickViewer,
}) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Table header info */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          {loading ? 'Đang tải...' : `${unifiedList.length} ca bệnh`}
          {hasActiveFilters && !loading && (
            <span className="ml-1 text-[10px] font-normal text-blue-500 dark:text-blue-400 normal-case tracking-normal">
              (đã lọc)
            </span>
          )}
        </span>
        {error && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 dark:text-slate-500">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Đang tải dữ liệu từ hệ thống...</p>
        </div>
      ) : unifiedList.length === 0 ? (
        <div className="p-16 text-center space-y-3">
          <Database className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
          <p className="text-base font-bold text-slate-500 dark:text-slate-400">Không tìm thấy ca bệnh phù hợp</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Hãy thử mở rộng phạm vi ngày hoặc thay đổi bộ lọc.</p>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-700 transition cursor-pointer"
            >
              Xóa bộ lọc để xem tất cả
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/90 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3.5 font-bold">Trạng Thái</th>
                <th className="py-2.5 px-3.5 font-bold">Modality</th>
                <th className="py-2.5 px-3.5 font-bold">Mã BN</th>
                <th className="py-2.5 px-3.5 font-bold">Tên Bệnh Nhân</th>
                <th className="py-2.5 px-3.5 font-bold">Giới Tính</th>
                <th className="py-2.5 px-3.5 font-bold">Mô Tả Ca Chụp</th>
                <th className="py-2.5 px-3.5 font-bold">Accession No.</th>
                <th className="py-2.5 px-3.5 font-bold">Số Series</th>
                <th className="py-2.5 px-3.5 font-bold">Ngày / Giờ</th>
                <th className="py-2.5 px-3.5 font-bold">BS Chỉ Định</th>
                <th className="py-2.5 px-4 font-bold text-right sticky right-0 bg-slate-50 dark:bg-slate-900 z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)] border-l border-slate-200 dark:border-slate-800">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {unifiedList.map((item, idx) => (
                <tr
                  key={item.patientId || item.id || `item-${idx}`}
                  className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 group"
                >
                  <td className="py-2 px-3.5">
                    <StatusBadge item={item} />
                  </td>
                  <td className="py-2 px-3.5">
                    <ModalityBadge mod={item.modality} />
                  </td>
                  <td className="py-2 px-3.5 font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">
                    {item.patientId}
                  </td>
                  <td className="py-2 px-3.5">
                    {item.type === 'PACS' || item.status === 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          onSelectStudy({
                            studyInstanceUid: item.id,
                            patientId: item.patientId,
                            patientName: item.patientName?.toUpperCase(),
                            modality: item.modality,
                            studyDate: item.studyDate,
                            description: item.description,
                            accessionNumber: item.accessionNumber,
                            referringPhysician: item.referringPhysician,
                            gender: item.gender,
                            raw: item.raw,
                          });
                        }}
                        className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition text-left cursor-pointer flex items-center gap-1 group-hover:underline uppercase"
                      >
                        {item.patientName?.toUpperCase()}
                      </button>
                    ) : (
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm uppercase">
                        {item.patientName?.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3.5 text-slate-500 dark:text-slate-400 text-xs">
                    {item.gender === 'M' ? '♂ Nam' : item.gender === 'F' ? '♀ Nữ' : item.gender}
                  </td>
                  <td className="py-2 px-3.5 text-slate-700 dark:text-slate-300 max-w-[220px] truncate text-xs font-medium">
                    {item.description}
                  </td>
                  <td className="py-2 px-3.5 font-mono font-semibold text-slate-500 dark:text-slate-400 text-xs">
                    {item.accessionNumber}
                  </td>
                  <td className="py-2 px-3.5 text-slate-500 dark:text-slate-400 text-xs">
                    {item.seriesCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px]">
                        {item.seriesCount} Series
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3.5 font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                    {formatStudyDate(item.studyDate)}
                  </td>
                  <td className="py-2 px-3.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                    {item.referringPhysician}
                  </td>

                  {/* Freeze Right Action Column */}
                  <td className="py-2 px-4 text-right space-x-1.5 whitespace-nowrap sticky right-0 bg-white/95 dark:bg-[#111827]/95 group-hover:bg-slate-50 dark:group-hover:bg-[#152033] backdrop-blur-md z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.4)] border-l border-slate-100 dark:border-slate-800/80">
                    {/* MWL actions */}
                    {item.status === 'SCHEDULED' && (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic hidden sm:inline">
                          Chờ chụp
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateMWLStatus(item.id, 'IN_PROGRESS');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] font-bold transition shadow-sm cursor-pointer"
                        >
                          Bắt Đầu
                        </button>
                      </div>
                    )}
                    {item.status === 'IN_PROGRESS' && (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 italic hidden sm:inline">
                          Đang chụp...
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateMWLStatus(item.id, 'COMPLETED');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold transition shadow-sm cursor-pointer"
                        >
                          Hoàn Thành
                        </button>
                      </div>
                    )}

                    {/* PACS & COMPLETED actions */}
                    {(item.type === 'PACS' || item.status === 'COMPLETED') && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenQuickViewer) {
                              onOpenQuickViewer(item);
                            } else {
                              navigate(
                                `/viewer?studyId=${encodeURIComponent(item.id)}&patientName=${encodeURIComponent(item.patientName || '')}&patientId=${encodeURIComponent(item.patientId || '')}&modality=${encodeURIComponent(item.modality || '')}&accessionNumber=${encodeURIComponent(item.accessionNumber || '')}`
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition inline-flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                          title="Xem nhanh hình ảnh chuẩn DICOM dạng Dialog cho Bác sĩ Điều Trị"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem Phim
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `http://localhost:8080/viewer?StudyInstanceUIDs=${item.id}`,
                              'VIMES_PACS_VIEWER_3D'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-[#006D77] dark:text-[#80CBC4] border border-teal-200 dark:border-teal-800 text-xs font-bold transition inline-flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                          title="Mở trạm đọc ảnh ViMES PACS 3D MPR & Volume Rendering"
                        >
                          <ExternalLink className="w-3 h-3" /> ViMES 3D
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudy({
                              studyInstanceUid: item.id,
                              patientId: item.patientId,
                              patientName: item.patientName,
                              modality: item.modality,
                              studyDate: item.studyDate,
                              description: item.description,
                              accessionNumber: item.accessionNumber,
                              referringPhysician: item.referringPhysician,
                              gender: item.gender,
                              raw: item.raw,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1a3461] hover:bg-[#1e3f7a] text-white border border-[#2a4a7f] text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          title="Mở không gian nhập kết quả CĐHA"
                        >
                          <FileText className="w-3.5 h-3.5" /> Đọc KQ
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { ClinicalEvent } from '../types';
import { 
  LogIn, 
  Stethoscope, 
  FlaskConical, 
  Scan, 
  Scissors, 
  Users, 
  LogOut, 
  PenTool, 
  AlertCircle,
  Clock
} from 'lucide-react';

interface EMRTimelineViewProps {
  events: ClinicalEvent[];
  onSelectEventDoc?: (docId: string) => void;
}

const getEventBadge = (type: ClinicalEvent['type']) => {
  switch (type) {
    case 'admission':
      return { icon: <LogIn className="w-3.5 h-3.5" />, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' };
    case 'diagnosis':
    case 'order':
      return { icon: <Stethoscope className="w-3.5 h-3.5" />, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
    case 'lab':
      return { icon: <FlaskConical className="w-3.5 h-3.5" />, bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' };
    case 'imaging':
      return { icon: <Scan className="w-3.5 h-3.5" />, bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' };
    case 'procedure':
      return { icon: <Scissors className="w-3.5 h-3.5" />, bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' };
    case 'consultation':
      return { icon: <Users className="w-3.5 h-3.5" />, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
    case 'discharge':
      return { icon: <LogOut className="w-3.5 h-3.5" />, bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' };
    case 'sign':
      return { icon: <PenTool className="w-3.5 h-3.5" />, bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' };
    default:
      return { icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
  }
};

export const EMRTimelineView: React.FC<EMRTimelineViewProps> = ({ events, onSelectEventDoc }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
        Chưa có sự kiện lâm sàng nào được ghi nhận.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {events.map(event => {
        const badge = getEventBadge(event.type);
        const isCritical = event.priority === 'critical';
        const isImportant = event.priority === 'important';

        return (
          <div key={event.id} className="relative group">
            {/* Timeline Icon Node */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${badge.bg}`}>
              {badge.icon}
            </div>

            {/* Event Card */}
            <div className={`p-3 rounded-lg border text-xs transition-all ${
              isCritical
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                : isImportant
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h6 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {event.title}
                  </h6>
                  {isCritical && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded">
                      <AlertCircle className="w-2.5 h-2.5" /> Khẩn
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {event.timestamp}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                {event.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="font-medium text-slate-600 dark:text-slate-400 truncate">
                  {event.performedByName} • {event.departmentName}
                </span>

                {event.documentId && onSelectEventDoc && (
                  <button
                    type="button"
                    onClick={() => onSelectEventDoc(event.documentId!)}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-medium ml-2 shrink-0"
                  >
                    Xem văn bản →
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


import React from 'react';
import { Patient, PatientStatus } from '../../types';

interface PatientCardProps {
  patient: Patient;
  onCall?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  onTogglePriority?: (id: string) => void;
  onTransfer?: (id: string) => void; 
  onSchedule?: (id: string) => void;
  isCompact?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onCall, 
  onComplete, 
  onSkip, 
  onTogglePriority,
  onTransfer,
  onSchedule,
  isCompact = false,
  isSelectable = false,
  isSelected = false,
  onSelect
}) => {
  
  const getStatusColor = (status: PatientStatus, isPriority: boolean) => {
    if (isPriority && (status === PatientStatus.WAITING)) return "border-amber-500 bg-amber-50";
    switch (status) {
        case PatientStatus.SERVING: return "border-green-500 bg-green-50 shadow-green-100";
        case PatientStatus.CONCLUSION: return "border-purple-500 bg-purple-50";
        case PatientStatus.SKIPPED: return "border-red-300 bg-slate-50 opacity-60 grayscale-[0.5]";
        case PatientStatus.COMPLETED: return "border-slate-300 bg-white opacity-50";
        case PatientStatus.SCHEDULED: return "border-cyan-400 bg-cyan-50";
        default: return "border-blue-500 bg-white"; 
    }
  };

  const statusClasses = getStatusColor(patient.status, !!patient.isPriority);
  const birthYear = patient.birthYear || (new Date().getFullYear() - patient.age);
  const codeFontSize = patient.code.length > 4 ? 'text-lg' : 'text-2xl';

  return (
    <div className={`relative flex overflow-hidden rounded-xl border-l-[6px] shadow-sm hover:shadow-md transition-all duration-200 ${statusClasses} mb-3 cursor-pointer group ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-y border-r border-slate-100'}`}
         onClick={() => isSelectable && onSelect && onSelect(patient.id)}>
      
      {isSelectable && (
          <div className="flex items-center justify-center pl-3 pr-1">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                  {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                  )}
              </div>
          </div>
      )}

      <div className={`flex w-20 flex-col items-center justify-center border-r border-slate-100/50 p-2 
          ${patient.status === PatientStatus.SERVING ? 'text-green-700' : 
            patient.isPriority ? 'text-amber-700' : 'text-slate-700'}`}>
        <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">STT</span>
        <span className={`font-mono font-black tracking-tighter ${codeFontSize}`}>{patient.code}</span>
      </div>

      <div className="flex-1 flex flex-col justify-center p-3 pl-4 min-w-0">
        <div className="flex items-center gap-2 mb-1">
            <h3 className={`truncate text-sm md:text-base font-bold uppercase ${patient.status === PatientStatus.COMPLETED ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {patient.name}
            </h3>
            {patient.isPriority && (
                <span className="flex-shrink-0 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 border border-amber-200">
                    Ưu tiên
                </span>
            )}
        </div>
        
        {!isCompact && (
             <div className="text-xs text-slate-500 truncate space-y-0.5 font-medium">
                <div className="flex items-center gap-2">
                    <span className={`font-bold ${patient.gender === 'Nam' ? 'text-blue-600' : 'text-rose-500'}`}>{patient.gender || 'Nam'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>NS: {birthYear}</span>
                    {patient.phone && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="font-mono">{patient.phone}</span>
                        </>
                    )}
                </div>
                {patient.reason && (
                    <div className="text-slate-400 truncate max-w-[200px]">
                        {patient.reason}
                    </div>
                )}
                {patient.status === PatientStatus.SCHEDULED && patient.appointmentTime && (
                    <div className="text-cyan-600 font-bold flex items-center gap-1 mt-1 bg-cyan-50 w-fit px-2 py-0.5 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        {new Date(patient.appointmentTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </div>
                )}
             </div>
        )}
      </div>

      {!isSelectable && (
        <div className="flex items-center pr-2 gap-1">
            {(patient.status === PatientStatus.WAITING || patient.status === PatientStatus.CONCLUSION || patient.status === PatientStatus.SKIPPED) && onCall && (
                <button 
                onClick={(e) => { e.stopPropagation(); onCall(patient.id); }}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-blue-100 text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white hover:shadow-md transition-all active:scale-95"
                title="Gọi vào khám"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                </button>
            )}

             {patient.status === PatientStatus.WAITING && onSchedule && (
                <button 
                onClick={(e) => { e.stopPropagation(); onSchedule(patient.id); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-cyan-100 text-cyan-600 hover:bg-cyan-50 transition-colors"
                title="Hẹn lịch"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                </button>
            )}

            {patient.status === PatientStatus.SERVING && (
                <div className="flex flex-col gap-1 pr-1">
                    {onCall && (
                        <button onClick={(e) => { e.stopPropagation(); onCall(patient.id); }} className="p-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200" title="Gọi lại">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                    )}
                    {onComplete && (
                        <button onClick={(e) => { e.stopPropagation(); onComplete(patient.id); }} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Hoàn thành">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                    )}
                </div>
            )}
            
            {(patient.status === PatientStatus.WAITING) && (
                <div className="flex flex-col gap-1">
                    {onTogglePriority && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onTogglePriority(patient.id); }}
                            className={`p-1 rounded hover:bg-slate-100 ${patient.isPriority ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                    )}
                    {onSkip && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSkip(patient.id); }}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

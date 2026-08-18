import React from 'react';
import {
  Zap,
  PlusCircle,
  ClipboardList,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Server,
  CheckCircle2
} from 'lucide-react';
import { MedicalTemplate } from '../types';
import { DEFAULT_DEVICES, TECHNOLOGIST_LIST, DOCTOR_LIST } from '../data/equipmentData';

interface ClinicalSidebarProps {
  isMiniPacsOpen: boolean;
  activeSidebarTab: 'templates' | 'phrases' | 'info' | 'execution';
  setActiveSidebarTab: (tab: 'templates' | 'phrases' | 'info' | 'execution') => void;
  // Templates
  templateSearch: string;
  setTemplateSearch: (val: string) => void;
  filteredTemplates: MedicalTemplate[];
  onApplyTemplate: (tpl: MedicalTemplate) => void;
  // Phrases
  phrasesList: string[];
  onAppendPhrase: (phrase: string) => void;
  // Clinical Requisition Info
  icd10?: string;
  clinicalDiagnosis?: string;
  description?: string;
  orderingDept?: string;
  referringPhysician?: string;
  docNo?: number | string;
  patientId: string;
  accessionNumber?: string;
  healthInsuranceCard?: string;
  // Execution Info
  isSigned: boolean;
  readingDoctor: string;
  setReadingDoctor: (doc: string) => void;
  readingTime: string;
  setReadingTime: (time: string) => void;
  approvingDoctor: string;
  setApprovingDoctor: (doc: string) => void;
  approvalTime: string;
  setApprovalTime: (time: string) => void;
  modality: string;
  equipment: string;
  setEquipment: (eq: string) => void;
  procedureRoom: string;
  setProcedureRoom: (room: string) => void;
  executionTime: string;
  setExecutionTime: (time: string) => void;
  technologist: string;
  setTechnologist: (ktv: string) => void;
  protocol: string;
  setProtocol: (proto: string) => void;
  onSaveExecutionConfig: () => void;
}

export const ClinicalSidebar: React.FC<ClinicalSidebarProps> = ({
  isMiniPacsOpen,
  activeSidebarTab,
  setActiveSidebarTab,
  templateSearch,
  setTemplateSearch,
  filteredTemplates,
  onApplyTemplate,
  phrasesList,
  onAppendPhrase,
  icd10,
  clinicalDiagnosis,
  description,
  orderingDept,
  referringPhysician,
  docNo,
  patientId,
  accessionNumber,
  healthInsuranceCard,
  isSigned,
  readingDoctor,
  setReadingDoctor,
  readingTime,
  setReadingTime,
  approvingDoctor,
  setApprovingDoctor,
  approvalTime,
  setApprovalTime,
  modality,
  equipment,
  setEquipment,
  procedureRoom,
  setProcedureRoom,
  executionTime,
  setExecutionTime,
  technologist,
  setTechnologist,
  protocol,
  setProtocol,
  onSaveExecutionConfig
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#070e1c] border-r border-slate-200 dark:border-[#152948] flex flex-col shrink-0 overflow-hidden transition-all duration-300 ${
        isMiniPacsOpen
          ? 'w-72 sm:w-80 xl:w-[340px] 2xl:w-[360px]'
          : 'w-80 sm:w-96 xl:w-[420px] 2xl:w-[460px]'
      }`}
    >
      {/* Panel Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#152948] bg-slate-50 dark:bg-[#060c18] text-[11px] font-bold shrink-0">
        <button
          onClick={() => setActiveSidebarTab('templates')}
          className={`flex-1 py-2.5 px-1.5 text-center transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
            activeSidebarTab === 'templates'
              ? 'border-b-2 border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 bg-white dark:bg-[#09152b] font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#09152b]/50'
          }`}
          title="Mẫu Báo Cáo Chuẩn"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Mẫu</span>
        </button>
        <button
          onClick={() => setActiveSidebarTab('phrases')}
          className={`flex-1 py-2.5 px-1.5 text-center transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
            activeSidebarTab === 'phrases'
              ? 'border-b-2 border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 bg-white dark:bg-[#09152b] font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#09152b]/50'
          }`}
          title="Cụm Từ Mô Tả Nhanh"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Cụm Từ</span>
        </button>
        <button
          onClick={() => setActiveSidebarTab('info')}
          className={`flex-1 py-2.5 px-1.5 text-center transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
            activeSidebarTab === 'info'
              ? 'border-b-2 border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 bg-white dark:bg-[#09152b] font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#09152b]/50'
          }`}
          title="Thông Tin Chỉ Định Y Lệnh HIS"
        >
          <ClipboardList className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Chỉ Định</span>
        </button>
        <button
          onClick={() => setActiveSidebarTab('execution')}
          className={`flex-1 py-2.5 px-1.5 text-center transition flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
            activeSidebarTab === 'execution'
              ? 'border-b-2 border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 bg-white dark:bg-[#09152b] font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#09152b]/50'
          }`}
          title="Quản Lý Thông Tin Thực Hiện (Bác sĩ, Thời gian, Máy chụp, KTV)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Thực Hiện</span>
        </button>
      </div>

      {/* TAB CONTENT: Templates List */}
      {activeSidebarTab === 'templates' && (
        <div className="flex-1 flex flex-col p-2.5 overflow-hidden space-y-2.5">
          {/* Search template */}
          <input
            type="text"
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            placeholder="Tìm mẫu bệnh lý..."
            className="w-full bg-slate-50 dark:bg-[#050a14] border border-slate-300 dark:border-[#1a3458] rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          {/* Quick Dot Phrase Hint */}
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-[#091830] border border-sky-200 dark:border-sky-500/30 text-[10px] space-y-0.5">
            <span className="font-extrabold text-sky-800 dark:text-sky-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" /> Gõ tắt:
            </span>
            <p className="text-slate-600 dark:text-slate-300 font-mono text-[9px]">
              <b className="text-slate-900 dark:text-white">.bt</b>: Bình thường ·{' '}
              <b className="text-slate-900 dark:text-white">.soi</b>: Sỏi ·{' '}
              <b className="text-slate-900 dark:text-white">.ruotthua</b>: Viêm RT
            </p>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => onApplyTemplate(tpl)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09152b] hover:bg-sky-50 dark:hover:bg-[#0e2242] border border-slate-200 dark:border-[#1a335a] hover:border-sky-400 cursor-pointer transition shadow-sm group"
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition truncate">
                    {tpl.name}
                  </span>
                  <span
                    className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ${
                      tpl.tag === 'BÌNH THƯỜNG'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {tpl.tag}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight font-sans">
                  {tpl.impression}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Quick Phrases */}
      {activeSidebarTab === 'phrases' && (
        <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5 custom-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
            Nhấn để chèn nhanh vào Mô Tả:
          </span>
          {phrasesList.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => onAppendPhrase(phrase)}
              className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-[#09152b] hover:bg-emerald-50 dark:hover:bg-[#0e2a38] border border-slate-200 dark:border-[#1a335a] hover:border-emerald-400 text-[11px] text-slate-800 dark:text-slate-200 transition shadow-sm flex items-start gap-1.5 group cursor-pointer"
            >
              <PlusCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span className="leading-snug">{phrase}</span>
            </button>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Requisition Info (Chỉ Định Lâm Sàng) */}
      {activeSidebarTab === 'info' && (
        <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 text-xs custom-scrollbar">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09152b] border border-slate-200 dark:border-[#1a335a] space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Chỉ Định Lâm Sàng
              </span>
              {icd10 && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  ICD: {icd10}
                </span>
              )}
            </div>
            <div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                Chẩn đoán lâm sàng:
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-[11px] leading-snug mt-0.5">
                {clinicalDiagnosis || 'Chẩn đoán hình ảnh tổng quát theo y lệnh'}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                Dịch vụ yêu cầu:
              </span>
              <p className="font-bold text-sky-700 dark:text-sky-300 text-[11px] leading-snug mt-0.5">
                {description || 'Chẩn đoán hình ảnh'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                  Khoa chỉ định:
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                  {orderingDept || 'Khoa Khám Bệnh'}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                  BS Chỉ định:
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                  {referringPhysician || 'BS. Lê Hoàng Cường'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                  Số hồ sơ:
                </span>
                <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  {docNo || patientId}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                  Mã tiếp nhận (Accession):
                </span>
                <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  {accessionNumber || 'N/A'}
                </p>
              </div>
            </div>
            {healthInsuranceCard && (
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                  Mã thẻ BHYT:
                </span>
                <p className="font-mono text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tracking-wider">
                  {healthInsuranceCard}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Execution & Equipment Management (Thực Hiện) */}
      {activeSidebarTab === 'execution' && (
        <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 text-xs custom-scrollbar">
          {/* Section 1: Doctors & Sign/Approval Timestamps */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09152b] border border-slate-200 dark:border-[#1a335a] space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Bác Sĩ Đọc &amp; Duyệt
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isSigned
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {isSigned ? 'ĐÃ DUYỆT KÝ' : 'ĐANG XỬ LÝ'}
              </span>
            </div>

            {/* BS Đọc */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">
                Bác sĩ đọc kết quả:
              </label>
              <select
                value={readingDoctor}
                disabled={isSigned}
                onChange={(e) => setReadingDoctor(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {DOCTOR_LIST.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Thời gian đọc */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Thời gian đọc:
                </label>
                <button
                  onClick={() =>
                    setReadingTime(
                      new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
                        ' ' +
                        new Date().toLocaleDateString('vi-VN')
                    )
                  }
                  className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                >
                  Giờ hiện tại
                </button>
              </div>
              <input
                type="text"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* BS Duyệt */}
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">
                Bác sĩ duyệt kết quả:
              </label>
              <select
                value={approvingDoctor}
                disabled={isSigned}
                onChange={(e) => setApprovingDoctor(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {DOCTOR_LIST.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Thời gian duyệt */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Thời gian duyệt:
                </label>
                <button
                  onClick={() =>
                    setApprovalTime(
                      new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
                        ' ' +
                        new Date().toLocaleDateString('vi-VN')
                    )
                  }
                  className="text-[9px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Giờ hiện tại
                </button>
              </div>
              <input
                type="text"
                value={approvalTime}
                onChange={(e) => setApprovalTime(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Equipment & Acquisition Timing */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#09152b] border border-slate-200 dark:border-[#1a335a] space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Thiết Bị &amp; Thời Gian Chụp
              </span>
              <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                {modality}
              </span>
            </div>

            {/* Máy thực hiện / Scanner */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">
                Máy / Thiết bị thực hiện:
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {(DEFAULT_DEVICES[modality.toUpperCase()] || DEFAULT_DEVICES['US']).map((eq, i) => (
                  <option key={i} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>

            {/* Phòng thực hiện */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">
                Phòng máy / Bộ phận:
              </label>
              <input
                type="text"
                value={procedureRoom}
                onChange={(e) => setProcedureRoom(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Thời gian thực hiện / chụp */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Thời gian thực hiện (chụp):
                </label>
                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-mono font-bold">HIS / MWL</span>
              </div>
              <input
                type="text"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Kỹ thuật viên chụp */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">
                Kỹ thuật viên thực hiện (KTV):
              </label>
              <select
                value={technologist}
                onChange={(e) => setTechnologist(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TECHNOLOGIST_LIST.map((k, i) => (
                  <option key={i} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Protocol / Kỹ thuật */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5 uppercase">
                Kỹ thuật / Protocol chụp:
              </label>
              <input
                type="text"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full bg-white dark:bg-[#060c18] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Section 3: Save Action */}
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-[#061824] border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Đồng bộ 2 chiều ViMES HIS</span>
            </div>
            <button
              onClick={onSaveExecutionConfig}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] transition shadow-xs cursor-pointer"
            >
              Lưu Cấu Hình
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

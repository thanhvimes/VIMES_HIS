import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { documentSignatureService, SignaturePlaceholder } from '../../../services/documentSignatureService';
import { StudioTemplate, StudioVersion } from '../../../services/templateStudioService';
import { TrashIcon, CheckCircleIcon, SparklesIcon } from '../../../components/Icons';

export interface SignaturePlaceholdersPanelProps {
  template: StudioTemplate;
  version: StudioVersion;
  canEdit: boolean;
}

interface RoleOption {
  value: string;
  label: string;
  defaultOrder: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'BAC_SI_KHAM', label: '🩺 Bác sĩ khám / Kê đơn', defaultOrder: 1, x1: 360, y1: 680, x2: 540, y2: 760, color: 'border-blue-500 bg-blue-100 text-blue-800' },
  { value: 'BAC_SI_DIEU_TRI', label: '👨‍⚕️ Bác sĩ điều trị', defaultOrder: 1, x1: 360, y1: 680, x2: 540, y2: 760, color: 'border-teal-500 bg-teal-100 text-teal-800' },
  { value: 'PHAU_THUAT_VIEN', label: '🔪 Phẫu thuật viên chính', defaultOrder: 1, x1: 360, y1: 680, x2: 540, y2: 760, color: 'border-rose-500 bg-rose-100 text-rose-800' },
  { value: 'TRUONG_KHOA', label: '👔 Trưởng khoa / Bộ phận', defaultOrder: 2, x1: 200, y1: 680, x2: 380, y2: 760, color: 'border-indigo-500 bg-indigo-100 text-indigo-800' },
  { value: 'ORG_SEAL', label: '🏥 Dấu mộc viện (HSM)', defaultOrder: 3, x1: 50, y1: 680, x2: 230, y2: 760, color: 'border-amber-500 bg-amber-100 text-amber-800' },
  { value: 'BENH_NHAN_TABLET', label: '✍️ Người bệnh ký Tablet', defaultOrder: 1, x1: 50, y1: 680, x2: 230, y2: 760, color: 'border-purple-500 bg-purple-100 text-purple-800' },
  { value: 'GIAM_DOC_BENH_VIEN', label: '🏛️ Ban Giám Đốc BV', defaultOrder: 3, x1: 360, y1: 100, x2: 540, y2: 180, color: 'border-emerald-500 bg-emerald-100 text-emerald-800' }
];

export const SignaturePlaceholdersPanel: React.FC<SignaturePlaceholdersPanelProps> = ({
  template,
  version,
  canEdit
}) => {
  const [placeholders, setPlaceholders] = useState<SignaturePlaceholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    fieldName: '',
    signerRole: 'BAC_SI_KHAM',
    signingOrder: 1,
    pageIndex: 0,
    x1Pt: 360,
    y1Pt: 680,
    x2Pt: 540,
    y2Pt: 760,
    pageWidthPt: 595, // Standard A4 width (points)
    pageHeightPt: 842, // Standard A4 height (points)
    pageRotation: 0,
    required: true,
  });

  const loadPlaceholders = async () => {
    if (!version?.id) return;
    setLoading(true);
    try {
      const data = await documentSignatureService.listPlaceholders(version.id);
      setPlaceholders(data || []);
    } catch (error: any) {
      console.error('Error loading placeholders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaceholders();
  }, [version?.id]);

  const handleApplyPreset = (preset: RoleOption) => {
    const code = `${preset.value}_SIG`;
    setFormData(prev => ({
      ...prev,
      code,
      fieldName: `Signature_${preset.value}`,
      signerRole: preset.value,
      signingOrder: preset.defaultOrder,
      x1Pt: preset.x1,
      y1Pt: preset.y1,
      x2Pt: preset.x2,
      y2Pt: preset.y2,
    }));
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã vùng ký');
      return;
    }
    if (formData.x2Pt <= formData.x1Pt || formData.y2Pt <= formData.y1Pt) {
      toast.error('Tọa độ vùng ký không hợp lệ (X2 phải lớn hơn X1, Y2 phải lớn hơn Y1)');
      return;
    }

    try {
      if (editingId) {
        await documentSignatureService.updatePlaceholder(editingId, {
          ...formData,
          templateId: template.id,
        });
        toast.success('Đã cập nhật vùng ký số');
      } else {
        await documentSignatureService.createPlaceholder(version.id, {
          ...formData,
          templateId: template.id,
        });
        toast.success('Đã thêm vùng ký số mới');
      }
      setIsAdding(false);
      setEditingId(null);
      loadPlaceholders();
    } catch (error: any) {
      toast.error(error.message || 'Lưu vùng ký số thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vùng ký số này không?')) return;
    try {
      await documentSignatureService.retirePlaceholder(id);
      toast.success('Đã xóa vùng ký số');
      loadPlaceholders();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa vùng ký số');
    }
  };

  const startEdit = (p: SignaturePlaceholder) => {
    setEditingId(p.id);
    setIsAdding(true);
    setFormData({
      code: p.code,
      fieldName: p.fieldName || '',
      signerRole: p.signerRole,
      signingOrder: p.signingOrder || 1,
      pageIndex: p.pageIndex || 0,
      x1Pt: Number(p.x1Pt),
      y1Pt: Number(p.y1Pt),
      x2Pt: Number(p.x2Pt),
      y2Pt: Number(p.y2Pt),
      pageWidthPt: Number(p.pageWidthPt) || 595,
      pageHeightPt: Number(p.pageHeightPt) || 842,
      pageRotation: p.pageRotation || 0,
      required: p.required !== false,
    });
  };

  const isDraft = version?.status === 'DRAFT';

  // Canvas dimensions for visual A4 mock
  const canvasWidth = 320;
  const canvasHeight = (canvasWidth * 842) / 595; // ~452px

  return (
    <div className="p-5 space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              🖋️ Cấu Hình Khung Chữ Ký Điện Tử (PAdES)
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
              Khổ A4: 595 x 842 pt
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác định vị trí con dấu pháp nhân, chữ ký số Bác sĩ SmartCA và chữ ký cảm ứng Tablet người bệnh.
          </p>
        </div>

        {canEdit && isDraft && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                code: 'BAC_SI_SIG',
                fieldName: 'Signature_BAC_SI',
                signerRole: 'BAC_SI_KHAM',
                signingOrder: 1,
                pageIndex: 0,
                x1Pt: 360,
                y1Pt: 680,
                x2Pt: 540,
                y2Pt: 760,
                pageWidthPt: 595,
                pageHeightPt: 842,
                pageRotation: 0,
                required: true,
              });
              setIsAdding(true);
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            + Thêm Khung Ký Tùy Chỉnh
          </button>
        )}
      </div>

      {/* QUICK PRESETS BAR */}
      {canEdit && isDraft && !isAdding && (
        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/60 dark:to-slate-800/40 p-4 rounded-xl border border-blue-100 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2.5">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            1-Click: Thêm nhanh vị trí ô ký chuẩn Bộ Y Tế:
          </span>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FORM ADD / EDIT */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-blue-50/60 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-blue-200 dark:border-blue-900 pb-2">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
              {editingId ? '✏️ Chỉnh Sửa Vị Trí Vùng Ký Số' : '➕ Thêm Khung Vùng Ký Số Mới'}
            </h4>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã định danh vùng ký *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                placeholder="VD: BAC_SI_KHAM_SIG"
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vai trò người ký *
              </label>
              <select
                value={formData.signerRole}
                onChange={e => setFormData({ ...formData, signerRole: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thứ tự ký (Signing Order) *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.signingOrder}
                onChange={e => setFormData({ ...formData, signingOrder: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Coordinate Geometry (Points) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              📐 Tọa độ vùng ký trên trang PDF (Khổ A4 chuẩn 595 x 842 pt):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Trang số (bắt đầu từ 0)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.pageIndex}
                  onChange={e => setFormData({ ...formData, pageIndex: Number(e.target.value) })}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">X1 (Tọa độ trái, pt)</label>
                <input
                  type="number"
                  value={formData.x1Pt}
                  onChange={e => setFormData({ ...formData, x1Pt: Number(e.target.value) })}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Y1 (Tọa độ trên, pt)</label>
                <input
                  type="number"
                  value={formData.y1Pt}
                  onChange={e => setFormData({ ...formData, y1Pt: Number(e.target.value) })}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Kích thước khung</label>
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 py-1.5">
                  {formData.x2Pt - formData.x1Pt} x {formData.y2Pt - formData.y1Pt} pt
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">X2 (Tọa độ phải, pt)</label>
                <input
                  type="number"
                  value={formData.x2Pt}
                  onChange={e => setFormData({ ...formData, x2Pt: Number(e.target.value) })}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Y2 (Tọa độ đáy, pt)</label>
                <input
                  type="number"
                  value={formData.y2Pt}
                  onChange={e => setFormData({ ...formData, y2Pt: Number(e.target.value) })}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-2 pt-3">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={formData.required}
                  onChange={e => setFormData({ ...formData, required: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="reqCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Bắt buộc ký
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              {editingId ? 'Cập Nhật Khung Ký' : 'Lưu Khung Ký Mới'}
            </button>
          </div>
        </form>
      )}

      {/* VISUAL A4 CANVAS & TABLE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: VISUAL A4 CANVAS (4 cols) */}
        <div className="lg:col-span-4 bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              📄 Sơ Đồ Bố Cục Trang A4
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Trang 1/1
            </span>
          </div>

          {/* A4 Sheet Mock */}
          <div 
            className="relative bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-md overflow-hidden"
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          >
            {/* Header lines mock */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 text-center">
              <div className="h-2 w-28 bg-slate-200 dark:bg-slate-800 rounded mx-auto mb-1"></div>
              <div className="h-1.5 w-40 bg-slate-100 dark:bg-slate-800 rounded mx-auto"></div>
            </div>
            
            {/* Body content lines mock */}
            <div className="p-3 space-y-2">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded"></div>
              <div className="h-1.5 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
              <div className="h-1.5 w-4/6 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </div>

            {/* Render Placeholders on Canvas */}
            {placeholders.map((p) => {
              const x1 = Number(p.x1Pt ?? (p as any).x1_pt ?? 0);
              const y1 = Number(p.y1Pt ?? (p as any).y1_pt ?? 0);
              const x2 = Number(p.x2Pt ?? (p as any).x2_pt ?? 180);
              const y2 = Number(p.y2Pt ?? (p as any).y2_pt ?? 80);
              const role = String(p.signerRole ?? (p as any).signer_role ?? 'BAC_SI_KHAM');
              const order = Number(p.signingOrder ?? (p as any).signing_order ?? 1);

              const leftPct = (x1 / 595) * 100;
              const topPct = (y1 / 842) * 100;
              const widthPct = Math.max(((x2 - x1) / 595) * 100, 5);
              const heightPct = Math.max(((y2 - y1) / 842) * 100, 3);

              return (
                <div
                  key={p.id}
                  onClick={() => canEdit && isDraft && startEdit(p)}
                  title={`${p.code || ''} (${role}) - Nhấp để sửa`}
                  className={`absolute border-2 border-dashed rounded flex flex-col items-center justify-center p-0.5 text-center cursor-pointer transition-transform hover:scale-105 ${
                    role.includes('BAC_SI')
                      ? 'border-blue-500 bg-blue-500/20 text-blue-800 dark:text-blue-300'
                      : role.includes('BENH_NHAN')
                      ? 'border-purple-500 bg-purple-500/20 text-purple-800 dark:text-purple-300'
                      : role.includes('SEAL')
                      ? 'border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      : 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                >
                  <span className="text-[9px] font-bold leading-none truncate w-full">
                    #{order} {role.replace('_', ' ')}
                  </span>
                  <span className="text-[7px] text-slate-500 leading-none mt-0.5">
                    {Math.round(x2 - x1)}x{Math.round(y2 - y1)}pt
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            💡 Nhấp trực tiếp vào ô trên sơ đồ để chỉnh sửa vị trí chữ ký.
          </p>
        </div>

        {/* RIGHT: TABLE OF PLACEHOLDERS (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              📋 Danh Sách Khung Ký Đã Thiết Lập ({placeholders.length})
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách vùng ký số…</div>
          ) : placeholders.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Chưa có ô ký số nào.</p>
              <p className="text-xs text-slate-400 mt-1">Bấm các nút "1-Click" ở trên để tự động đặt vùng ký Bác sĩ / Bệnh nhân.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3.5 py-2.5 font-bold">Thứ tự</th>
                    <th className="px-3.5 py-2.5 font-bold">Mã vùng ký</th>
                    <th className="px-3.5 py-2.5 font-bold">Vai trò người ký</th>
                    <th className="px-3.5 py-2.5 font-bold">Tọa độ (X1, Y1) $\rightarrow$ (X2, Y2)</th>
                    <th className="px-3.5 py-2.5 font-bold">Kích thước</th>
                    <th className="px-3.5 py-2.5 font-bold">Bắt buộc</th>
                    {canEdit && isDraft && <th className="px-3.5 py-2.5 text-right font-bold">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {placeholders.map((p) => {
                    const x1 = Number(p.x1Pt ?? (p as any).x1_pt ?? 0);
                    const y1 = Number(p.y1Pt ?? (p as any).y1_pt ?? 0);
                    const x2 = Number(p.x2Pt ?? (p as any).x2_pt ?? 180);
                    const y2 = Number(p.y2Pt ?? (p as any).y2_pt ?? 80);
                    const role = String(p.signerRole ?? (p as any).signer_role ?? 'BAC_SI_KHAM');
                    const order = Number(p.signingOrder ?? (p as any).signing_order ?? 1);
                    const width = Math.round(x2 - x1);
                    const height = Math.round(y2 - y1);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3.5 py-2.5 font-black text-blue-600">
                          #{order}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {p.code}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {role}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-500">
                          ({Math.round(x1)}, {Math.round(y1)}) $\rightarrow$ ({Math.round(x2)}, {Math.round(y2)})
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {width} x {height} pt
                        </td>
                        <td className="px-3.5 py-2.5">
                          {p.required !== false ? (
                            <span className="text-emerald-600 font-bold">✓ Bắt buộc</span>
                          ) : (
                            <span className="text-slate-400">Tùy chọn</span>
                          )}
                        </td>
                        {canEdit && isDraft && (
                          <td className="px-3.5 py-2.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="text-red-600 hover:underline font-semibold"
                            >
                              Xóa
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isDraft && (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 p-3.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              ℹ️ <strong>Lưu ý:</strong> Phiên bản mẫu in này đang ở trạng thái <strong>{version?.status}</strong> nên các vùng ký số đã được khóa bất biến. Nếu cần thay đổi vị trí ô ký, vui lòng tạo một <strong>Bản nháp mới (Clone Version)</strong>.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SignaturePlaceholdersPanel;

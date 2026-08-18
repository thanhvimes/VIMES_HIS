import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StudioTestCase } from '../../../services/templateStudioService';

interface TestCaseEditModalProps {
  open: boolean;
  testCase?: StudioTestCase;
  defaultData?: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: { id?: number; name: string; testType: string; isRequired: boolean; inputData: Record<string, unknown> }) => Promise<void>;
}

export const TestCaseEditModal: React.FC<TestCaseEditModalProps> = ({
  open,
  testCase,
  defaultData,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [testType, setTestType] = useState('NORMAL');
  const [isRequired, setIsRequired] = useState(true);
  const [jsonText, setJsonText] = useState('{}');
  const [jsonError, setJsonError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (testCase) {
        setName(testCase.name);
        setTestType(testCase.testType || 'NORMAL');
        setIsRequired(testCase.isRequired !== false);
        setJsonText(JSON.stringify(testCase.inputData || {}, null, 2));
      } else {
        setName('');
        setTestType('NORMAL');
        setIsRequired(true);
        setJsonText(JSON.stringify(defaultData || {}, null, 2));
      }
      setJsonError('');
    }
  }, [open, testCase, defaultData]);

  if (!open) return null;

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setJsonError('Dữ liệu test phải là một JSON Object');
      } else {
        setJsonError('');
      }
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Cú pháp JSON không hợp lệ');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên test case');
      return;
    }
    let inputData: Record<string, unknown>;
    try {
      inputData = JSON.parse(jsonText);
      if (typeof inputData !== 'object' || Array.isArray(inputData) || inputData === null) {
        throw new Error('Dữ liệu test phải là JSON Object');
      }
    } catch (err) {
      toast.error('Dữ liệu JSON không hợp lệ');
      return;
    }

    setBusy(true);
    try {
      await onSave({
        id: testCase?.id,
        name: name.trim(),
        testType,
        isRequired,
        inputData
      });
      toast.success(testCase ? 'Đã cập nhật test case' : 'Đã tạo mới test case');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi lưu test case');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {testCase ? `Chỉnh sửa Test Case: ${testCase.name}` : 'Thêm Test Case Mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên Test Case <span className="text-red-500">*</span>:
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Bệnh nhân có BHYT, ca cấp cứu"
                  required
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Loại kịch bản:
                <select
                  value={testType}
                  onChange={e => setTestType(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="NORMAL">NORMAL (Tiêu chuẩn)</option>
                  <option value="EMPTY">EMPTY (Rỗng)</option>
                  <option value="LONG_TEXT">LONG_TEXT (Chuỗi dài)</option>
                  <option value="BOUNDARY">BOUNDARY (Giá trị biên)</option>
                  <option value="MANY_ROWS">MANY_ROWS (Nhiều dòng)</option>
                  <option value="CUSTOM">CUSTOM (Tùy biến)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequiredCheck"
              checked={isRequired}
              onChange={e => setIsRequired(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRequiredCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Bắt buộc vượt qua (Quality Gatekeeper) — Mẫu biểu chỉ được gửi duyệt khi test case này PASSED
            </label>
          </div>

          {/* JSON Textarea */}
          <div className="mt-4 flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dữ liệu đầu vào (Input JSON):</span>
              {jsonError ? (
                <span className="text-xs text-red-500 font-medium">⚠️ {jsonError}</span>
              ) : (
                <span className="text-xs text-emerald-600 font-medium">✅ JSON hợp lệ</span>
              )}
            </div>
            <textarea
              value={jsonText}
              onChange={e => handleJsonChange(e.target.value)}
              className="flex-1 resize-none rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy || Boolean(jsonError)}
              className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Đang lưu…' : testCase ? 'Lưu thay đổi' : 'Tạo Test Case'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

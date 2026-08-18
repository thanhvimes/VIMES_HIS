import React, { useState } from 'react';
import { toast } from 'sonner';
import { templateStudioService } from '../../../services/templateStudioService';

interface DocxSnippetHelperModalProps {
  open: boolean;
  onClose: () => void;
  templateCode?: string;
}

export const DocxSnippetHelperModal: React.FC<DocxSnippetHelperModalProps> = ({ open, onClose, templateCode }) => {
  const [activeCategory, setActiveCategory] = useState<'single' | 'table' | 'if' | 'formatters' | 'barcode' | 'signatures' | 'library' | 'errors'>('single');
  const [downloadingPack, setDownloadingPack] = useState(false);

  // States for generators
  const [singlePath, setSinglePath] = useState('patient_name');
  const [tableArray, setTableArray] = useState('services');
  const [tableField, setTableField] = useState('name');
  const [ifField, setIfField] = useState('is_emergency');
  const [ifValue, setIfValue] = useState('true');
  const [ifOp, setIfOp] = useState<'if' | 'ifEQ' | 'ifNE' | 'ifGT' | 'ifLT'>('if');
  const [formatField, setFormatField] = useState('exam_date');
  const [formatType, setFormatType] = useState<'date_dmy' | 'date_hms' | 'currency' | 'percent' | 'upper' | 'lower'>('date_dmy');
  const [barcodeField, setBarcodeField] = useState('patient_code');
  const [barcodeType, setBarcodeType] = useState<'code128' | 'qr'>('code128');

  if (!open) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép: ${text}`);
  };

  const handleDownloadStarterPack = async () => {
    setDownloadingPack(true);
    try {
      const blob = await templateStudioService.downloadStarterPack(templateCode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateCode || 'vimes-template'}-starter-pack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Đã tải gói Starter Design Pack thành công!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải được gói thiết kế');
    } finally {
      setDownloadingPack(false);
    }
  };

  const computedSingleTag = `{d.${singlePath.trim() || 'field'}}`;
  const computedTableTag = `{d.${tableArray.trim() || 'items'}[i].${tableField.trim() || 'name'}}`;
  const computedTableIndexTag = `{d.${tableArray.trim() || 'items'}[i].stt}`;
  const computedIfTag = ifOp === 'if'
    ? `{d.${ifField.trim() || 'condition'}:if(${ifValue}):show}`
    : `{d.${ifField.trim() || 'field'}:${ifOp}('${ifValue}'):show}`;
  
  const computedFormatTag = (() => {
    const f = formatField.trim() || 'field';
    switch (formatType) {
      case 'date_dmy': return `{d.${f}:formatDate('DD/MM/YYYY')}`;
      case 'date_hms': return `{d.${f}:formatDate('HH:mm DD/MM/YYYY')}`;
      case 'currency': return `{d.${f}:formatNumber('#,###')} VNĐ`;
      case 'percent': return `{d.${f}:formatNumber('0.0%')}`;
      case 'upper': return `{d.${f}:upper}`;
      case 'lower': return `{d.${f}:lower}`;
      default: return `{d.${f}}`;
    }
  })();

  const computedBarcodeTag = barcodeType === 'qr'
    ? `{d.${barcodeField.trim() || 'code'}:formatQR}`
    : `{d.${barcodeField.trim() || 'code'}:formatBarcode('code128')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              ⚡
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Bộ trợ giúp Thiết kế DOCX & Snippet Carbone v5
              </h3>
              <p className="text-xs text-slate-500">
                Tạo thẻ Carbone, tra cứu snippet bệnh viện và tải gói Starter Pack
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadStarterPack}
              disabled={downloadingPack}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              📥 {downloadingPack ? 'Đang tạo zip…' : 'Tải Starter Design Pack'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-56 border-r border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <nav className="space-y-1">
              {[
                { key: 'single', label: '1. Thẻ Trường Đơn', icon: '🏷️' },
                { key: 'table', label: '2. Bảng lặp & STT', icon: '📊' },
                { key: 'if', label: '3. Điều kiện (if)', icon: '🔀' },
                { key: 'formatters', label: '4. Bộ định dạng', icon: '⏱️' },
                { key: 'barcode', label: '5. QR & Barcode', icon: '🏁' },
                { key: 'signatures', label: '6. Vùng Chữ ký', icon: '✍️' },
                { key: 'library', label: '7. Snippet Bệnh viện', icon: '🏥' },
                { key: 'errors', label: '8. Hướng dẫn Lỗi', icon: '🛡️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key as any)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    activeCategory === tab.key
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-600'
                      : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* 1. SINGLE FIELD */}
            {activeCategory === 'single' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sinh Thẻ Trường Đơn (Scalar Field)</h4>
                  <p className="text-xs text-slate-500">Chèn giá trị trường từ dữ liệu vào vị trí bất kỳ trong văn bản Word.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Đường dẫn trường (Field Path):
                    <input
                      type="text"
                      value={singlePath}
                      onChange={e => setSinglePath(e.target.value)}
                      placeholder="e.g. patient_name hoặc patient.address"
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div>
                    <span className="text-xs text-slate-500">Tag Carbone tương ứng:</span>
                    <div className="mt-1 font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{computedSingleTag}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(computedSingleTag)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Sao chép Tag
                  </button>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  💡 <strong>Gợi ý:</strong> Đặt chính xác thẻ <code className="text-blue-600">{computedSingleTag}</code> vào trong file Word (.docx). Dấu ngoặc kép hoặc khoảng trắng thừa bên trong thẻ có thể khiến Carbone không nhận diện được.
                </div>
              </div>
            )}

            {/* 2. REPEATING TABLE */}
            {activeCategory === 'table' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sinh Thẻ Bảng Lặp (Repeating Table & STT)</h4>
                  <p className="text-xs text-slate-500">Dùng cho bảng dịch vụ, thuốc, kết quả xét nghiệm, bảng kê chi phí.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên Mảng (Array Name):
                    <input
                      type="text"
                      value={tableArray}
                      onChange={e => setTableArray(e.target.value)}
                      placeholder="e.g. services, medications"
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên Thuộc tính trong Mảng (Field Name):
                    <input
                      type="text"
                      value={tableField}
                      onChange={e => setTableField(e.target.value)}
                      placeholder="e.g. name, quantity, price"
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                    <div>
                      <span className="text-xs text-slate-500">Thẻ giá trị phần tử mảng:</span>
                      <div className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{computedTableTag}</div>
                    </div>
                    <button type="button" onClick={() => copyToClipboard(computedTableTag)} className="rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700">Sao chép</button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                    <div>
                      <span className="text-xs text-slate-500">Thẻ Số Thứ Tự (STT) tự tăng theo dòng:</span>
                      <div className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{computedTableIndexTag} (hoặc {`{d.${tableArray}[i+1]}`})</div>
                    </div>
                    <button type="button" onClick={() => copyToClipboard(computedTableIndexTag)} className="rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700">Sao chép</button>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                  ⚠️ <strong>Quy tắc quan trọng:</strong> Trong bảng Word, chỉ cần tạo <strong>1 dòng dữ liệu mẫu</strong> chứa các thẻ có chỉ số <code>[i]</code>. Carbone sẽ tự động nhân bản dòng này cho từng phần tử trong danh sách!
                </div>
              </div>
            )}

            {/* 3. CONDITION IF */}
            {activeCategory === 'if' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sinh Thẻ Điều Kiện Hiển Thị (Conditional if)</h4>
                  <p className="text-xs text-slate-500">Ẩn hoặc hiện đoạn văn bản, cảnh báo, dấu tích tùy thuộc vào điều kiện logic.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Trường điều kiện:
                    <input type="text" value={ifField} onChange={e => setIfField(e.target.value)} className="mt-1 w-full rounded border bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phép so sánh:
                    <select value={ifOp} onChange={e => setIfOp(e.target.value as any)} className="mt-1 w-full rounded border bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                      <option value="if">if (True/Truthy)</option>
                      <option value="ifEQ">ifEQ (Bằng ==)</option>
                      <option value="ifNE">ifNE (Khác !=)</option>
                      <option value="ifGT">ifGT (Lớn hơn &gt;)</option>
                      <option value="ifLT">ifLT (Nhỏ hơn &lt;)</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Giá trị so sánh:
                    <input type="text" value={ifValue} onChange={e => setIfValue(e.target.value)} className="mt-1 w-full rounded border bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div>
                    <span className="text-xs text-slate-500">Tag Điều kiện Carbone:</span>
                    <div className="mt-1 font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{computedIfTag}</div>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(computedIfTag)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Sao chép</button>
                </div>
              </div>
            )}

            {/* 4. FORMATTERS */}
            {activeCategory === 'formatters' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Bộ Định Dạng (Formatters)</h4>
                  <p className="text-xs text-slate-500">Định dạng hiển thị Ngày giờ, Tiền tệ, Phần trăm và Chuỗi văn bản.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tên trường:
                    <input type="text" value={formatField} onChange={e => setFormatField(e.target.value)} className="mt-1 w-full rounded border bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kiểu định dạng:
                    <select value={formatType} onChange={e => setFormatType(e.target.value as any)} className="mt-1 w-full rounded border bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                      <option value="date_dmy">Ngày tháng (DD/MM/YYYY)</option>
                      <option value="date_hms">Giờ & Ngày (HH:mm DD/MM/YYYY)</option>
                      <option value="currency">Tiền tệ phân tách (#,### VNĐ)</option>
                      <option value="percent">Phần trăm (0.0%)</option>
                      <option value="upper">Viết hoa (UPPERCASE)</option>
                      <option value="lower">Viết thường (lowercase)</option>
                    </select>
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div>
                    <span className="text-xs text-slate-500">Tag Formatter hoàn chỉnh:</span>
                    <div className="mt-1 font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{computedFormatTag}</div>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(computedFormatTag)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Sao chép</button>
                </div>
              </div>
            )}

            {/* 5. BARCODE & QR */}
            {activeCategory === 'barcode' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Mã Vạch & Mã QR Code</h4>
                  <p className="text-xs text-slate-500">Tự động sinh mã vạch Code128 hoặc QR Code từ mã bệnh nhân, số hồ sơ.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Trường mã nguồn:
                    <input type="text" value={barcodeField} onChange={e => setBarcodeField(e.target.value)} className="mt-1 w-full rounded border bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Loại mã:
                    <select value={barcodeType} onChange={e => setBarcodeType(e.target.value as any)} className="mt-1 w-full rounded border bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                      <option value="code128">Mã vạch Code128 (formatBarcode)</option>
                      <option value="qr">Mã QR Code (formatQR)</option>
                    </select>
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <div>
                    <span className="text-xs text-slate-500">Tag Mã Vạch:</span>
                    <div className="mt-1 font-mono text-sm font-bold text-blue-700 dark:text-blue-300">{computedBarcodeTag}</div>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(computedBarcodeTag)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Sao chép</button>
                </div>
              </div>
            )}

            {/* 6. SIGNATURES */}
            {activeCategory === 'signatures' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Vùng Chữ Ký Định Sẵn Chuẩn Bệnh Viện</h4>
                  <p className="text-xs text-slate-500">Các khối chữ ký chuẩn theo quy định Bộ Y Tế.</p>
                </div>
                {[
                  {
                    title: 'Bác sĩ điều trị / Khám bệnh',
                    snippet: `Ngày {d.exam_date:formatDate('DD')} tháng {d.exam_date:formatDate('MM')} năm {d.exam_date:formatDate('YYYY')}\nBÁC SĨ KHÁM BỆNH\n(Ký, ghi rõ họ tên)\n\n\n{d.doctor_name:upper}`
                  },
                  {
                    title: 'Trưởng khoa / Giám đốc ký duyệt',
                    snippet: `TRƯỞNG KHOA\n(Ký, ghi rõ họ tên)\n\n\n{d.department_head_name:upper}`
                  },
                  {
                    title: 'Bệnh nhân hoặc Người nhà ký xác nhận',
                    snippet: `NGƯỜI BỆNH / ĐẠI DIỆN GIA ĐÌNH\n(Ký, ghi rõ họ tên)\n\n\n{d.patient_name:upper}`
                  }
                ].map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.title}</span>
                      <button type="button" onClick={() => copyToClipboard(item.snippet)} className="rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700">Sao chép khối</button>
                    </div>
                    <pre className="mt-2 rounded bg-white p-2.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200 whitespace-pre-wrap">{item.snippet}</pre>
                  </div>
                ))}
              </div>
            )}

            {/* 7. HOSPITAL LIBRARY */}
            {activeCategory === 'library' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Thư viện Đoạn Mẫu (Snippets) Dùng Chung</h4>
                  <p className="text-xs text-slate-500">Tiêu đề bệnh viện, đánh số trang, khung chẩn đoán.</p>
                </div>
                {[
                  {
                    title: 'Header Tiêu đề Cơ sở Khám Chữa Bệnh',
                    snippet: `SỞ Y TẾ TP. HỒ CHÍ MINH\nBỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES\nKhoa: {d.department_name}\nSố vào viện / Mã BA: {d.patient_code}`
                  },
                  {
                    title: 'Footer Đánh số trang Word',
                    snippet: `Trang {PAGE} / {NUMPAGES} - Bản in ngày {d.print_date:formatDate('DD/MM/YYYY HH:mm')}`
                  },
                  {
                    title: 'Khung Thông tin Hành chính Bệnh nhân',
                    snippet: `Họ và tên: {d.patient_name:upper}    Giới tính: {d.gender}    Năm sinh: {d.dob}\nĐịa chỉ: {d.address}\nSố thẻ BHYT: {d.insurance_number}\nChẩn đoán: {d.diagnosis}`
                  }
                ].map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.title}</span>
                      <button type="button" onClick={() => copyToClipboard(item.snippet)} className="rounded bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700">Sao chép</button>
                    </div>
                    <pre className="mt-2 rounded bg-white p-2.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200 whitespace-pre-wrap">{item.snippet}</pre>
                  </div>
                ))}
              </div>
            )}

            {/* 8. ERROR & GUIDANCE */}
            {activeCategory === 'errors' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Bảng Tra Cứu & Khắc Phục Lỗi Soạn Thảo Thường Gặp</h4>
                  <p className="text-xs text-slate-500">Cách tránh các lỗi khi kết xuất Word sang PDF bằng Carbone + LibreOffice.</p>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      error: 'Lỗi vỡ font tiếng Việt trên PDF',
                      cause: 'Sử dụng font chữ không có sẵn trên máy chủ Linux (ví dụ: VNI-Times, VnTime, font tùy biến).',
                      fix: 'Chỉ sử dụng các font tiêu chuẩn: Times New Roman, Arial, Roboto, Noto Sans, Calibri, Tahoma.'
                    },
                    {
                      error: 'Bảng lặp chỉ in 1 dòng hoặc không lặp',
                      cause: 'Quên thêm chỉ số [i] vào sau tên mảng (ví dụ viết {d.services.name} thay vì {d.services[i].name}).',
                      fix: 'Thêm [i] vào tất cả các thẻ nằm trên dòng lặp của bảng: {d.services[i].name}.'
                    },
                    {
                      error: 'Thẻ hiển thị nguyên văn {d.field} trên PDF',
                      cause: 'Thẻ bị ngắt đôi bởi các thẻ XML định dạng ẩn của Word (khi gõ ngắt quãng hoặc paste từng phần).',
                      fix: 'Xóa toàn bộ thẻ và gõ lại liền một mạch, hoặc dùng công cụ Copy Tag từ Helper này dán đè vào.'
                    },
                    {
                      error: 'Trang trắng xuất hiện ở cuối tài liệu',
                      cause: 'Thừa ký tự Enter (Paragraph break) sau bảng hoặc cuối trang.',
                      fix: 'Bật nút Show/Hide ¶ trong Word để kiểm tra và xóa bỏ các dòng trống thừa ở cuối văn bản.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 p-3.5 text-xs dark:border-slate-800">
                      <div className="font-bold text-red-600 dark:text-red-400">❌ {item.error}</div>
                      <div className="mt-1 text-slate-600 dark:text-slate-400"><strong>Nguyên nhân:</strong> {item.cause}</div>
                      <div className="mt-1 text-emerald-700 dark:text-emerald-400"><strong>Cách xử lý:</strong> {item.fix}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-xs text-slate-500 dark:border-slate-800">
          <span>Hệ thống Template Studio VIMES Professional</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

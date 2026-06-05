import re
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')

    # 1. Đọc dữ liệu PDF text dump
    with open('modules/health-check-sync/docs/1551_pdf_text.txt', 'r', encoding='utf-8') as f:
        pdf_text = f.read()

    # 2. Đọc dữ liệu đặc tả kỹ thuật markdown
    with open('modules/health-check-sync/docs/1551_technical_specs.md', 'r', encoding='utf-8') as f:
        spec_text = f.read()

    # 3. Đọc dữ liệu DynamicForm.tsx
    with open('modules/health-check-sync/forms/DynamicForm.tsx', 'r', encoding='utf-8') as f:
        form_code = f.read()

    # --- TÌM VỊ TRÍ PHÂN CHIA PDF ---
    pdf_pattern = r'^\s*(\d+)\.\s+(?:Mẫu\s+giấy|Mẫu\s+sổ|Mẫu\s+Sổ|Mẫu\s+phiếu|Mẫu\s+báo).*$'
    pdf_matches = []
    for m in re.finditer(pdf_pattern, pdf_text, re.MULTILINE | re.IGNORECASE):
        pdf_matches.append((int(m.group(1)), m.start(), m.group(0)))
    pdf_matches.sort()

    pdf_sections = {}
    for idx_m in range(len(pdf_matches)):
        f_num, start_pos, title = pdf_matches[idx_m]
        if idx_m < len(pdf_matches) - 1:
            end_pos = pdf_matches[idx_m+1][1]
            pdf_sections[f_num] = pdf_text[start_pos:end_pos]
        else:
            pdf_sections[f_num] = pdf_text[start_pos:]

    # --- TÌM VỊ TRÍ PHÂN CHIA SPEC MD ---
    spec_pattern = r'^## MẪU\s+(\d+):'
    spec_matches = []
    for m in re.finditer(spec_pattern, spec_text, re.MULTILINE):
        spec_matches.append((int(m.group(1)), m.start(), m.group(0)))
    spec_matches.sort()

    spec_sections = {}
    for idx_s in range(len(spec_matches)):
        f_num, start_pos, title = spec_matches[idx_s]
        if idx_s < len(spec_matches) - 1:
            end_pos = spec_matches[idx_s+1][1]
            spec_sections[f_num] = spec_text[start_pos:end_pos]
        else:
            spec_sections[f_num] = spec_text[start_pos:]

    # --- HÀM TRÍCH XUẤT CÁC MÃ XML/JSON ---
    def extract_pdf_fields(text_sec):
        fields = {}
        # Quét dòng trong bảng
        lines = text_sec.split('\n')
        pattern = r'^\s*(\d+)\s+(.+?)\s+([A-Z0-9_]{3,45})\s+(Chuỗi|Số)\s+(n|\d+)'
        for line in lines:
            m = re.match(pattern, line.strip())
            if m:
                tt, name, code, datatype, size = m.groups()
                fields[code] = {
                    'tt': tt,
                    'name': name.strip(),
                    'datatype': datatype,
                    'size': size
                }
        # Tìm thêm tất cả các từ viết hoa có gạch dưới có thể bị sót
        all_codes = re.findall(r'\b([A-Z0-9_]{4,45})\b', text_sec)
        system_words = {'PAGE', 'CHUOI', 'SO', 'TABLE', 'TEXT', 'JSON', 'XML', 'NULL', 'VARCHAR', 'SERIAL', 'TIMESTAMP', 'DATE', 'REFERENCES', 'DEFAULT', 'UNIQUE', 'NOT', 'AND', 'OR', 'NOW'}
        for c in all_codes:
            if c not in fields and c not in system_words:
                if '_' in c and not c.startswith('_') and not c.endswith('_'):
                    fields[c] = {
                        'tt': '?',
                        'name': 'Tự động phát hiện qua regex',
                        'datatype': '?',
                        'size': '?'
                    }
        return fields

    def extract_spec_fields(text_sec):
        fields = {}
        lines = text_sec.split('\n')
        pattern = r'^\s*\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*`?([A-Z0-9_]+)`?\s*\|'
        for line in lines:
            m = re.match(pattern, line.strip())
            if m:
                tt, name, code = m.groups()
                fields[code.strip()] = {
                    'tt': tt.strip(),
                    'name': name.strip()
                }
        # Tìm thêm các mã viết hoa có gạch dưới trong codeblock
        all_codes = re.findall(r'`([A-Z0-9_]{4,45})`', text_sec)
        for c in all_codes:
            if c not in fields:
                fields[c] = {
                    'tt': '?',
                    'name': 'Tìm thấy dạng inline code'
                }
        return fields

    # --- ĐỐI CHIẾU DYNAMICFORM ---
    form_matches = re.findall(r'\b([a-zA-Z0-9_]{3,45})\b', form_code)
    form_terms = set(form_matches)

    def normalize_name(name):
        return name.replace('_', '').lower()

    normalized_form_terms = {normalize_name(t) for t in form_terms}

    manual_mappings = {
        'HO_TEN': 'patientname',
        'SO_CCCD': 'cccd',
        'NGAY_SINH': 'dob',
        'GIOI_TINH': 'gender',
        'MA_LK': 'docno',
        'MA_CSKCB': 'macskcb',
        'NGAY_VAO': 'ngayvao',
        'LY_DO_VV': 'lydovv',
        'NHOM_MAU': 'bloodgroup',
        'DOI_TUONG': 'targetgroup',
        'NGUON_KINH_PHI': 'fundingsource',
        'CHIEU_CAO': 'height',
        'CAN_NANG': 'weight',
        'CHI_SO_BMI': 'bmi',
        'MACH': 'pulse',
        'HUYET_AP': 'bp'
    }

    # --- ĐÁNH GIÁ TỪNG MẪU BIỂU ---
    comparison_results = {}
    
    with open('modules/health-check-sync/docs/specs_comparison_report.md', 'w', encoding='utf-8') as rf:
        rf.write('# Báo cáo Đối chiếu & Đánh giá 17 Mẫu Biểu Khám Sức Khỏe (QĐ 1551/QĐ-BYT)\n\n')
        rf.write('*Báo cáo này đối chiếu chi tiết giữa file gốc `1551.pdf` (qua trích xuất text), tài liệu đặc tả kỹ thuật `1551_technical_specs.md` và mã nguồn form nhập liệu `DynamicForm.tsx`.*\n\n')
        
        rf.write('## Tóm tắt số lượng trường thông tin theo từng mẫu biểu\n\n')
        rf.write('| Mẫu | Tên Mẫu Biểu | Số trường trong PDF | Số trường trong Spec MD | Số trường thiếu trong Spec | Trạng thái hỗ trợ trên Form |\n')
        rf.write('| :--- | :--- | :---: | :---: | :---: | :--- |\n')
        
        for i in range(1, 18):
            pdf_f = extract_pdf_fields(pdf_sections.get(i, ''))
            spec_f = extract_spec_fields(spec_sections.get(i, ''))
            
            # So sánh trường
            missing_in_spec = []
            for code in pdf_f:
                if code not in spec_f:
                    if normalize_name(code) not in [normalize_name(sc) for sc in spec_f]:
                        missing_in_spec.append(code)
            
            # Kiểm tra xem Form có hỗ trợ không
            missing_in_form = []
            for code in pdf_f:
                norm_code = normalize_name(code)
                mapped_name = manual_mappings.get(code, norm_code)
                if mapped_name not in normalized_form_terms and norm_code not in normalized_form_terms:
                    missing_in_form.append(code)
            
            total_pdf_fields = len(pdf_f)
            supported_fields = total_pdf_fields - len(missing_in_form)
            pct = (supported_fields / total_pdf_fields * 100) if total_pdf_fields > 0 else 0
            
            form_status = f'Thiếu {len(missing_in_form)}/{total_pdf_fields} trường ({pct:.1f}%)'
            if pct == 100:
                form_status = 'Đầy đủ (100%)'
            elif pct > 80:
                form_status = f'Cơ bản ({pct:.1f}%) - Thiếu {len(missing_in_form)} trường'
            
            comparison_results[i] = {
                'title': pdf_matches[i-1][2] if i-1 < len(pdf_matches) else f'Mẫu {i}',
                'pdf_fields': pdf_f,
                'spec_fields': spec_f,
                'missing_in_spec': missing_in_spec,
                'missing_in_form': missing_in_form,
                'pct': pct
            }
            
            short_title = comparison_results[i]['title']
            if len(short_title) > 60:
                short_title = short_title[:57] + '...'
                
            rf.write(f'| Mẫu {i} | {short_title} | {len(pdf_f)} | {len(spec_f)} | {len(missing_in_spec)} | {form_status} |\n')
        
        rf.write('\n---\n\n')
        rf.write('## Chi tiết đánh giá từng mẫu biểu\n\n')
        
        for i in range(1, 18):
            res = comparison_results[i]
            rf.write(f'### Mẫu {i}: {res["title"]}\n\n')
            rf.write(f'- **Số lượng trường trong 1551.pdf:** {len(res["pdf_fields"])}\n')
            rf.write(f'- **Số lượng trường trong 1551_technical_specs.md:** {len(res["spec_fields"])}\n')
            rf.write(f'- **Tỷ lệ trường đã được cấu hình trên Form nhập liệu:** {res["pct"]:.1f}%\n\n')
            
            # Chi tiết thiếu trong Spec
            if res['missing_in_spec']:
                rf.write('#### 🔴 Trường có trong QĐ 1551 gốc nhưng THIẾU trong tài liệu kỹ thuật Spec MD:\n')
                for c in res['missing_in_spec']:
                    f_info = res['pdf_fields'][c]
                    rf.write(f'- `{c}`: {f_info["name"]} (Kiểu: {f_info["datatype"]}, Kích thước: {f_info["size"]})\n')
                rf.write('\n')
            else:
                rf.write('#### 🟢 Tài liệu kỹ thuật Spec MD đã đầy đủ tất cả các trường so với QĐ 1551 gốc.\n\n')
                
            # Chi tiết thiếu trên Form nhập liệu
            if res['missing_in_form']:
                rf.write('#### ⚠️ Trường có trong QĐ 1551 gốc nhưng hiện tại CHƯA ĐƯỢC NHẬP LIỆU trên Form (`DynamicForm.tsx`):\n')
                for c in res['missing_in_form']:
                    f_info = res['pdf_fields'].get(c, {'name': 'Chưa rõ', 'datatype': '?', 'size': '?'})
                    rf.write(f'- `{c}`: {f_info["name"]} (Kiểu: {f_info["datatype"]}, Kích thước: {f_info["size"]})\n')
                rf.write('\n')
            else:
                rf.write('#### 🟢 Form nhập liệu đã hỗ trợ đầy đủ tất cả các trường cho Mẫu này.\n\n')
                
            rf.write('---\n\n')
            
    print('Comparison report written to modules/health-check-sync/docs/specs_comparison_report.md')

if __name__ == '__main__':
    main()

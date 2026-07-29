# Quy chuẩn Thiết kế Tem Barcode Ống Mẫu Xét Nghiệm (LIMS Barcode Label Specification)

## 1. Tổng quan (Overview)
Tài liệu này mô tả chi tiết quy chuẩn thiết kế, thông số kích thước và cấu trúc tem in barcode nhiệt dán ống nghiệm (Sample Barcode Label) cho phân hệ đồng bộ và quản lý mẫu xét nghiệm (`health-check-sync`). Tem được tối ưu theo tiêu chuẩn máy in nhiệt (Zebra, Xprinter, Bixolon, Godex, TSC) và tương thích 100% với các hệ thống máy phân tích tự động (Roche Cobas, Sysmex XN, Abbott Alinity, Beckman Coulter).

## 2. Thông số Kỹ thuật (Technical Specifications)

| Thông số | Giá trị chuẩn | Ghi chú |
| :--- | :--- | :--- |
| **Kích thước tem** | 50mm × 30mm (mặc định), 40mm × 30mm, 60mm × 40mm | Khổ tem tiêu chuẩn y tế |
| **Mã vạch (Barcode)** | Code 128 (Subset B) | Độ phân giải vector SVG `shape-rendering="crispEdges"` |
| **Quiet Zone (Lề trống)** | Tối thiểu 10 module (>= 2.5mm mỗi bên) | Giúp mắt đọc máy XN không bị sót mẫu |
| **Font chữ** | Arial, Monospace, sans-serif | Độ tương phản màu đen tuyệt đối (`#000000`) |

## 3. Cấu trúc Hiển thị Tem (Layout Mapping)

```
+-------------------------------------------------------------+
| Tên Bệnh Nhân (Patient Name)                 Tuổi (Age)    |  <- Dòng 1: Tên (Font 14px 900), Tuổi (15px 900)
| Mã Hồ Sơ (DocNo)        Giới Tính (M/F)      Khoa (Dept)   |  <- Dòng 2: Mã HS (Monospace 11.5px), GT (11.5px), Khoa (11.5px)
|                                                             |
|   ||||||||||||||||||||||||||||||||||||||||||||||||||||||    |  <- Dòng 3: Mã vạch Code 128 SVG (Cao 22px)
|   ||||||||||||||||||||||||||||||||||||||||||||||||||||||    |
|   ||||||||||||||||||||||||||||||||||||||||||||||||||||||    |
|                                                             |
|                        Mã Barcode (SID)         Nhóm XN (SH)|  <- Dòng 4: Mã SID (Căn giữa 11.5px), Nhóm XN (18px 900 Căn phải)
| Ngày Lấy Mẫu (DD/MM/YYYY HH:mm)                             |  <- Dòng 5: Thời gian (Monospace 9px 700)
+-------------------------------------------------------------+
```

### Chi tiết vị trí dữ liệu:
1. **Dòng 1 (Top Row)**:
   - Trái: Tên bệnh nhân (`patientName`), font size `14px`, font-weight `900`.
   - Phải: Tuổi bệnh nhân (`age`), font size `15px`, font-weight `900`.
2. **Dòng 2 (Second Row)**:
   - Trái: Số hồ sơ/PID (`docNo`), font-size `11.5px`, font-weight `800`, kiểu chữ Monospace.
   - Giữa: Giới tính (`M`/`F`), font-size `11.5px`, font-weight `900`.
   - Phải: Mã khoa/phòng (`KB`, `KSK`, `NĐT`), font-size `11.5px`, font-weight `900`.
3. **Dòng 3 (Middle Section)**:
   - Barcode SVG Code 128 dạng vector, hỗ trợ quét 360 độ từ mắt đọc tự động của máy xét nghiệm.
4. **Dòng 4 (Bottom-Middle Row)**:
   - Giữa: Mã vạch SID (`orderNo`), căn giữa ngay dưới dải barcode, font-size `11.5px`, monospace, bold.
   - Phải: Mã nhóm xét nghiệm (`SH` - Sinh hóa, `HH` - Huyết học, `VS` - Vi sinh, `NT` - Nước tiểu, `MD` - Miễn dịch), font size `18px`, siêu đậm font-weight `900`.
5. **Dòng 5 (Bottom Row)**:
   - Trái: Ngày giờ lấy mẫu (`sampleDate`), định dạng `DD/MM/YYYY HH:mm`, font-size `9px`, font-weight `700`.

## 4. Tệp tin Nguồn (Source Files)
- [PrintBarcodeXnForm.tsx](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintBarcodeXnForm.tsx): Component in tem nhiệt phiếu xét nghiệm.
- [PrintBarcodeForm.tsx](file:///d:/AI/VIMES_HIS/modules/health-check-sync/forms/PrintBarcodeForm.tsx): Component render Code 128 SVG và in tem KSK.


import jsPDF from 'jspdf';
import { ImagingRequest } from '../data';

interface ReportData {
    request: ImagingRequest;
    execution: {
        device: string;
        technician: string;
        date: string;
    };
    content: {
        technique: string;
        findings: string;
        conclusion: string;
    };
    images: string[]; // Base64 strings
}

// Helper to strip HTML tags for PDF text rendering
const stripHtml = (html: string) => {
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

export const generateImagingReportPdf = (data: ReportData): string => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let y = 20;

    // --- 1. HEADER ---
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 200); // Blue
    doc.setFont("helvetica", "bold");
    doc.text("BỆNH VIỆN ĐA KHOA VIMES HIS", margin, y);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text("123 Đường Sức Khỏe, Quận 1, TP. Hồ Chí Minh", margin, y);
    y += 5;
    doc.text("Hotline: 1900 1234 | Email: contact@vimes.com.vn", margin, y);
    
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // --- 2. TITLE ---
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("PHIẾU KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(12);
    doc.text(data.request.serviceName.toUpperCase(), pageWidth / 2, y, { align: "center" });
    y += 15;

    // --- 3. PATIENT INFO & ADMIN ---
    const infoBoxHeight = 45;
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.rect(margin, y, pageWidth - margin * 2, infoBoxHeight);
    
    const leftX = margin + 5;
    const rightX = pageWidth / 2 + 5;
    let rowY = y + 8;
    const lineHeight = 8;

    doc.setFontSize(10);
    
    // Row 1
    doc.setFont("helvetica", "normal");
    doc.text(`Họ tên:`, leftX, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(data.request.patientName.toUpperCase(), leftX + 15, rowY);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Mã BN:`, rightX, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(data.request.patientId, rightX + 15, rowY);
    rowY += lineHeight;

    // Row 2
    doc.setFont("helvetica", "normal");
    doc.text(`Năm sinh:`, leftX, rowY);
    doc.text(`${new Date().getFullYear() - data.request.age} (${data.request.age} Tuổi)`, leftX + 20, rowY);
    
    doc.text(`Giới tính:`, rightX, rowY);
    doc.text(data.request.gender, rightX + 20, rowY);
    rowY += lineHeight;

    // Row 3
    doc.text(`Địa chỉ:`, leftX, rowY);
    doc.text(`456 Minh Khai, Hà Nội`, leftX + 15, rowY); // Mock address
    rowY += lineHeight;

    // Row 4
    doc.text(`Chỉ định:`, leftX, rowY);
    doc.text(`BS. Nguyễn Văn A`, leftX + 15, rowY); // Mock doctor
    
    doc.text(`Ngày chụp:`, rightX, rowY);
    doc.text(data.execution.date, rightX + 20, rowY);
    rowY += lineHeight;

    // Row 5
    doc.text(`Thiết bị:`, leftX, rowY);
    doc.text(data.execution.device, leftX + 15, rowY);

    y += infoBoxHeight + 10;

    // --- 4. IMAGES GRID (If any) ---
    if (data.images.length > 0) {
        const imgWidth = 80;
        const imgHeight = 60;
        const gap = 10;
        
        // Check if we need a new page for images
        if (y + imgHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.text("HÌNH ẢNH MINH HỌA:", margin, y);
        y += 5;

        // Draw up to 4 images (2x2)
        data.images.slice(0, 4).forEach((imgData, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const xPos = margin + col * (imgWidth + gap);
            const yPos = y + row * (imgHeight + gap);
            
            try {
                doc.addImage(imgData, 'JPEG', xPos, yPos, imgWidth, imgHeight);
            } catch (e) {
                console.error("Error adding image to PDF", e);
                doc.rect(xPos, yPos, imgWidth, imgHeight); // Placeholder on error
                doc.text("Image Error", xPos + 5, yPos + 10);
            }
        });

        const rowsUsed = Math.ceil(Math.min(data.images.length, 4) / 2);
        y += rowsUsed * (imgHeight + gap) + 5;
    }

    // --- 5. REPORT CONTENT ---
    // Check page break
    if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("KẾT QUẢ CHẨN ĐOÁN", margin, y);
    y += 8;

    // Technique
    if (data.content.technique) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("KỸ THUẬT:", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const techLines = doc.splitTextToSize(stripHtml(data.content.technique), pageWidth - margin * 2);
        doc.text(techLines, margin, y);
        y += techLines.length * 5 + 5;
    }

    // Findings
    doc.setFont("helvetica", "bold");
    doc.text("MÔ TẢ HÌNH ẢNH:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    // Simple handling: replace <br> with newlines, strip tags
    const cleanFindings = stripHtml(data.content.findings.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n'));
    const findingsLines = doc.splitTextToSize(cleanFindings, pageWidth - margin * 2);
    doc.text(findingsLines, margin, y);
    y += findingsLines.length * 6 + 8;

    // Conclusion (Highlight)
    if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
    }
    
    doc.setFont("helvetica", "bold");
    doc.text("KẾT LUẬN:", margin, y);
    y += 7;
    doc.setFontSize(12);
    const concLines = doc.splitTextToSize(stripHtml(data.content.conclusion), pageWidth - margin * 2);
    doc.text(concLines, margin, y);
    y += concLines.length * 7 + 15;

    // --- 6. FOOTER & SIGNATURE ---
    if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
    }

    const rightColX = pageWidth - 70;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Thời gian in: ${new Date().toLocaleString('vi-VN')}`, rightColX, y, { align: 'center' });
    y += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text("BÁC SĨ CHUYÊN KHOA", rightColX, y, { align: 'center' });
    y += 30; // Space for signature
    
    doc.text(data.request.radiologist || "BS. Chẩn Đoán", rightColX, y, { align: 'center' });

    return URL.createObjectURL(doc.output('blob'));
};

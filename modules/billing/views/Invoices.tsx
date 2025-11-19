
import React, { useState, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Bill, Customer, Signature } from '../../../types';
import { TrashIcon, PlusIcon, DownloadIcon, ReceiptIcon, DocumentReportIcon, ShareIcon, SignatureIcon } from '../../../components/Icons';
import Card from '../../../components/shared/Card';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import PdfPreviewModal from '../../../components/shared/PdfPreviewModal';
import SignatureModal from '../../../components/shared/SignatureModal';

// --- PDF HELPER FUNCTIONS ---
const SIGNATURE_BOX = { x: 40, y: 700, width: 150, height: 50 }; 
const PDF_TEXT_RENDER_SCALE = 5; // Use a higher scale for sharper text rendering in the PDF

const addPdfHeader = (doc: jsPDF) => {
    const margin = 15;
    const headerY = 30;
    const logoColor = '#00A8E8';
    const secondaryColor = '#007EA7';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);

    doc.setFillColor(logoColor);
    doc.rect(margin, headerY - 12, 32, 14, 'F');

    doc.setTextColor('#FFFFFF');
    doc.text('Clinic', margin + 3, headerY);

    doc.setTextColor(secondaryColor);
    doc.text('MS', margin + 32, headerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Clinic Management System', margin, headerY + 6);

    return headerY + 25; // Return new Y position for content
};

const addPdfFooter = (doc: jsPDF) => {
    const margin = 15;
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(200);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

        doc.setFontSize(9);
        doc.setTextColor(150);
        
        const dateStr = `Generated on: ${new Date().toLocaleString('en-GB')}`;
        doc.text(dateStr, margin, pageHeight - 10);
        
        doc.text(`ClinicMS © ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        const pageNumText = `Page ${i} of ${pageCount}`;
        doc.text(pageNumText, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
};

const formatSignatureDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


// Common Types for props
interface PageProps {
  bills: Bill[];
  customers: Customer[];
}

interface BillMutations {
  addBill: (bill: Omit<Bill, 'id' | 'status'>) => void;
  deleteBill: (id: string) => void;
  updateBillStatus: (id: string, status: 'paid' | 'unpaid') => void;
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-200 dark:bg-slate-700 p-2 border border-slate-300 dark:border-slate-600 rounded">
        <p className="label text-sm text-slate-600 dark:text-slate-300">{`Date: ${label}`}</p>
        <p className="intro text-sm text-cyan-500 dark:text-cyan-400">{`Consumption: ${payload[0].value} kWh`}</p>
        <p className="intro text-sm text-amber-500 dark:text-amber-400">{`Cost: ${payload[1].value.toLocaleString('vi-VN')} VND`}</p>
      </div>
    );
  }
  return null;
};

// --- 1. OVERVIEW COMPONENT ---
export const Overview: React.FC<PageProps> = ({ bills, customers }) => {
    const sortedBills = useMemo(() => [...bills].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bills]);
    
    const summaryStats = useMemo(() => {
        const totalConsumption = bills.reduce((acc, bill) => acc + bill.consumption, 0);
        const totalCost = bills.reduce((acc, bill) => acc + bill.cost, 0);
        const unpaidBills = bills.filter(bill => bill.status === 'unpaid').length;
        return { totalConsumption, totalCost, unpaidBills };
    }, [bills]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                     <h3 className="text-slate-500 dark:text-slate-400 font-medium">Tổng tiêu thụ</h3>
                     <p className="text-3xl font-bold text-cyan-500">{summaryStats.totalConsumption} kWh</p>
                </div>
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                     <h3 className="text-slate-500 dark:text-slate-400 font-medium">Tổng doanh thu</h3>
                     <p className="text-3xl font-bold text-emerald-500">{summaryStats.totalCost.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                     <h3 className="text-slate-500 dark:text-slate-400 font-medium">Chưa thanh toán</h3>
                     <p className="text-3xl font-bold text-amber-500">{summaryStats.unpaidBills}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4">Biểu đồ Chi phí</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sortedBills}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="cost" fill="#10b981" name="Chi phí (VND)" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4">Danh sách Hóa đơn</h3>
                    <div className="overflow-y-auto max-h-[300px]">
                         <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-2">Ngày</th>
                                    <th className="p-2">Khách hàng</th>
                                    <th className="p-2 text-right">Số tiền</th>
                                    <th className="p-2 text-center">TT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBills.map(bill => {
                                    const customer = customers.find(c => c.id === bill.customerId);
                                    return (
                                        <tr key={bill.id} className="border-b border-slate-100 dark:border-slate-700">
                                            <td className="p-2">{bill.date}</td>
                                            <td className="p-2">{customer?.name || bill.customerId}</td>
                                            <td className="p-2 text-right">{bill.cost.toLocaleString('vi-VN')}</td>
                                            <td className="p-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {bill.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. BILLS MANAGER COMPONENT ---
interface BillsManagerProps extends PageProps, BillMutations {
    filter: { customerId: string | null };
    clearFilter: () => void;
}
  
export const BillsManager: React.FC<BillsManagerProps> = ({ bills, customers, addBill, deleteBill, updateBillStatus, filter, clearFilter }) => {
      const [date, setDate] = useState('');
      const [consumption, setConsumption] = useState('');
      const [cost, setCost] = useState('');
      const [customerId, setCustomerId] = useState('');
      const [showAddForm, setShowAddForm] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
      const [billToDelete, setBillToDelete] = useState<string | null>(null);
      const [pdfPreview, setPdfPreview] = useState<{url: string; name: string; bill: Bill; customer: Customer; signatures: Signature[]} | null>(null);
      const [signingContext, setSigningContext] = useState<{bill: Bill; customer: Customer} | null>(null);
  
      const filteredBills = useMemo(() => {
          const customerBills = filter.customerId ? bills.filter(b => b.customerId === filter.customerId) : bills;
          return [...customerBills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }, [bills, filter]);
  
      const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);
      
      const generateInvoicePdf = async (bill: Bill, customer: Customer, existingSignatures: Signature[] = []) => {
          const doc = new jsPDF({ unit: 'pt' });
          const margin = 15;
          const pageWidth = doc.internal.pageSize.getWidth();
          const type = bill.status === 'paid' ? 'receipt' : 'invoice';
  
          let yPos = addPdfHeader(doc);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(16);
          doc.setTextColor('#007EA7');
          doc.text(type === 'receipt' ? 'PAYMENT RECEIPT' : 'INVOICE', margin, yPos);
          
          yPos += 5;
          doc.setDrawColor('#00A8E8');
          doc.setLineWidth(0.5);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          
          yPos += 15;
          doc.setFontSize(12);
          doc.setTextColor(80);
          const docIdLabel = type === 'receipt' ? 'Receipt No:' : 'Invoice No:';
          const docDateLabel = type === 'receipt' ? 'Date:' : 'Issue Date:';
          doc.text(`${docIdLabel} ${bill.id}`, margin, yPos);
          doc.text(`${docDateLabel} ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, yPos, { align: 'right' });
          
          yPos += 10;
          doc.setFont('helvetica', 'bold');
          doc.text('Billed To:', margin, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 7;
          doc.text(customer.name, margin, yPos);
          yPos += 5;
          doc.text(customer.address, margin, yPos);
  
          yPos += 20;
          autoTable(doc, {
              startY: yPos,
              head: [['Description', 'Amount']],
              body: [[`Electricity Bill - ${bill.date}`, `${bill.cost.toLocaleString('vi-VN')} VND`]],
              theme: 'striped',
              headStyles: { fillColor: '#007EA7' },
              margin: { left: margin, right: margin }
          });
          
          const finalYTable = (doc as any).lastAutoTable?.finalY;
          yPos = (finalYTable || yPos) + 15;
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          const totalLabel = type === 'receipt' ? 'Total Paid:' : 'Total Paid:';
          doc.text(totalLabel, pageWidth - margin - 50, yPos);
          doc.text(`${bill.cost.toLocaleString('vi-VN')} VND`, pageWidth - margin, yPos, { align: 'right' });
          
          yPos += 25;
          doc.setFontSize(12);
          doc.setTextColor(150);
          const footerText = type === 'receipt' ? 'Thank you for your payment!' : 'Payment is due within 30 days of the issue date.';
          doc.text(footerText, pageWidth / 2, yPos, { align: 'center' });
          
          const getImageDimensions = (dataUrl: string): Promise<{width: number, height: number}> => {
              return new Promise(resolve => {
                  const img = new Image();
                  img.onload = () => {
                      resolve({ width: img.width, height: img.height });
                  };
                  img.src = dataUrl;
              });
          }
          
          const { AcroFormField } = (jsPDF as any).AcroForm;
  
          for (const [index, sig] of existingSignatures.entries()) {
              const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = sig.placement;
              doc.setPage(sig.placement.pageNumber);
          
              // --- 1. Define Layout: 40% for image, 60% for text ---
              const imageBoxWidth = boxWidth * 0.4;
              const textBoxWidth = boxWidth * 0.6;
              const imageBoxX = boxX;
              const textBoxX = boxX + imageBoxWidth;
          
              // --- 2. Add Signature Image ---
              const { width: imgWidth, height: imgHeight } = await getImageDimensions(sig.dataUrl);
              const imgAspectRatio = imgWidth / imgHeight;
          
              // Fit signature image into its allocated box, maintaining aspect ratio
              let sigFinalWidth = imageBoxWidth;
              let sigFinalHeight = sigFinalWidth / imgAspectRatio;
              if (sigFinalHeight > boxHeight) {
                  sigFinalHeight = boxHeight;
                  sigFinalWidth = sigFinalHeight * imgAspectRatio;
              }
          
              // Center the signature image within its box
              const sigFinalX = imageBoxX + (imageBoxWidth - sigFinalWidth) / 2;
              const sigFinalY = boxY + (boxHeight - sigFinalHeight) / 2;
              doc.addImage(sig.dataUrl, 'PNG', sigFinalX, sigFinalY, sigFinalWidth, sigFinalHeight);
          
              // --- 3. Create Text as a High-Quality Image to ensure font rendering ---
              const textElement = document.createElement('div');
              textElement.style.position = 'absolute';
              textElement.style.left = '-9999px'; // Position off-screen to avoid flicker
              textElement.style.fontFamily = 'Arial, sans-serif';
              textElement.innerHTML = `
                  <div style="display: inline-block; padding-bottom: 2px;">
                      <div style="font-weight: bold; font-size: 11px; color: #212529; margin: 0; padding: 0; margin-bottom: 2px;">Ký bởi: ${sig.signerTitle}</div>
                      <div style="font-size: 10px; color: #495057; margin: 0; padding: 0; margin-bottom: 2px;">${sig.signerName}</div>
                      <div style="font-size: 9px; color: #6c757d; margin: 0; padding: 0;">${formatSignatureDate(sig.signedAt)}</div>
                  </div>
              `;
              document.body.appendChild(textElement);
          
              const textCanvas = await html2canvas(textElement, {
                  scale: PDF_TEXT_RENDER_SCALE, // Render at a higher resolution for high quality
                  backgroundColor: null,
              });
              const textImageDataUrl = textCanvas.toDataURL('image/png');
              document.body.removeChild(textElement); // Clean up the element
          
              const textImgAspectRatio = textCanvas.width / textCanvas.height;
              
              // Fit the generated text image into its allocated box
              let textFinalWidth = textBoxWidth;
              let textFinalHeight = textFinalWidth / textImgAspectRatio;
              if (textFinalHeight > boxHeight) {
                  textFinalHeight = boxHeight;
                  textFinalWidth = textFinalHeight * textImgAspectRatio;
              }
          
              // Vertically center the text image within the total box height
              const textFinalX = textBoxX;
              const textFinalY = boxY + (boxHeight - textFinalHeight) / 2;
              doc.addImage(textImageDataUrl, 'PNG', textFinalX, textFinalY, textFinalWidth, textFinalHeight);
  
              // --- 4. Add a read-only signature field over the visual signature ---
              if (AcroFormField) {
                  // Workaround for `jsPDF.AcroForm.Signature` not being a constructor in the used build.
                  // We manually construct a field with the correct prototype and field type.
                  const signatureField = Object.create(AcroFormField.prototype);
                  AcroFormField.call(signatureField);
                  signatureField.FT = 'Sig'; // Field Type for Signature
  
                  // The Rect is [x1, y1, x2, y2] in PDF points
                  signatureField.Rect = [boxX, boxY, boxX + boxWidth, boxY + boxHeight];
                  signatureField.fieldName = `Signature_Invoice_${bill.id}_${index}`; // Unique field name
                  signatureField.readOnly = true; // Make it non-interactive
                  
                  // Add signer info to the field's metadata for accessibility/inspection
                  signatureField.alternativeText = `Signature of ${sig.signerName} (${sig.signerTitle}), signed at ${formatSignatureDate(sig.signedAt)}`;
                  
                  doc.addField(signatureField);
              }
          }
  
          addPdfFooter(doc);
  
          return doc;
      };
  
  
      const handlePreviewPdf = async (bill: Bill, customer: Customer | undefined) => {
          if (!customer) return;
  
          try {
              const doc = await generateInvoicePdf(bill, customer, []);
              const type = bill.status === 'paid' ? 'receipt' : 'invoice';
              const filename = `${type}-${customer.name.replace(/\s+/g, '-')}-${bill.date}.pdf`;
              const pdfBlob = doc.output('blob');
              if (pdfBlob.size === 0) {
                  throw new Error("Generated PDF is empty. This could be due to an issue with rendering content.");
              }
              const url = URL.createObjectURL(pdfBlob);
              setPdfPreview({ url, name: filename, bill, customer, signatures: [] });
          } catch (error) {
              console.error("PDF Generation failed:", error);
              alert(`Could not generate the PDF. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
      };
      
      const handleSharePdf = async (bill: Bill, customer: Customer | undefined) => {
          if (!customer) return;
  
          try {
              const doc = await generateInvoicePdf(bill, customer);
              const filename = `invoice-${customer.name.replace(/\s+/g, '-')}-${bill.date}.pdf`;
              const pdfBlob = doc.output('blob');
              if (pdfBlob.size === 0) {
                  throw new Error("Generated PDF for sharing is empty.");
              }
  
              const file = new File([pdfBlob], filename, { type: 'application/pdf' });
  
              if (navigator.share && navigator.canShare({ files: [file] })) {
                  await navigator.share({ files: [file], title: filename });
              } else {
                  const url = URL.createObjectURL(pdfBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  alert('Sharing not supported, the file has been downloaded instead.');
              }
          } catch (error) {
              console.error("PDF Sharing failed:", error);
              alert(`Could not share the PDF. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
      };
  
      const handleSignPdf = async (signatureDataUrl: string, placement: any) => {
          if (!pdfPreview) return;
          const { bill, customer, url: oldUrl, signatures: currentSignatures } = pdfPreview;
          
          const newSignature: Signature = { 
              dataUrl: signatureDataUrl, 
              placement: placement,
              signedAt: new Date(),
              signerName: 'Dr. Minh',
              signerTitle: 'Administrator'
          };
          const updatedSignatures = [...currentSignatures, newSignature];
          
          if (oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl);
          }
        
          try {
              const doc = await generateInvoicePdf(bill, customer, updatedSignatures);
              const filename = `invoice-signed-${customer.name.replace(/\s+/g, '-')}-${bill.date}.pdf`;
              const pdfBlob = doc.output('blob');
              if (pdfBlob.size === 0) {
                  throw new Error("Generated signed PDF is empty.");
              }
              const newUrl = URL.createObjectURL(pdfBlob);
              setPdfPreview({ url: newUrl, name: filename, bill, customer, signatures: updatedSignatures });
        
          } catch (error) {
              console.error("PDF Signing failed:", error);
              alert(`Could not sign the PDF. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
        };
      
      const handleSaveSignatureAndPreview = async (signatureDataUrl: string) => {
          if (!signingContext) return;
          const { bill, customer } = signingContext;
          
          const placement = { 
              pageNumber: 1, 
              x: SIGNATURE_BOX.x, 
              y: SIGNATURE_BOX.y, 
              width: SIGNATURE_BOX.width, 
              height: SIGNATURE_BOX.height 
          };
      
          const signature: Signature = {
              dataUrl: signatureDataUrl,
              placement,
              signedAt: new Date(),
              signerName: 'Dr. Minh',
              signerTitle: 'Administrator'
          };
      
          if (pdfPreview && pdfPreview.url.startsWith('blob:')) {
              URL.revokeObjectURL(pdfPreview.url);
          }
      
          try {
              const doc = await generateInvoicePdf(bill, customer, [signature]);
              const filename = `invoice-signed-${customer.name.replace(/\s+/g, '-')}-${bill.date}.pdf`;
              const pdfBlob = doc.output('blob');
              if (pdfBlob.size === 0) {
                  throw new Error("Generated signed PDF is empty.");
              }
              const newUrl = URL.createObjectURL(pdfBlob);
              setPdfPreview({ url: newUrl, name: filename, bill, customer, signatures: [signature] });
          } catch (error) {
              console.error("PDF Signing and Preview failed:", error);
              alert(`Could not sign and preview the PDF. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          } finally {
              setSigningContext(null);
          }
      };
  
      const handleDeleteSignature = async (signatureIndex: number) => {
          if (!pdfPreview || !('bill' in pdfPreview)) return;
      
          const { bill, customer, url: oldUrl, signatures: currentSignatures } = pdfPreview;
          const updatedSignatures = currentSignatures.filter((_, index) => index !== signatureIndex);
      
          if (oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }
      
          try {
            const doc = await generateInvoicePdf(bill, customer, updatedSignatures);
            const filename = `invoice-signed-${customer.name.replace(/\s+/g, '-')}-${bill.date}.pdf`;
            const pdfBlob = doc.output('blob');
            
            if (pdfBlob.size === 0) {
              throw new Error("Generated PDF after signature deletion is empty.");
            }
            
            const newUrl = URL.createObjectURL(pdfBlob);
            setPdfPreview({ url: newUrl, name: filename, bill, customer, signatures: updatedSignatures });
          
          } catch (error) {
            console.error("PDF Regeneration after delete failed:", error);
            alert(`Could not update the PDF after deleting signature. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
        };
  
      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (date && consumption && cost && customerId) {
            addBill({ date, consumption: parseFloat(consumption), cost: parseFloat(cost), customerId });
            setDate(''); setConsumption(''); setCost(''); setCustomerId(''); setShowAddForm(false);
          }
      };
  
      const openDeleteConfirmation = (id: string) => {
          setBillToDelete(id);
          setIsDeleteModalOpen(true);
      };
  
      const confirmDelete = () => {
          if (billToDelete) {
              deleteBill(billToDelete);
          }
          setIsDeleteModalOpen(false);
          setBillToDelete(null);
      };
  
      const handleExportCsv = () => {
          if (filteredBills.length === 0) {
              alert("No bill data to export.");
              return;
          }
  
          const headers = ["Bill ID", "Customer Name", "Date (YYYY-MM)", "Consumption (kWh)", "Cost (VND)", "Status"];
          const csvRows = [headers.join(',')];
  
          for (const bill of filteredBills) {
              const customerName = customerMap.get(bill.customerId) || 'Unknown';
              const row = [
                  bill.id,
                  `"${customerName.replace(/"/g, '""')}"`, // Handle potential quotes in names
                  bill.date,
                  bill.consumption,
                  bill.cost,
                  bill.status
              ];
              csvRows.push(row.join(','));
          }
  
          const csvString = csvRows.join('\n');
          const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          const dateStr = new Date().toISOString().slice(0, 10);
          const customerNamePart = filter.customerId ? `-${customerMap.get(filter.customerId)?.replace(/\s+/g, '_')}` : '';
          link.setAttribute("download", `clinicms_bills${customerNamePart}_${dateStr}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      };
  
      const selectedCustomerName = filter.customerId ? customerMap.get(filter.customerId) : null;
  
      return (
          <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-3">
                      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                          <h2 className="text-2xl font-bold text-cyan-500 dark:text-cyan-300">
                              {selectedCustomerName ? `Bills for ${selectedCustomerName}` : 'All Bills'}
                          </h2>
                          <div className="flex items-center gap-2">
                              {filter.customerId && (
                                  <button onClick={clearFilter} className="text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-md transition-colors">
                                      Show All Bills
                                  </button>
                              )}
                              <button onClick={handleExportCsv} className="text-sm bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors">
                                  <DownloadIcon className="w-4 h-4" /> Export CSV
                              </button>
                              <button onClick={() => setShowAddForm(!showAddForm)} className="text-sm bg-primary hover:bg-primary-dark text-white flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors">
                                  <PlusIcon className="w-4 h-4" /> {showAddForm ? 'Cancel' : 'Add New Bill'}
                              </button>
                          </div>
                      </div>
  
                      {showAddForm && (
                          <Card className="mb-6 bg-slate-100 dark:bg-slate-800/50">
                              <h3 className="text-xl font-bold mb-4 text-cyan-500 dark:text-cyan-300">Add New Bill</h3>
                              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Customer</label>
                                      <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full mt-1 p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary">
                                          <option value="">Select a customer</option>
                                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Month (YYYY-MM)</label>
                                      <input type="month" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full mt-1 p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary"/>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Consumption (kWh)</label>
                                      <input type="number" value={consumption} onChange={(e) => setConsumption(e.target.value)} required className="w-full mt-1 p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary"/>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Cost (VND)</label>
                                      <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} required className="w-full mt-1 p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary"/>
                                  </div>
                                  <button type="submit" className="w-full md:col-span-4 flex justify-center items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors">
                                      Save Bill
                                  </button>
                              </form>
                          </Card>
                      )}
  
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="border-b border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                                  <tr>
                                      <th className="p-3">Customer</th>
                                      <th className="p-3">Date</th>
                                      <th className="p-3">Consumption (kWh)</th>
                                      <th className="p-3">Cost (VND)</th>
                                      <th className="p-3">Status</th>
                                      <th className="p-3 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredBills.map((bill) => (
                                      <tr key={bill.id} className="group border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300">
                                          <td className="p-3">
                                              <div className="flex items-center gap-2">
                                                  <span>{customerMap.get(bill.customerId) || 'Unknown'}</span>
                                                  {bill.status === 'unpaid' && (
                                                      <button
                                                          onClick={() => {
                                                              const customer = customers.find(c => c.id === bill.customerId);
                                                              if (customer) {
                                                                  setSigningContext({ bill, customer });
                                                              }
                                                          }}
                                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-primary rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                                                          title="Sign Invoice"
                                                      >
                                                          <SignatureIcon className="w-4 h-4" />
                                                      </button>
                                                  )}
                                              </div>
                                          </td>
                                          <td className="p-3">{bill.date}</td>
                                          <td className="p-3">{bill.consumption}</td>
                                          <td className="p-3">{bill.cost.toLocaleString('vi-VN')} VND</td>
                                          <td className="p-3">
                                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                                                  {bill.status}
                                              </span>
                                          </td>
                                          <td className="p-3 text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                  {bill.status === 'paid' ? (
                                                      <button onClick={() => handlePreviewPdf(bill, customers.find(c => c.id === bill.customerId))} className="p-1.5 text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-primary rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Print Receipt">
                                                          <ReceiptIcon className="w-5 h-5"/>
                                                      </button>
                                                  ) : (
                                                      <>
                                                          <button onClick={() => handlePreviewPdf(bill, customers.find(c => c.id === bill.customerId))} className="p-1.5 text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-primary rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Print Invoice">
                                                              <DocumentReportIcon className="w-5 h-5"/>
                                                          </button>
                                                          <button onClick={() => handleSharePdf(bill, customers.find(c => c.id === bill.customerId))} className="p-1.5 text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-primary rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Share Invoice">
                                                              <ShareIcon className="w-5 h-5"/>
                                                          </button>
                                                      </>
                                                  )}
                                                  <button onClick={() => openDeleteConfirmation(bill.id)} className="p-1.5 text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Delete Bill">
                                                      <TrashIcon className="w-5 h-5"/>
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </Card>
              </div>
              <ConfirmationModal
                  isOpen={isDeleteModalOpen}
                  onClose={() => setIsDeleteModalOpen(false)}
                  onConfirm={confirmDelete}
                  title="Delete Bill"
                  message="Are you sure you want to delete this bill? This action cannot be undone."
              />
              <PdfPreviewModal
                isOpen={!!pdfPreview}
                onClose={() => {
                  if (pdfPreview && pdfPreview.url.startsWith('blob:')) {
                    URL.revokeObjectURL(pdfPreview.url);
                  }
                  setPdfPreview(null);
                }}
                pdfUrl={pdfPreview?.url || ''}
                fileName={pdfPreview?.name || ''}
                onSign={handleSignPdf}
                signatures={pdfPreview?.signatures || []}
                onDeleteSignature={handleDeleteSignature}
                isSignable={pdfPreview?.name.startsWith('invoice')}
              />
              <SignatureModal
                isOpen={!!signingContext}
                onClose={() => setSigningContext(null)}
                onSave={handleSaveSignatureAndPreview}
              />
          </>
      );
  };
  
  // --- 3. PAYMENTS COMPONENT ---
  interface PaymentsProps extends PageProps {
      updateBillStatus: (id: string, status: 'paid' | 'unpaid') => void;
  }
  
  export const Payments: React.FC<PaymentsProps> = ({ bills, customers, updateBillStatus }) => {
      const [pdfPreview, setPdfPreview] = useState<{url: string; name: string; bill: Bill; customer: Customer} | null>(null);
      const unpaidBills = useMemo(() => bills.filter(b => b.status === 'unpaid').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bills]);
      const paidBills = useMemo(() => bills.filter(b => b.status === 'paid').sort((a, b) => new Date(b.date).getTime() - new Date(b.date).getTime()).slice(0, 10), [bills]);
      const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);
  
      const handlePreviewReceipt = (bill: Bill, customer: Customer | undefined) => {
          if (!customer) return;
          try {
              const doc = new jsPDF({ unit: 'pt' });
              const margin = 15;
              const pageWidth = doc.internal.pageSize.getWidth();
              
              let yPos = addPdfHeader(doc);
              
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(16);
              doc.setTextColor('#007EA7');
              doc.text('PAYMENT RECEIPT', margin, yPos);
              
              yPos += 5;
              doc.setDrawColor('#00A8E8');
              doc.setLineWidth(0.5);
              doc.line(margin, yPos, pageWidth - margin, yPos);
              
              yPos += 15;
              doc.setFontSize(12);
              doc.setTextColor(80);
              doc.text(`Receipt No: ${bill.id}`, margin, yPos);
              doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, yPos, { align: 'right' });
              
              yPos += 10;
              doc.setFont('helvetica', 'bold');
              doc.text('Billed To:', margin, yPos);
              doc.setFont('helvetica', 'normal');
              yPos += 7;
              doc.text(customer.name, margin, yPos);
              yPos += 5;
              doc.text(customer.address, margin, yPos);
  
              yPos += 20;
              autoTable(doc, {
                  startY: yPos,
                  head: [['Description', 'Amount']],
                  body: [[`Electricity Bill - ${bill.date}`, `${bill.cost.toLocaleString('vi-VN')} VND`]],
                  theme: 'striped',
                  headStyles: { fillColor: '#007EA7' },
                  margin: { left: margin, right: margin }
              });
              
              const finalY = (doc as any).lastAutoTable?.finalY;
              yPos = (finalY || yPos) + 15;
              
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text('Total Paid:', pageWidth - margin - 50, yPos);
              doc.text(`${bill.cost.toLocaleString('vi-VN')} VND`, pageWidth - margin, yPos, { align: 'right' });
              
              yPos += 25;
              doc.setFontSize(12);
              doc.setTextColor(150);
              doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
              
              addPdfFooter(doc);
  
              const filename = `receipt-${customer.name.replace(/\s+/g, '-')}-${bill.date}.pdf`;
              const pdfBlob = doc.output('blob');
              if (pdfBlob.size === 0) {
                  throw new Error("Generated PDF is empty. This could be due to an issue with rendering content.");
              }
              const url = URL.createObjectURL(pdfBlob);
              setPdfPreview({ url, name: filename, bill, customer });
          } catch (error) {
              console.error("PDF Generation failed:", error);
              alert(`Could not generate the PDF receipt. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
      };
  
      return (
          <>
           <div className="space-y-8">
              <Card>
                  <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-300">Pending Payments</h2>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="border-b border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                              <tr>
                                  <th className="p-3">Customer</th>
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Amount Due</th>
                                  <th className="p-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody>
                              {unpaidBills.length > 0 ? unpaidBills.map(bill => (
                                  <tr key={bill.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300">
                                      <td className="p-3">{customerMap.get(bill.customerId)}</td>
                                      <td className="p-3">{bill.date}</td>
                                      <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">{bill.cost.toLocaleString('vi-VN')} VND</td>
                                      <td className="p-3 text-right">
                                          <button onClick={() => updateBillStatus(bill.id, 'paid')} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md transition-colors">
                                              Mark as Paid
                                          </button>
                                      </td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={4} className="p-4 text-center text-slate-500 dark:text-slate-400">No pending payments. Great job!</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </Card>
               <Card>
                  <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-300">Recent Payment History</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 -mt-2">Showing last 10 paid bills.</p>
                  <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="border-b border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                              <tr>
                                  <th className="p-3">Customer</th>
                                  <th className="p-3">Date</th>
                                  <th className="p-3">Amount Paid</th>
                                  <th className="p-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                               {paidBills.map(bill => (
                                  <tr key={bill.id} className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                      <td className="p-3">{customerMap.get(bill.customerId)}</td>
                                      <td className="p-3">{bill.date}</td>
                                      <td className="p-3 text-green-600 dark:text-green-300">{bill.cost.toLocaleString('vi-VN')} VND</td>
                                      <td className="p-3 text-right">
                                          <button onClick={() => handlePreviewReceipt(bill, customers.find(c => c.id === bill.customerId))} className="p-1.5 text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-primary rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Print Receipt">
                                              <ReceiptIcon className="w-5 h-5"/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
          <PdfPreviewModal
              isOpen={!!pdfPreview}
              onClose={() => {
                  if (pdfPreview && pdfPreview.url.startsWith('blob:')) {
                    URL.revokeObjectURL(pdfPreview.url);
                  }
                  setPdfPreview(null);
              }}
              pdfUrl={pdfPreview?.url || ''}
              fileName={pdfPreview?.name || ''}
              isSignable={false}
          />
        </>
      );
  };
  
  // --- 4. REPORTS COMPONENT ---
  export const Reports: React.FC<PageProps> = ({ bills, customers }) => {
      const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
      const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
      const [pdfPreview, setPdfPreview] = useState<{url: string; name: string; customer: Customer; bills: Bill[]; signatures: Signature[]} | null>(null);
  
      const generateReportPdf = async (customer: Customer, customerBills: Bill[], existingSignatures: Signature[] = []) => {
          const doc = new jsPDF({ unit: 'pt' });
          const margin = 15;
          const pageWidth = doc.internal.pageSize.getWidth();
          const brandColor = '#00A8E8';
  
          let yPos = addPdfHeader(doc);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(18);
          doc.setTextColor(100);
          doc.text('Customer Energy Report', margin, yPos);
          
          yPos += 14;
          doc.setDrawColor(200);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 42;
  
          const summaryBoxY = yPos;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('CUSTOMER DETAILS', margin, yPos);
          yPos += 20;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(`Name: ${customer.name}`, margin, yPos);
          yPos += 14;
          doc.text(`Email: ${customer.email}`, margin, yPos);
          yPos += 14;
          doc.text(`Address: ${customer.address}`, margin, yPos);
  
          yPos = summaryBoxY;
          const summaryX = pageWidth / 2 + 10;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('BILLING SUMMARY', summaryX, yPos);
          yPos += 20;
  
          if (customerBills.length > 0) {
              const totalConsumption = customerBills.reduce((sum, bill) => sum + bill.consumption, 0);
              const totalCost = customerBills.reduce((sum, bill) => sum + bill.cost, 0);
              const avgConsumption = totalConsumption / customerBills.length;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
              doc.text(`Total Consumption: ${totalConsumption.toFixed(2)} kWh`, summaryX, yPos);
              yPos += 14;
              doc.text(`Total Cost: ${totalCost.toLocaleString('vi-VN')} VND`, summaryX, yPos);
              yPos += 14;
              doc.text(`Average Consumption: ${avgConsumption.toFixed(2)} kWh/month`, summaryX, yPos);
          } else {
              doc.text('No billing data available.', summaryX, yPos);
          }
          yPos = Math.max(yPos, summaryBoxY + 71);
          yPos += 28;
  
          if (customerBills.length > 0) {
              doc.setFontSize(12);
              doc.setFont('helvetica', 'bold');
              doc.text('CONSUMPTION & COST HISTORY', margin, yPos);
              yPos += 23;
  
              const chartX = margin, chartY = yPos, chartWidth = pageWidth - margin * 2, chartHeight = 142, barMargin = 3;
              doc.setDrawColor(150);
              doc.line(chartX, chartY, chartX, chartY + chartHeight);
              doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
  
              const maxConsumption = Math.max(...customerBills.map(b => b.consumption), 1);
              const maxCost = Math.max(...customerBills.map(b => b.cost), 1);
              const barWidth = (chartWidth / customerBills.length) / 2 - barMargin;
  
              customerBills.forEach((bill, index) => {
                  const xPos = chartX + (index * (chartWidth / customerBills.length)) + barMargin;
                  const consumptionHeight = (bill.consumption / maxConsumption) * chartHeight;
                  doc.setFillColor(brandColor);
                  doc.rect(xPos, chartY + chartHeight - consumptionHeight, barWidth, consumptionHeight, 'F');
  
                  const costHeight = (bill.cost / maxCost) * chartHeight;
                  doc.setFillColor('#f59e0b');
                  doc.rect(xPos + barWidth, chartY + chartHeight - costHeight, barWidth, costHeight, 'F');
                  
                  doc.setFontSize(7);
                  doc.setTextColor(100);
                  doc.text(bill.date, xPos + barWidth, chartY + chartHeight + 4, { align: 'center' });
              });
              
              yPos += chartHeight + 28;
              doc.setFillColor(brandColor);
              doc.rect(margin, yPos, 8.5, 8.5, 'F');
              doc.setFontSize(9);
              doc.text('Consumption (kWh)', margin + 14, yPos + 7);
              doc.setFillColor('#f59e0b');
              doc.rect(margin + 113, yPos, 8.5, 8.5, 'F');
              doc.text('Cost (VND)', margin + 127, yPos + 7);
              yPos += 28;
          }
          
          const tableData = customerBills.map(bill => [bill.date, bill.consumption.toLocaleString(), bill.cost.toLocaleString('vi-VN'), bill.status.charAt(0).toUpperCase() + bill.status.slice(1)]);
          autoTable(doc, {
              startY: yPos,
              head: [['Date', 'Consumption (kWh)', 'Cost (VND)', 'Status']],
              body: tableData,
              theme: 'grid',
              headStyles: { fillColor: '#007EA7' },
          });
  
          const getImageDimensions = (dataUrl: string): Promise<{width: number, height: number}> => {
              return new Promise(resolve => {
                  const img = new Image();
                  img.onload = () => {
                      resolve({ width: img.width, height: img.height });
                  };
                  img.src = dataUrl;
              });
          }
          
          const { AcroFormField } = (jsPDF as any).AcroForm;
  
          for (const [index, sig] of existingSignatures.entries()) {
              const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = sig.placement;
              doc.setPage(sig.placement.pageNumber);
          
              // --- 1. Define Layout: 40% for image, 60% for text ---
              const imageBoxWidth = boxWidth * 0.4;
              const textBoxWidth = boxWidth * 0.6;
              const imageBoxX = boxX;
              const textBoxX = boxX + imageBoxWidth;
          
              // --- 2. Add Signature Image ---
              const { width: imgWidth, height: imgHeight } = await getImageDimensions(sig.dataUrl);
              const imgAspectRatio = imgWidth / imgHeight;
          
              // Fit signature image into its allocated box, maintaining aspect ratio
              let sigFinalWidth = imageBoxWidth;
              let sigFinalHeight = sigFinalWidth / imgAspectRatio;
              if (sigFinalHeight > boxHeight) {
                  sigFinalHeight = boxHeight;
                  sigFinalWidth = sigFinalHeight * imgAspectRatio;
              }
          
              // Center the signature image within its box
              const sigFinalX = imageBoxX + (imageBoxWidth - sigFinalWidth) / 2;
              const sigFinalY = boxY + (boxHeight - sigFinalHeight) / 2;
              doc.addImage(sig.dataUrl, 'PNG', sigFinalX, sigFinalY, sigFinalWidth, sigFinalHeight);
          
              // --- 3. Create Text as a High-Quality Image to ensure font rendering ---
              const textElement = document.createElement('div');
              textElement.style.position = 'absolute';
              textElement.style.left = '-9999px'; // Position off-screen to avoid flicker
              textElement.style.fontFamily = 'Arial, sans-serif';
              textElement.innerHTML = `
                  <div style="display: inline-block; padding-bottom: 2px;">
                      <div style="font-weight: bold; font-size: 11px; color: #212529; margin: 0; padding: 0; margin-bottom: 2px;">Ký bởi: ${sig.signerTitle}</div>
                      <div style="font-size: 10px; color: #495057; margin: 0; padding: 0; margin-bottom: 2px;">${sig.signerName}</div>
                      <div style="font-size: 9px; color: #6c757d; margin: 0; padding: 0;">${formatSignatureDate(sig.signedAt)}</div>
                  </div>
              `;
              document.body.appendChild(textElement);
          
              const textCanvas = await html2canvas(textElement, {
                  scale: PDF_TEXT_RENDER_SCALE, // Render at a higher resolution for high quality
                  backgroundColor: null,
              });
              const textImageDataUrl = textCanvas.toDataURL('image/png');
              document.body.removeChild(textElement); // Clean up the element
          
              const textImgAspectRatio = textCanvas.width / textCanvas.height;
              
              // Fit the generated text image into its allocated box
              let textFinalWidth = textBoxWidth;
              let textFinalHeight = textFinalWidth / textImgAspectRatio;
              if (textFinalHeight > boxHeight) {
                  textFinalHeight = boxHeight;
                  textFinalWidth = textFinalHeight * textImgAspectRatio;
              }
          
              // Vertically center the text image within the total box height
              const textFinalX = textBoxX;
              const textFinalY = boxY + (boxHeight - textFinalHeight) / 2;
              doc.addImage(textImageDataUrl, 'PNG', textFinalX, textFinalY, textFinalWidth, textFinalHeight);
              
              // --- 4. Add a read-only signature field over the visual signature ---
              if (AcroFormField) {
                   // Workaround for `jsPDF.AcroForm.Signature` not being a constructor in the used build.
                  // We manually construct a field with the correct prototype and field type.
                  const signatureField = Object.create(AcroFormField.prototype);
                  AcroFormField.call(signatureField);
                  signatureField.FT = 'Sig'; // Field Type for Signature
  
                  signatureField.Rect = [boxX, boxY, boxX + boxWidth, boxY + boxHeight];
                  signatureField.fieldName = `Signature_Report_${customer.id}_${index}`; // Unique field name
                  signatureField.readOnly = true; // Make it non-interactive
                  
                  // Add signer info to the field's metadata for accessibility/inspection
                  signatureField.alternativeText = `Signature of ${sig.signerName} (${sig.signerTitle}), signed at ${formatSignatureDate(sig.signedAt)}`;
                  
                  doc.addField(signatureField);
              }
          }
          
  
          addPdfFooter(doc);
          return doc;
      };
  
  
      const handleGenerateAndPreviewPdf = async () => {
          if (!selectedCustomerId) return;
          setIsGeneratingPdf(true);
  
          await new Promise(resolve => setTimeout(resolve, 50));
  
          try {
              const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
              if (!selectedCustomer) throw new Error("Customer not found");
  
              const filteredBills = bills.filter(b => b.customerId === selectedCustomerId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const doc = await generateReportPdf(selectedCustomer, filteredBills, []);
             
              const dateStr = new Date().toISOString().slice(0, 10);
              const filename = `report-${selectedCustomer?.name.replace(/\s+/g, '-')}-${dateStr}.pdf`;
              const pdfBlob = doc.output('blob');
              if (pdfBlob.size === 0) {
                  throw new Error("Generated PDF is empty. This could be due to an issue with rendering content.");
              }
              const url = URL.createObjectURL(pdfBlob);
              setPdfPreview({ url, name: filename, customer: selectedCustomer, bills: filteredBills, signatures: [] });
  
          } catch (error) {
              console.error("Error generating PDF:", error);
              alert(`Could not generate the PDF report. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          } finally {
              setIsGeneratingPdf(false);
          }
      };
  
      const handleSignReportPdf = async (signatureDataUrl: string, placement: any) => {
          if (!pdfPreview) return;
          const { customer, bills: customerBills, url: oldUrl, signatures: currentSignatures } = pdfPreview;
        
          const newSignature: Signature = { 
              dataUrl: signatureDataUrl, 
              placement: placement,
              signedAt: new Date(),
              signerName: 'Dr. Minh',
              signerTitle: 'Administrator'
          };
          const updatedSignatures = [...currentSignatures, newSignature];
        
          if (oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl);
          }
        
          try {
              const doc = await generateReportPdf(customer, customerBills, updatedSignatures);
              const dateStr = new Date().toISOString().slice(0, 10);
              const filename = `report-signed-${customer.name.replace(/\s+/g, '-')}-${dateStr}.pdf`;
              const pdfBlob = doc.output('blob');
        
              if (pdfBlob.size === 0) {
                  throw new Error("Generated signed PDF is empty.");
              }
              const newUrl = URL.createObjectURL(pdfBlob);
              setPdfPreview({ url: newUrl, name: filename, customer, bills: customerBills, signatures: updatedSignatures });
        
          } catch (error) {
              console.error("PDF Report Signing failed:", error);
              alert(`Could not sign the PDF report. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
        };
      
        const handleDeleteSignature = async (signatureIndex: number) => {
          if (!pdfPreview || !('bills' in pdfPreview)) return;
      
          const { customer, bills: customerBills, url: oldUrl, signatures: currentSignatures } = pdfPreview;
          const updatedSignatures = currentSignatures.filter((_, index) => index !== signatureIndex);
      
          if (oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }
      
          try {
            const doc = await generateReportPdf(customer, customerBills, updatedSignatures);
            const dateStr = new Date().toISOString().slice(0, 10);
            const filename = `report-signed-${customer.name.replace(/\s+/g, '-')}-${dateStr}.pdf`;
            
            const pdfBlob = doc.output('blob');
            if (pdfBlob.size === 0) {
              throw new Error("Generated PDF after signature deletion is empty.");
            }
            
            const newUrl = URL.createObjectURL(pdfBlob);
            setPdfPreview({ url: newUrl, name: filename, customer, bills: customerBills, signatures: updatedSignatures });
          
          } catch (error) {
            console.error("PDF Regeneration after delete failed:", error);
            alert(`Could not update the PDF after deleting signature. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
          }
        };
  
      return (
          <>
              <Card>
                  <h2 className="text-2xl font-bold mb-4 text-cyan-500 dark:text-cyan-300">Generate Report</h2>
                  <div className="space-y-4 max-w-md">
                      <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Select Customer</label>
                          <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required className="w-full mt-1 p-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary focus:border-primary">
                              <option value="">Select a customer to generate a report</option>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                      <button 
                          onClick={handleGenerateAndPreviewPdf} 
                          disabled={isGeneratingPdf || !selectedCustomerId}
                          className="text-sm bg-secondary hover:bg-emerald-600 text-white disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors w-full"
                      >
                          {isGeneratingPdf ? (
                              <>
                                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Generating Report...</span>
                              </>
                          ) : (
                              <>
                                  <DocumentReportIcon className="w-5 h-5"/>
                                  <span>Generate & Preview PDF</span>
                              </>
                          )}
                      </button>
                  </div>
              </Card>
              <PdfPreviewModal
                  isOpen={!!pdfPreview}
                  onClose={() => {
                      if (pdfPreview && pdfPreview.url.startsWith('blob:')) {
                        URL.revokeObjectURL(pdfPreview.url);
                      }
                      setPdfPreview(null);
                  }}
                  pdfUrl={pdfPreview?.url || ''}
                  fileName={pdfPreview?.name || ''}
                  onSign={handleSignReportPdf}
                  signatures={pdfPreview?.signatures || []}
                  onDeleteSignature={handleDeleteSignature}
                  isSignable={!!pdfPreview}
              />
          </>
      );
  };

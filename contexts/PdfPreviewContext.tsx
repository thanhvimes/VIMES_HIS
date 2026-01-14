
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import PdfPreviewModal from '../components/ui/PdfPreviewModal';

interface PdfPreviewData {
    url: string;
    fileName: string;
    isSignable?: boolean;
    signatures?: any[];
}

interface PdfPreviewContextType {
    openPdf: (data: PdfPreviewData) => void;
    closePdf: () => void;
}

const PdfPreviewContext = createContext<PdfPreviewContextType | undefined>(undefined);

export const PdfPreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pdfData, setPdfData] = useState<PdfPreviewData | null>(null);

    const openPdf = useCallback((data: PdfPreviewData) => {
        setPdfData(data);
    }, []);

    const closePdf = useCallback(() => {
        // Revoke URL if it's a blob to avoid memory leaks
        if (pdfData?.url && pdfData.url.startsWith('blob:')) {
            URL.revokeObjectURL(pdfData.url);
        }
        setPdfData(null);
    }, [pdfData]);

    return (
        <PdfPreviewContext.Provider value={{ openPdf, closePdf }}>
            {children}
            <PdfPreviewModal
                isOpen={!!pdfData}
                onClose={closePdf}
                pdfUrl={pdfData?.url || ''}
                fileName={pdfData?.fileName || 'document.pdf'}
                isSignable={pdfData?.isSignable}
                signatures={pdfData?.signatures}
            />
        </PdfPreviewContext.Provider>
    );
};

export const usePdfPreview = () => {
    const context = useContext(PdfPreviewContext);
    if (context === undefined) {
        throw new Error('usePdfPreview must be used within a PdfPreviewProvider');
    }
    return context;
};

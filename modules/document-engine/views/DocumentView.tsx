import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PdfPreviewModal from '../../../components/ui/PdfPreviewModal';
import { Signature } from '../../../types';

// A sample PDF file for demonstration purposes. 
// In a real application, this URL would come from an API.
const SAMPLE_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
const SAMPLE_FILE_NAME = 'sample-document.pdf';

const DocumentView: React.FC = () => {
    const { documentId } = useParams<{ documentId: string; }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [signatures, setSignatures] = useState<Signature[]>([]);

    useEffect(() => {
        // Automatically open the modal when the component is mounted (navigated to).
        setIsModalOpen(true);
    }, [documentId]); // Re-trigger if the documentId changes

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Navigate back to the previous page after the modal close animation
        setTimeout(() => navigate(-1), 300);
    };

    const handleSign = (signatureDataUrl: string, placement: any) => {
        console.log('Signature saved!', { signatureDataUrl, placement });
        const newSignature: Signature = {
            id: `sig-${Date.now()}`, // Added missing id
            signerName: 'Dr. Minh', // This would come from the logged-in user's data
            signerTitle: 'Administrator',
            signedAt: new Date(),
            dataUrl: signatureDataUrl,
            placement: placement,
        };
        // In a real app, you would send this to the backend to permanently add it to the PDF.
        // For this demo, we'll just update the local state.
        setSignatures(prev => [...prev, newSignature]);
    };
    
    const handleDeleteSignature = (signatureIndex: number) => {
        console.log(`Deleting signature at index ${signatureIndex}`);
        // In a real app, you'd call an API to remove the signature and regenerate the document.
        setSignatures(prev => prev.filter((_, index) => index !== signatureIndex));
    };

    // This component now acts as a controller, primarily to launch the modal.
    // We can add a loading indicator here for a better user experience.
    if (!isModalOpen) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-slate-500">Loading document viewer...</p>
            </div>
        );
    }
    
    return (
        <PdfPreviewModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            pdfUrl={SAMPLE_PDF_URL}
            fileName={documentId || SAMPLE_FILE_NAME}
            isSignable={true} // Enable signing features
            signatures={signatures}
            onSign={handleSign}
            onDeleteSignature={handleDeleteSignature}
        />
    );
};

export default DocumentView;

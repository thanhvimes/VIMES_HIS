import React from 'react';
import { Eye, ExternalLink } from 'lucide-react';

interface MockDicomViewerProps {
  imageUrl?: string;
  imageUrls?: string[];
  seriesImages?: string[];
  patientName?: string;
  studyUid?: string;
  patientId?: string;
}

const PACS_VIEWER_BASE_URL = 'http://localhost:5173';

export const MockDicomViewer: React.FC<MockDicomViewerProps> = ({
  imageUrl,
  imageUrls,
  patientName,
  studyUid,
  patientId
}) => {
  const activeImg = imageUrl || (imageUrls && imageUrls[0]) || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80';

  const handleOpenFullViewer = () => {
    const token = localStorage.getItem('vclinic_token') || localStorage.getItem('pacs_jwt_token') || '';
    const url = `${PACS_VIEWER_BASE_URL}/viewer?studyUid=${encodeURIComponent(studyUid || 'DEMO_STUDY')}&patientId=${encodeURIComponent(patientId || '')}&token=${encodeURIComponent(token)}`;
    window.open(url, '_blank', 'width=1400,height=900');
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-slate-800 group">
      <img src={activeImg} alt="DICOM Preview" className="w-full h-full object-contain opacity-90 group-hover:opacity-75 transition" />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition gap-2">
        <button
          onClick={handleOpenFullViewer}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
        >
          <Eye className="w-4 h-4" />
          <span>Mở Xem Phim DICOM Độc Lập</span>
        </button>
      </div>
      {patientName && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
          {patientName}
        </div>
      )}
    </div>
  );
};

export default MockDicomViewer;

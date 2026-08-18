import React, { useState } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface ImageCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: (imgUrl: string) => void;
  onSaveImages?: (images: string[]) => void;
}

export const ImageCaptureModal: React.FC<ImageCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onSaveImages
}) => {
  if (!isOpen) return null;

  const mockSamples = [
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-600" />
            Chụp Ảnh &amp; Đính Kèm Phẫu Thuật / CĐHA
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mockSamples.map((img, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (onCapture) onCapture(img);
                if (onSaveImages) onSaveImages([img]);
                onClose();
              }}
              className="cursor-pointer border border-slate-200 hover:border-sky-500 rounded-xl overflow-hidden aspect-video relative group"
            >
              <img src={img} alt="Snapshot" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                Chọn ảnh này
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCaptureModal;

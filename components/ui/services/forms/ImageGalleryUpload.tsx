
import React, { useRef } from 'react';
import { CameraIcon, TrashIcon, PhotographIcon } from '../../../Icons';

interface ImageGalleryUploadProps {
    images: string[];
    onImagesChange: (newImages: string[]) => void;
}

const ImageGalleryUpload: React.FC<ImageGalleryUploadProps> = ({ images = [], onImagesChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const newImages: string[] = [];
            const files = Array.from(event.target.files);
            
            let processedCount = 0;

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        newImages.push(reader.result as string);
                    }
                    processedCount++;
                    if (processedCount === files.length) {
                        onImagesChange([...images, ...newImages]);
                    }
                };
                reader.readAsDataURL(file as Blob);
            });
        }
        // Reset input
        event.target.value = '';
    };

    const handleDeleteImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        onImagesChange(updatedImages);
    };

    return (
        <div className="mt-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
             <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />

            <div className="flex gap-3 mb-4">
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg font-semibold text-sm transition-colors">
                    <CameraIcon className="w-5 h-5" /> Chụp ảnh
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg font-semibold text-sm transition-colors">
                    <PhotographIcon className="w-5 h-5" /> Chọn từ thư viện
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((imgSrc, index) => (
                    <div key={index} className="group relative aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src={imgSrc} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-start justify-end p-2">
                            <button type="button" onClick={() => handleDeleteImage(index)} className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Xóa ảnh">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageGalleryUpload;

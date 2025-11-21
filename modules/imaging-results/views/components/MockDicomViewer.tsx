
import React, { useState, useRef, useEffect } from 'react';
import { 
    ZoomInIcon, 
    ZoomOutIcon, 
    RefreshIcon, 
    SunIcon, 
    MoonIcon,
    HandIcon
} from '../../../../components/Icons';

interface MockDicomViewerProps {
    imageUrl: string;
    patientName: string;
    modality: string;
}

const MockDicomViewer: React.FC<MockDicomViewerProps> = ({ imageUrl, patientName, modality }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [contrast, setContrast] = useState(100);
    const [brightness, setBrightness] = useState(100);
    const [isInvert, setIsInvert] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setContrast(100);
        setBrightness(100);
        setIsInvert(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            // Zoom
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            setScale(prev => Math.min(Math.max(0.5, prev + delta), 4));
        } else {
            // Pan (if not zoomed, this might scroll page, so prevent default if zoomed)
            if (scale > 1) {
                // e.preventDefault(); // React synthetic event doesn't support this directly often in passive listeners
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden border border-slate-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-2 py-1 bg-slate-900 border-b border-slate-700">
                <div className="flex gap-1">
                    <button onClick={() => setScale(s => s + 0.1)} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Zoom In">
                        <ZoomInIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Zoom Out">
                        <ZoomOutIcon className="w-5 h-5"/>
                    </button>
                    <div className="w-px h-5 bg-slate-700 mx-1"></div>
                    <button onClick={() => setIsInvert(!isInvert)} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Invert">
                        <MoonIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={resetView} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded" title="Reset">
                        <RefreshIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                    WL/WW: {brightness}/{contrast} | Zoom: {(scale * 100).toFixed(0)}%
                </div>
            </div>

            {/* Viewport */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden cursor-move flex items-center justify-center bg-black"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Mock Information Overlay */}
                <div className="absolute top-2 left-2 text-yellow-500 text-xs font-mono z-10 pointer-events-none select-none">
                    <p>{patientName}</p>
                    <p>Modality: {modality}</p>
                    <p>Series: 1 | Image: 1</p>
                </div>
                <div className="absolute top-2 right-2 text-white text-xs font-mono z-10 pointer-events-none select-none text-right">
                    <p>ClinicMS PACS</p>
                    <p>{new Date().toLocaleDateString()}</p>
                </div>
                <div className="absolute bottom-2 left-2 text-white text-xs font-mono z-10 pointer-events-none select-none">
                    <p>L</p>
                </div>
                <div className="absolute bottom-2 right-2 text-white text-xs font-mono z-10 pointer-events-none select-none">
                    <p>R</p>
                </div>

                {/* Image */}
                <img 
                    src={imageUrl} 
                    alt="DICOM" 
                    className="max-w-full max-h-full transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        filter: `invert(${isInvert ? 1 : 0}) contrast(${contrast}%) brightness(${brightness}%)`
                    }}
                    draggable={false}
                />
            </div>

            {/* Window Level Controls Sim */}
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <SunIcon className="w-4 h-4 text-slate-400"/>
                    <input 
                        type="range" 
                        min="50" max="150" 
                        value={brightness} 
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <MoonIcon className="w-4 h-4 text-slate-400"/>
                    <input 
                        type="range" 
                        min="50" max="200" 
                        value={contrast} 
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

export default MockDicomViewer;

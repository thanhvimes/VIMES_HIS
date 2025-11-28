
import React, { useState, useRef, useEffect } from 'react';
import { 
    ZoomInIcon, 
    ZoomOutIcon, 
    RefreshIcon, 
    SunIcon, 
    MoonIcon,
    HandIcon,
    PencilIcon,
    TrashIcon,
    RotateLeftIcon,
    RotateRightIcon,
    ArrowsRightLeftIcon
} from '../../../../components/Icons';

// Custom Icons for PACS specific tools
const LayoutIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const RulerIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2m-2-4h2" />
    </svg>
);

const ScrollIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);

interface Measurement {
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    value: number; // simulated mm
}

interface MockDicomViewerProps {
    imageUrl: string;
    patientName: string;
    modality: string;
    patientId?: string;
    accessionNumber?: string;
}

const MockDicomViewer: React.FC<MockDicomViewerProps> = ({ 
    imageUrl, 
    patientName, 
    modality, 
    patientId = 'P00X',
    accessionNumber = 'ACC-2023'
}) => {
    // View State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [contrast, setContrast] = useState(100);
    const [brightness, setBrightness] = useState(100);
    const [isInvert, setIsInvert] = useState(false);
    
    // Transform State
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    
    // Slice State
    const [sliceIndex, setSliceIndex] = useState(15);
    const totalSlices = 120;

    // Interaction State
    const [activeTool, setActiveTool] = useState<'pan' | 'zoom' | 'wl' | 'measure' | 'scroll'>('pan');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Measurement State
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);

    const [imageLoading, setImageLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setImageLoading(true);
    }, [imageUrl]);

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setContrast(100);
        setBrightness(100);
        setIsInvert(false);
        setRotation(0);
        setFlipH(false);
        setMeasurements([]);
        setActiveTool('pan');
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (activeTool === 'scroll') {
            const delta = Math.sign(e.deltaY);
            setSliceIndex(prev => Math.min(Math.max(1, prev + delta), totalSlices));
        } else {
            const delta = e.deltaY * -0.001;
            setScale(prev => Math.min(Math.max(0.1, prev + delta), 5));
        }
    };

    // Helper to get image coordinates from mouse event
    const getImageCoords = (e: React.MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        // We need screen coordinates inside the container for the SVG overlay
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        return { x: rawX, y: rawY };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'measure') {
            const coords = getImageCoords(e);
            setIsDragging(true);
            setCurrentMeasurement({
                startX: coords.x,
                startY: coords.y,
                endX: coords.x,
                endY: coords.y
            });
        } else {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            
            if (activeTool === 'measure' && currentMeasurement) {
                const coords = getImageCoords(e);
                setCurrentMeasurement(prev => ({
                    ...prev,
                    endX: coords.x,
                    endY: coords.y
                }));
            } else {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;

                if (activeTool === 'pan') {
                    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                } else if (activeTool === 'wl') {
                    setBrightness(prev => prev + dy * 0.5);
                    setContrast(prev => prev + dx * 0.5);
                } else if (activeTool === 'zoom') {
                    setScale(prev => Math.max(0.1, prev + dy * -0.01));
                } else if (activeTool === 'scroll') {
                    // Sensitivity for scroll drag
                    if (Math.abs(dy) > 5) {
                        const change = Math.sign(dy) * -1;
                        setSliceIndex(prev => Math.min(Math.max(1, prev + change), totalSlices));
                        setDragStart({ x: e.clientX, y: e.clientY }); // Reset drag start to throttle
                        return; 
                    }
                    return; // Don't reset dragStart if threshold not met
                }

                setDragStart({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleMouseUp = () => {
        if (activeTool === 'measure' && currentMeasurement) {
            // Finalize measurement
            if (currentMeasurement.startX !== undefined && currentMeasurement.endX !== undefined) {
                const dist = Math.sqrt(
                    Math.pow(currentMeasurement.endX! - currentMeasurement.startX!, 2) + 
                    Math.pow(currentMeasurement.endY! - currentMeasurement.startY!, 2)
                );
                
                // Ignore tiny clicks
                if (dist > 5) {
                    const newMeasure: Measurement = {
                        id: Date.now(),
                        startX: currentMeasurement.startX!,
                        startY: currentMeasurement.startY!,
                        endX: currentMeasurement.endX!,
                        endY: currentMeasurement.endY!,
                        value: parseFloat((dist * 0.264).toFixed(1)) // Mock px to mm conversion
                    };
                    setMeasurements(prev => [...prev, newMeasure]);
                }
            }
            setCurrentMeasurement(null);
        }
        setIsDragging(false);
    };

    // Render measurement lines overlay
    const renderMeasurements = () => {
        // Measurements are drawn on screen coordinates, so they don't rotate with the image currently (simplification)
        // In a real DICOM viewer, annotations are transformed with the image matrix.
        const itemsToRender = [...measurements];
        if (currentMeasurement && currentMeasurement.startX !== undefined) {
            const dist = Math.sqrt(
                Math.pow(currentMeasurement.endX! - currentMeasurement.startX!, 2) + 
                Math.pow(currentMeasurement.endY! - currentMeasurement.startY!, 2)
            );
            itemsToRender.push({
                id: 0,
                startX: currentMeasurement.startX!,
                startY: currentMeasurement.startY!,
                endX: currentMeasurement.endX!,
                endY: currentMeasurement.endY!,
                value: parseFloat((dist * 0.264).toFixed(1))
            });
        }

        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                {itemsToRender.map(m => (
                    <g key={m.id}>
                        <line 
                            x1={m.startX} y1={m.startY} 
                            x2={m.endX} y2={m.endY} 
                            stroke="#facc15" 
                            strokeWidth="2" 
                            strokeDasharray="4 2"
                        />
                        <line x1={m.startX - 5} y1={m.startY} x2={m.startX + 5} y2={m.startY} stroke="#facc15" strokeWidth="2" />
                        <line x1={m.endX - 5} y1={m.endY} x2={m.endX + 5} y2={m.endY} stroke="#facc15" strokeWidth="2" />
                        <text 
                            x={(m.startX + m.endX) / 2} 
                            y={(m.startY + m.endY) / 2 - 10} 
                            fill="#facc15" 
                            fontSize="12" 
                            fontWeight="bold"
                            textAnchor="middle"
                            style={{ textShadow: '1px 1px 2px black' }}
                        >
                            {m.value} mm
                        </text>
                    </g>
                ))}
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-full bg-black text-gray-300 font-mono text-xs select-none relative overflow-hidden group">
            
            {/* Main Viewport */}
            <div 
                ref={containerRef}
                className={`flex-1 relative overflow-hidden flex items-center justify-center bg-black 
                    ${activeTool === 'pan' ? 'cursor-move' : 
                      activeTool === 'wl' || activeTool === 'scroll' ? 'cursor-ns-resize' : 
                      activeTool === 'measure' ? 'cursor-crosshair' : 'cursor-default'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Measurements Overlay */}
                {renderMeasurements()}

                {/* 1. DICOM Overlays - Corners */}
                <div className="absolute top-4 left-4 z-10 space-y-1 text-shadow pointer-events-none">
                    <p className="text-yellow-400 font-bold text-sm uppercase">{patientName}</p>
                    <p className="text-slate-300">ID: <span className="text-white">{patientId}</span></p>
                    <p className="text-slate-300">DOB: 01/01/1980 <span className="text-slate-400">(43Y)</span></p>
                    <p className="text-blue-400 font-bold">{modality} Study</p>
                </div>

                <div className="absolute top-4 right-4 z-10 space-y-1 text-right text-shadow pointer-events-none">
                    <p className="font-bold text-slate-200">CLINICMS RADIOLOGY</p>
                    <p className="text-slate-400">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    <p className="text-slate-300">Acc: {accessionNumber}</p>
                    <p className="text-yellow-400 font-bold">Img: {sliceIndex} / {totalSlices}</p>
                </div>

                <div className="absolute bottom-24 left-4 z-10 space-y-1 text-shadow pointer-events-none">
                    <p>KVP: 120</p>
                    <p>mA: 200</p>
                    <p>Thickness: 5mm</p>
                    <p className="text-orange-400">Zoom: {(scale * 100).toFixed(0)}%</p>
                    {rotation !== 0 && <p className="text-blue-400">Rot: {rotation}°</p>}
                    {flipH && <p className="text-blue-400">Flip: H</p>}
                </div>

                <div className="absolute bottom-24 right-4 z-10 space-y-1 text-right text-shadow pointer-events-none">
                    <p>WL: {contrast.toFixed(0)}</p>
                    <p>WW: {brightness.toFixed(0)}</p>
                    <p>Matrix: 512x512</p>
                </div>

                {/* Orientation Markers (Static for now, ideally rotate with image) */}
                <div className="absolute top-1/2 left-2 text-xl font-bold text-white/50 -translate-y-1/2">R</div>
                <div className="absolute top-1/2 right-2 text-xl font-bold text-white/50 -translate-y-1/2">L</div>
                <div className="absolute top-2 left-1/2 text-xl font-bold text-white/50 -translate-x-1/2">A</div>
                <div className="absolute bottom-24 left-1/2 text-xl font-bold text-white/50 -translate-x-1/2">P</div>

                {/* Loading Indicator */}
                {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* The Image */}
                <img 
                    src={imageUrl} 
                    alt="DICOM" 
                    className={`max-w-full max-h-full transition-opacity duration-200 ease-in-out ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scale(${scale})`,
                        filter: `invert(${isInvert ? 1 : 0}) contrast(${contrast}%) brightness(${brightness}%)`
                    }}
                    draggable={false}
                    onLoad={() => setImageLoading(false)}
                />
            </div>

            {/* 2. Floating Toolbar (Enhanced) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#333] rounded-lg p-1 flex gap-1 z-30 shadow-2xl transition-transform origin-top">
                <div className="flex gap-1 border-r border-[#333] pr-1">
                     <button 
                        onClick={() => setActiveTool('scroll')}
                        className={`p-2 rounded transition-colors ${activeTool === 'scroll' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`} 
                        title="Scroll (Cuộn ảnh)"
                    >
                        <ScrollIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('pan')}
                        className={`p-2 rounded transition-colors ${activeTool === 'pan' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`} 
                        title="Pan (Di chuyển)"
                    >
                        <HandIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('zoom')}
                        className={`p-2 rounded transition-colors ${activeTool === 'zoom' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`} 
                        title="Zoom"
                    >
                        <ZoomInIcon className="w-5 h-5"/>
                    </button>
                     <button 
                        onClick={() => setActiveTool('wl')}
                        className={`p-2 rounded transition-colors ${activeTool === 'wl' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`} 
                        title="Window/Level"
                    >
                        <SunIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex gap-1 border-r border-[#333] px-1">
                    <button 
                        onClick={() => setRotation(r => r - 90)} 
                        className="p-2 rounded text-gray-400 hover:text-white hover:bg-[#333]" 
                        title="Xoay trái 90°"
                    >
                        <RotateLeftIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setRotation(r => r + 90)} 
                        className="p-2 rounded text-gray-400 hover:text-white hover:bg-[#333]" 
                        title="Xoay phải 90°"
                    >
                        <RotateRightIcon className="w-5 h-5"/>
                    </button>
                     <button 
                        onClick={() => setFlipH(f => !f)} 
                        className={`p-2 rounded transition-colors ${flipH ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`} 
                        title="Lật ngang"
                    >
                        <ArrowsRightLeftIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setIsInvert(!isInvert)} 
                        className={`p-2 rounded transition-colors ${isInvert ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`} 
                        title="Invert (Đảo màu)"
                    >
                        <MoonIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex gap-1 pl-1">
                    <button 
                        onClick={() => setActiveTool('measure')}
                        className={`p-2 rounded transition-colors ${activeTool === 'measure' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}
                        title="Measure (Thước)"
                    >
                        <RulerIcon className="w-5 h-5"/>
                    </button>
                    {measurements.length > 0 && (
                        <button 
                            onClick={() => setMeasurements([])} 
                            className="p-2 rounded text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            title="Clear Measurements"
                        >
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    )}
                    <button onClick={resetView} className="p-2 rounded text-gray-400 hover:text-white hover:bg-[#333]" title="Reset View">
                        <RefreshIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* 3. Series Thumbnail Strip (Bottom) */}
            <div className="h-24 bg-[#0f0f0f] border-t border-[#333] p-2 flex gap-2 overflow-x-auto z-20 custom-scrollbar">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className={`aspect-square h-full bg-[#1a1a1a] border-2 ${i === 1 ? 'border-blue-500' : 'border-transparent'} hover:border-gray-500 cursor-pointer relative group flex-shrink-0 rounded-md overflow-hidden transition-all`}>
                        <img 
                            src={imageUrl} 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                            alt={`Series ${i}`}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                            <span className="text-[10px] text-white font-bold block">Ser {i}</span>
                            <span className="text-[9px] text-gray-400 block">{totalSlices} imgs</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MockDicomViewer;

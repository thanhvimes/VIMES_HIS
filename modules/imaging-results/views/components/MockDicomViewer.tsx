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

// New icons for native PACS tools
const AngleIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l-5 5-5-5M12 13v9" />
    </svg>
);

const AreaIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
    </svg>
);

const CameraIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

interface Measurement {
    id: number;
    type: 'distance' | 'angle' | 'area';
    points: { x: number, y: number }[];
    value: string;
}

interface MockDicomViewerProps {
    imageUrl: string;
    patientName: string;
    modality: string;
    patientId?: string;
    accessionNumber?: string;
    onKeyImagesChange?: (urls: string[]) => void;
}

const MockDicomViewer: React.FC<MockDicomViewerProps> = ({ 
    imageUrl, 
    patientName, 
    modality, 
    patientId = 'P00X',
    accessionNumber = 'ACC-2023',
    onKeyImagesChange
}) => {
    // View State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [contrast, setContrast] = useState(100);
    const [brightness, setBrightness] = useState(100);
    const [isInvert, setIsInvert] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    
    // Slice / Stack State
    const [sliceIndex, setSliceIndex] = useState(15);
    const totalSlices = 120;

    // Interaction State
    const [activeTool, setActiveTool] = useState<'pan' | 'zoom' | 'wl' | 'measure' | 'angle' | 'area' | 'scroll'>('pan');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Measurements (In-memory)
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [tempPoints, setTempPoints] = useState<{ x: number, y: number }[]>([]);

    // Key Images State
    const [keySlices, setKeySlices] = useState<number[]>([]);

    const [imageLoading, setImageLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamic CornerstoneJS CDN loader
    useEffect(() => {
        if (!(window as any).cornerstone) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/cornerstone-core@2.3.0/dist/cornerstone.js';
            script.async = true;
            script.onload = () => {
                console.log('CornerstoneJS loaded successfully in background.');
            };
            document.body.appendChild(script);
            return () => {
                try {
                    document.body.removeChild(script);
                } catch (e) {}
            };
        }
    }, []);

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
        setTempPoints([]);
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

    const getImageCoords = (e: React.MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const coords = getImageCoords(e);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });

        if (activeTool === 'measure') {
            setTempPoints([coords, coords]);
        } else if (activeTool === 'area') {
            setTempPoints([coords, coords]);
        } else if (activeTool === 'angle') {
            if (tempPoints.length === 0) {
                setTempPoints([coords]);
            } else if (tempPoints.length === 1) {
                setTempPoints(prev => [...prev, coords]);
            } else if (tempPoints.length === 2) {
                // Finalize Angle
                const p1 = tempPoints[0];
                const p2 = tempPoints[1];
                const p3 = coords;
                
                // Calculate Angle
                const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
                const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
                const dot = v1.x * v2.x + v1.y * v2.y;
                const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                let angleDeg = 0;
                if (mag1 * mag2 > 0) {
                    angleDeg = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
                }

                const newMeasure: Measurement = {
                    id: Date.now(),
                    type: 'angle',
                    points: [p1, p2, p3],
                    value: `${angleDeg.toFixed(1)}°`
                };
                setMeasurements(prev => [...prev, newMeasure]);
                setTempPoints([]);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const coords = getImageCoords(e);

        if (activeTool === 'measure' && tempPoints.length > 0) {
            setTempPoints([tempPoints[0], coords]);
        } else if (activeTool === 'area' && tempPoints.length > 0) {
            setTempPoints([tempPoints[0], coords]);
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
                if (Math.abs(dy) > 4) {
                    const change = Math.sign(dy) * -1;
                    setSliceIndex(prev => Math.min(Math.max(1, prev + change), totalSlices));
                    setDragStart({ x: e.clientX, y: e.clientY });
                }
                return;
            }
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);

        if (activeTool === 'measure' && tempPoints.length === 2) {
            const p1 = tempPoints[0];
            const p2 = tempPoints[1];
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            if (dist > 5) {
                const newMeasure: Measurement = {
                    id: Date.now(),
                    type: 'distance',
                    points: [p1, p2],
                    value: `${(dist * 0.264).toFixed(1)} mm`
                };
                setMeasurements(prev => [...prev, newMeasure]);
            }
            setTempPoints([]);
        } else if (activeTool === 'area' && tempPoints.length === 2) {
            const p1 = tempPoints[0];
            const p2 = tempPoints[1];
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);
            const area = (w * 0.264) * (h * 0.264);
            if (w > 5 && h > 5) {
                const newMeasure: Measurement = {
                    id: Date.now(),
                    type: 'area',
                    points: [p1, p2],
                    value: `${area.toFixed(1)} mm²`
                };
                setMeasurements(prev => [...prev, newMeasure]);
            }
            setTempPoints([]);
        }
    };

    // Toggle current slice as Key Image
    const handleCaptureKeyImage = () => {
        let updated: number[];
        if (keySlices.includes(sliceIndex)) {
            updated = keySlices.filter(s => s !== sliceIndex);
        } else {
            updated = [...keySlices, sliceIndex];
        }
        setKeySlices(updated);
        
        // Notify parent with serialized mock URLs or labels
        if (onKeyImagesChange) {
            const urls = updated.map(s => `${imageUrl}?slice=${s}`);
            onKeyImagesChange(urls);
        }
    };

    const renderMeasurements = () => {
        const items = [...measurements];
        
        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                {/* Render temp lines while drawing */}
                {tempPoints.length > 0 && activeTool === 'measure' && (
                    <g>
                        <line x1={tempPoints[0].x} y1={tempPoints[0].y} x2={tempPoints[1].x} y2={tempPoints[1].y} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3"/>
                        <circle cx={tempPoints[0].x} cy={tempPoints[0].y} r="3" fill="#38bdf8" />
                        <circle cx={tempPoints[1].x} cy={tempPoints[1].y} r="3" fill="#38bdf8" />
                    </g>
                )}
                {tempPoints.length > 0 && activeTool === 'area' && (
                    <g>
                        <rect 
                            x={Math.min(tempPoints[0].x, tempPoints[1].x)} 
                            y={Math.min(tempPoints[0].y, tempPoints[1].y)} 
                            width={Math.abs(tempPoints[1].x - tempPoints[0].x)}
                            height={Math.abs(tempPoints[1].y - tempPoints[0].y)}
                            stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="rgba(56, 189, 248, 0.1)"
                        />
                    </g>
                )}
                {tempPoints.length > 0 && activeTool === 'angle' && (
                    <g>
                        {tempPoints.map((pt, idx) => (
                            <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#38bdf8" />
                        ))}
                        {tempPoints.length === 2 && (
                            <line x1={tempPoints[0].x} y1={tempPoints[0].y} x2={tempPoints[1].x} y2={tempPoints[1].y} stroke="#38bdf8" strokeWidth="2" />
                        )}
                    </g>
                )}

                {/* Render established measurements */}
                {items.map(m => {
                    if (m.type === 'distance') {
                        const [p1, p2] = m.points;
                        return (
                            <g key={m.id}>
                                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#facc15" strokeWidth="2"/>
                                <text x={(p1.x + p2.x)/2} y={(p1.y + p2.y)/2 - 8} fill="#facc15" fontSize="12" fontWeight="bold" textAnchor="middle" style={{ textShadow: '1px 1px 2px black' }}>
                                    {m.value}
                                </text>
                            </g>
                        );
                    }
                    if (m.type === 'area') {
                        const [p1, p2] = m.points;
                        const x = Math.min(p1.x, p2.x);
                        const y = Math.min(p1.y, p2.y);
                        const w = Math.abs(p2.x - p1.x);
                        const h = Math.abs(p2.y - p1.y);
                        return (
                            <g key={m.id}>
                                <rect x={x} y={y} width={w} height={h} stroke="#facc15" strokeWidth="2" fill="none"/>
                                <text x={x + w/2} y={y + h/2} fill="#facc15" fontSize="11" fontWeight="bold" textAnchor="middle" style={{ textShadow: '1px 1px 2px black' }}>
                                    {m.value}
                                </text>
                            </g>
                        );
                    }
                    if (m.type === 'angle') {
                        const [p1, p2, p3] = m.points;
                        return (
                            <g key={m.id}>
                                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#facc15" strokeWidth="2" />
                                <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="#facc15" strokeWidth="2" />
                                <circle cx={p1.x} cy={p1.y} r="3" fill="#facc15" />
                                <circle cx={p2.x} cy={p2.y} r="4" fill="#eab308" />
                                <circle cx={p3.x} cy={p3.y} r="3" fill="#facc15" />
                                <text x={p2.x} y={p2.y - 12} fill="#facc15" fontSize="12" fontWeight="bold" textAnchor="middle" style={{ textShadow: '1px 1px 2px black' }}>
                                    {m.value}
                                </text>
                            </g>
                        );
                    }
                    return null;
                })}
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-full bg-black text-gray-300 font-mono text-xs select-none relative overflow-hidden group">
            
            {/* Viewport Area */}
            <div 
                ref={containerRef}
                className={`flex-1 relative overflow-hidden flex items-center justify-center bg-black 
                    ${activeTool === 'pan' ? 'cursor-move' : 
                      activeTool === 'wl' || activeTool === 'scroll' ? 'cursor-ns-resize' : 
                      activeTool === 'measure' || activeTool === 'angle' || activeTool === 'area' ? 'cursor-crosshair' : 'cursor-default'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Render Canvas annotations */}
                {renderMeasurements()}

                {/* Patient Overlays */}
                <div className="absolute top-4 left-4 z-10 space-y-1 text-shadow pointer-events-none">
                    <p className="text-yellow-400 font-bold text-sm uppercase">{patientName}</p>
                    <p className="text-slate-300">ID: <span className="text-white">{patientId}</span></p>
                    <p className="text-slate-300">Modality: <span className="text-blue-400 font-bold">{modality}</span></p>
                </div>

                <div className="absolute top-4 right-4 z-10 space-y-1 text-right text-shadow pointer-events-none">
                    <p className="font-bold text-slate-200">vClinic Native PACS</p>
                    <p className="text-slate-400">{new Date().toLocaleDateString()}</p>
                    <p className="text-yellow-400 font-bold">Lát cắt: {sliceIndex} / {totalSlices}</p>
                </div>

                <div className="absolute bottom-24 left-4 z-10 space-y-1 text-shadow pointer-events-none">
                    <p className="text-orange-400">Tỷ lệ: {(scale * 100).toFixed(0)}%</p>
                    {rotation !== 0 && <p className="text-blue-400">Xoay: {rotation}°</p>}
                    {keySlices.includes(sliceIndex) && (
                        <p className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-black uppercase inline-block animate-pulse pointer-events-auto">
                            ★ Ảnh chính (Key Image)
                        </p>
                    )}
                </div>

                <div className="absolute bottom-24 right-14 z-10 space-y-1 text-right text-shadow pointer-events-none">
                    <p>Độ sáng: {brightness.toFixed(0)}</p>
                    <p>Tương phản: {contrast.toFixed(0)}</p>
                </div>

                {/* DICOM Slice Scroll Slider on the right */}
                <div className="absolute right-4 top-24 bottom-28 w-6 flex flex-col items-center justify-between z-30 bg-black/60 backdrop-blur-sm rounded-full py-4 border border-slate-700">
                    <span className="text-[9px] font-bold text-slate-500">1</span>
                    <input 
                        type="range" 
                        min="1" 
                        max={totalSlices} 
                        value={sliceIndex} 
                        onChange={e => setSliceIndex(parseInt(e.target.value))}
                        className="w-32 -rotate-90 origin-center cursor-ns-resize accent-purple-600"
                        style={{ transform: 'rotate(-90deg) translateY(-2px)' }}
                    />
                    <span className="text-[9px] font-bold text-slate-500">{totalSlices}</span>
                </div>

                {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                <img 
                    src={imageUrl} 
                    alt="DICOM Slice" 
                    className={`max-w-full max-h-full transition-opacity duration-200 ease-in-out ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scale(${scale})`,
                        filter: `invert(${isInvert ? 1 : 0}) contrast(${contrast}%) brightness(${brightness}%)`
                    }}
                    draggable={false}
                    onLoad={() => setImageLoading(false)}
                />
            </div>

            {/* Toolbar */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#111] border border-slate-800 rounded-xl p-1 flex gap-1 z-30 shadow-2xl">
                <div className="flex gap-1 border-r border-slate-800 pr-1">
                    <button 
                        onClick={() => setActiveTool('scroll')}
                        className={`p-2 rounded-lg transition ${activeTool === 'scroll' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`} 
                        title="Scroll (Cuộn lát cắt)"
                    >
                        <ScrollIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('pan')}
                        className={`p-2 rounded-lg transition ${activeTool === 'pan' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`} 
                        title="Pan (Di chuyển)"
                    >
                        <HandIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('zoom')}
                        className={`p-2 rounded-lg transition ${activeTool === 'zoom' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`} 
                        title="Zoom"
                    >
                        <ZoomInIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('wl')}
                        className={`p-2 rounded-lg transition ${activeTool === 'wl' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`} 
                        title="Độ tương phản (WW/WL)"
                    >
                        <SunIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex gap-1 border-r border-slate-800 px-1">
                    <button onClick={() => setRotation(r => r - 90)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#222]" title="Xoay trái 90°"><RotateLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => setRotation(r => r + 90)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#222]" title="Xoay phải 90°"><RotateRightIcon className="w-5 h-5"/></button>
                    <button onClick={() => setFlipH(f => !f)} className={`p-2 rounded-lg transition ${flipH ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`} title="Lật gương"><ArrowsRightLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsInvert(!isInvert)} className={`p-2 rounded-lg transition ${isInvert ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`} title="Đảo màu"><MoonIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex gap-1 px-1 border-r border-slate-800">
                    <button 
                        onClick={() => setActiveTool('measure')}
                        className={`p-2 rounded-lg transition ${activeTool === 'measure' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        title="Đo khoảng cách (Ruler)"
                    >
                        <RulerIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('angle')}
                        className={`p-2 rounded-lg transition ${activeTool === 'angle' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        title="Đo góc (Angle)"
                    >
                        <AngleIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => setActiveTool('area')}
                        className={`p-2 rounded-lg transition ${activeTool === 'area' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        title="Đo vùng ROI (Area)"
                    >
                        <AreaIcon className="w-5 h-5"/>
                    </button>
                    {measurements.length > 0 && (
                        <button onClick={() => setMeasurements([])} className="p-2 rounded-lg text-rose-500 hover:bg-rose-950/20" title="Xóa đo đạc"><TrashIcon className="w-5 h-5"/></button>
                    )}
                </div>

                <div className="flex gap-1 pl-1">
                    <button 
                        onClick={handleCaptureKeyImage} 
                        className={`p-2 rounded-lg transition ${keySlices.includes(sliceIndex) ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        title="Đánh dấu làm ảnh chính (Key Image)"
                    >
                        <CameraIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={resetView} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#222]" title="Tải lại khung hình"><RefreshIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {/* series thumb strip */}
            <div className="h-24 bg-[#0a0a0a] border-t border-slate-900 p-2 flex gap-2 overflow-x-auto z-20 custom-scrollbar">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`aspect-square h-full bg-[#111] border-2 ${i === 1 ? 'border-purple-600' : 'border-transparent'} hover:border-slate-700 cursor-pointer relative group flex-shrink-0 rounded-lg overflow-hidden`}>
                        <img src={imageUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt={`Series ${i}`} />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                            <span className="text-[10px] text-white font-bold block">Series {i}</span>
                            <span className="text-[9px] text-gray-400 block">{totalSlices} slices</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MockDicomViewer;

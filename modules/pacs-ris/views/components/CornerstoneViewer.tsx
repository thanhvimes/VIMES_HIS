import React, { useState, useRef, useEffect } from 'react';

// Custom high-quality SVG icons to match the PMR PACS Viewer screenshot
const SidebarIcon = ({ name, active, onClick, title }: { name: string; active?: boolean; onClick?: () => void; title?: string }) => {
    const activeClass = active ? 'bg-orange-600/90 text-white shadow shadow-orange-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80';
    return (
        <button 
            onClick={onClick} 
            className={`p-2.5 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${activeClass}`}
            title={title}
        >
            {name === 'layout' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )}
            {name === 'series' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )}
            {name === 'pan' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            )}
            {name === 'zoom' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
            )}
            {name === 'wl' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
            )}
            {name === 'magnify' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="10" cy="10" r="7" />
                    <line x1="21" y1="21" x2="15" y2="15" />
                    <circle cx="10" cy="10" r="3" fill="currentColor" fillOpacity={0.3} />
                </svg>
            )}
            {name === 'scroll' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            )}
            {name === 'localizer' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 3" />
                    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 3" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" />
                </svg>
            )}
            {name === 'ruler' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2m-2-4h2m-2-4h2" />
                </svg>
            )}
            {name === 'angle' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l-5 5-5-5M12 13v9" />
                </svg>
            )}
            {name === 'area' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
                </svg>
            )}
            {name === 'text' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )}
            {name === 'trash' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            )}
            {name === 'play' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            )}
            {name === 'pause' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
            )}
            {name === 'sync' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
            )}
        </button>
    );
};

interface Measurement {
    id: number;
    type: 'distance' | 'angle' | 'area' | 'text';
    points: { x: number, y: number }[];
    value: string;
}

interface Series {
    id: string;
    name: string;
    frameCount: number;
    thumbnailUrl: string;
    imageUrl: string;
    modality: string;
    seriesDesc: string;
    sliceThickness: string;
    coil?: string;
    fa?: string;
    tr?: string;
    te?: string;
}

// Multi-series high fidelity mock databases matching Radiopaedia spine MRI / CT brain
const MOCK_SERIES_DATABASE: Record<string, Series[]> = {
    'MRI': [
        {
            id: 'mri-s1',
            name: '0 - t2_tse_sag',
            frameCount: 14,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/523822/75b32f560343670853330762066550_jumbo.jpg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/523822/75b32f560343670853330762066550_jumbo.jpg',
            modality: 'MRI',
            seriesDesc: 't2_tse_sag',
            sliceThickness: '4.8 mm',
            coil: 'Spine_18',
            fa: '150',
            tr: '3500',
            te: '97'
        },
        {
            id: 'mri-s2',
            name: '1 - t1_tse_sag',
            frameCount: 15,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/15317377/7d4e32d8479e001b97cd487372e9a5_jumbo.jpeg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/15317377/7d4e32d8479e001b97cd487372e9a5_jumbo.jpeg',
            modality: 'MRI',
            seriesDesc: 't1_tse_sag',
            sliceThickness: '4.8 mm',
            coil: 'Spine_18',
            fa: '137',
            tr: '530',
            te: '7.9'
        },
        {
            id: 'mri-s3',
            name: '2 - t2_tse_stir_sag',
            frameCount: 15,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/15317381/a43878b27eb5c31cc924372e9b282d_jumbo.jpeg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/15317381/a43878b27eb5c31cc924372e9b282d_jumbo.jpeg',
            modality: 'MRI',
            seriesDesc: 't2_tse_stir_sag',
            sliceThickness: '4.8 mm',
            coil: 'Spine_18',
            fa: '150',
            tr: '2670',
            te: '42'
        },
        {
            id: 'mri-s4',
            name: '3 - t2_tse_tra_msma',
            frameCount: 20,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/523847/56a2be29e8b6680a6b7d1590496885_jumbo.jpg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/523847/56a2be29e8b6680a6b7d1590496885_jumbo.jpg',
            modality: 'MRI',
            seriesDesc: 't2_tse_tra_msma',
            sliceThickness: '4.4 mm',
            coil: 'Spine_18',
            fa: '150',
            tr: '4620',
            te: '97'
        },
        {
            id: 'mri-s5',
            name: '4 - t2_tse_stir_cor',
            frameCount: 15,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/15317386/81a95e0c52bb1cc32b27072a4e9b98_jumbo.jpeg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/15317386/81a95e0c52bb1cc32b27072a4e9b98_jumbo.jpeg',
            modality: 'MRI',
            seriesDesc: 't2_tse_stir_cor',
            sliceThickness: '4.8 mm',
            coil: 'Spine_18',
            fa: '150',
            tr: '3000',
            te: '50'
        }
    ],
    'CT': [
        {
            id: 'ct-s1',
            name: '0 - Axial Brain',
            frameCount: 30,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/2296062/c6c702c3e7c03a765f59049603e22e_jumbo.jpg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/2296062/c6c702c3e7c03a765f59049603e22e_jumbo.jpg',
            modality: 'CT',
            seriesDesc: 'Axial Brain',
            sliceThickness: '5.0 mm',
            coil: 'Head_16',
            fa: '90',
            tr: '120',
            te: '1.2'
        },
        {
            id: 'ct-s2',
            name: '1 - Coronal Brain',
            frameCount: 20,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/2296070/fdf870f2d8e411b98ac5a52a4a98f1_jumbo.jpg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/2296070/fdf870f2d8e411b98ac5a52a4a98f1_jumbo.jpg',
            modality: 'CT',
            seriesDesc: 'Coronal Brain',
            sliceThickness: '5.0 mm',
            coil: 'Head_16',
            fa: '90',
            tr: '120',
            te: '1.2'
        },
        {
            id: 'ct-s3',
            name: '2 - Sagittal Brain',
            frameCount: 20,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/2296068/7db870c5e7b233a7f805a5a1f6a1d8_jumbo.jpg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/2296068/7db870c5e7b233a7f805a5a1f6a1d8_jumbo.jpg',
            modality: 'CT',
            seriesDesc: 'Sagittal Brain',
            sliceThickness: '5.0 mm',
            coil: 'Head_16',
            fa: '90',
            tr: '120',
            te: '1.2'
        }
    ],
    'X-Ray': [
        {
            id: 'xr-s1',
            name: '0 - Chest AP',
            frameCount: 1,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/31521/0a8d37d7996342775b761094577303_jumbo.jpeg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/31521/0a8d37d7996342775b761094577303_jumbo.jpeg',
            modality: 'X-Ray',
            seriesDesc: 'Chest AP',
            sliceThickness: 'N/A',
            coil: 'FlatPanel',
            fa: 'N/A',
            tr: 'N/A',
            te: 'N/A'
        },
        {
            id: 'xr-s2',
            name: '1 - Chest Lateral',
            frameCount: 1,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/15456385/87e7be2807667cc4a9844bb95a5832a_jumbo.jpeg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/15456385/87e7be2807667cc4a9844bb95a5832a_jumbo.jpeg',
            modality: 'X-Ray',
            seriesDesc: 'Chest Lateral',
            sliceThickness: 'N/A',
            coil: 'FlatPanel',
            fa: 'N/A',
            tr: 'N/A',
            te: 'N/A'
        }
    ],
    'Ultrasound': [
        {
            id: 'us-s1',
            name: '0 - Abdomen Sagittal',
            frameCount: 1,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/6057290/93d9667d9266733660227072365724_jumbo.jpg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/6057290/93d9667d9266733660227072365724_jumbo.jpg',
            modality: 'Ultrasound',
            seriesDesc: 'Abdomen Sagittal',
            sliceThickness: 'N/A',
            coil: 'Convex C3',
            fa: 'N/A',
            tr: 'N/A',
            te: 'N/A'
        },
        {
            id: 'us-s2',
            name: '1 - Abdomen Transverse',
            frameCount: 1,
            thumbnailUrl: 'https://prod-images-static.radiopaedia.org/images/15712165/bb0887b8f9e6149a4603cc27072365_jumbo.jpeg',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/15712165/bb0887b8f9e6149a4603cc27072365_jumbo.jpeg',
            modality: 'Ultrasound',
            seriesDesc: 'Abdomen Transverse',
            sliceThickness: 'N/A',
            coil: 'Convex C3',
            fa: 'N/A',
            tr: 'N/A',
            te: 'N/A'
        }
    ]
};

interface CornerstoneViewerProps {
    imageUrl: string;
    patientName: string;
    modality: string;
    patientId?: string;
    studyUid?: string;
    onKeyImagesChange?: (urls: string[]) => void;
}

const CornerstoneViewer: React.FC<CornerstoneViewerProps> = ({ 
    imageUrl, 
    patientName, 
    modality: initialModality, 
    patientId = '260005428',
    studyUid = '1.2.840.113619.2.55.3.28311617',
    onKeyImagesChange
}) => {
    const modality = (initialModality === 'MRI' || initialModality === 'CT' || initialModality === 'X-Ray' || initialModality === 'Ultrasound') ? initialModality : 'MRI';

    const seriesData = MOCK_SERIES_DATABASE[modality] || MOCK_SERIES_DATABASE['MRI'];

    // Grid states
    const [gridCols, setGridCols] = useState(2);
    const [gridRows, setGridRows] = useState(2);
    const [activeViewport, setActiveViewport] = useState(0);
    const [maximizedViewport, setMaximizedViewport] = useState<number | null>(null);

    // Collapsible sidebar state
    const [showSeriesList, setShowSeriesList] = useState(true);

    // Synchronized scrolling state
    const [isSynchronized, setIsSynchronized] = useState(false);

    // Tools state
    const [activeTool, setActiveTool] = useState<'pan' | 'zoom' | 'wl' | 'scroll' | 'measure' | 'angle' | 'area' | 'text' | 'magnify' | 'localizer'>('scroll');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [tempPoints, setTempPoints] = useState<{ x: number, y: number }[]>([]);
    
    // Cine loop player state
    const [cinePlaying, setCinePlaying] = useState(false);

    // Magnifying glass overlay coordinates
    const [magnifierPos, setMagnifierPos] = useState<{ x: number, y: number } | null>(null);

    // Viewports settings
    const [viewports, setViewports] = useState<Array<{
        seriesId: string;
        scale: number;
        position: { x: number, y: number };
        contrast: number;
        brightness: number;
        isInvert: boolean;
        rotation: number;
        flipH: boolean;
        sliceIndex: number;
        measurements: Measurement[];
        keySlices: number[];
        showInfo: boolean;
        windowPreset: string;
    }>>(() => {
        return Array(9).fill(null).map((_, idx) => {
            const defaultSeries = seriesData[idx % seriesData.length];
            return {
                seriesId: defaultSeries ? defaultSeries.id : seriesData[0].id,
                scale: 1.05,
                position: { x: 0, y: 0 },
                contrast: 100,
                brightness: 100,
                isInvert: false,
                rotation: 0,
                flipH: false,
                sliceIndex: idx === 3 ? 11 : 9, // matching screenshot view slice indices (e.g. 9/14, 9/15, 11/20)
                measurements: [],
                keySlices: [],
                showInfo: true,
                windowPreset: 'Nor'
            };
        });
    });

    const containerRefs = useRef<Array<HTMLDivElement | null>>([]);

    const activeVp = viewports[activeViewport] || viewports[0];
    const activeSeries = seriesData.find(s => s.id === activeVp.seriesId) || seriesData[0];
    const totalViewports = maximizedViewport !== null ? 1 : gridCols * gridRows;

    // Reset default viewports when patient/modality changes
    useEffect(() => {
        setViewports(Array(9).fill(null).map((_, idx) => {
            const defaultSeries = seriesData[idx % seriesData.length];
            return {
                seriesId: defaultSeries ? defaultSeries.id : seriesData[0].id,
                scale: 1.05,
                position: { x: 0, y: 0 },
                contrast: 100,
                brightness: 100,
                isInvert: false,
                rotation: 0,
                flipH: false,
                sliceIndex: idx === 3 ? 11 : 9,
                measurements: [],
                keySlices: [],
                showInfo: true,
                windowPreset: 'Nor'
            };
        }));
        setCinePlaying(false);
    }, [modality]);

    // Cine Loop Player Effect
    useEffect(() => {
        if (!cinePlaying) return;
        
        const interval = setInterval(() => {
            setViewports(prev => prev.map((vp, idx) => {
                const isTarget = isSynchronized || idx === activeViewport;
                if (!isTarget) return vp;

                const currentSeries = seriesData.find(s => s.id === vp.seriesId) || seriesData[0];
                const nextSlice = vp.sliceIndex >= currentSeries.frameCount ? 1 : vp.sliceIndex + 1;
                return {
                    ...vp,
                    sliceIndex: nextSlice
                };
            }));
        }, 150); // 7 fps cine speed

        return () => clearInterval(interval);
    }, [cinePlaying, activeViewport, isSynchronized]);

    const updateViewport = (idx: number, updates: Partial<typeof viewports[0]>) => {
        setViewports(prev => prev.map((vp, i) => i === idx ? { ...vp, ...updates } : vp));
    };

    const resetView = () => {
        setViewports(prev => prev.map((vp, i) => i === activeViewport ? {
            ...vp,
            scale: 1.05,
            position: { x: 0, y: 0 },
            contrast: 100,
            brightness: 100,
            isInvert: false,
            rotation: 0,
            flipH: false,
            sliceIndex: 9,
            measurements: [],
            windowPreset: 'Nor'
        } : vp));
        setTempPoints([]);
        setActiveTool('scroll');
        setMagnifierPos(null);
    };

    const handleWheel = (e: React.WheelEvent, idx: number) => {
        e.preventDefault();
        const targetViewports = isSynchronized ? Array.from({ length: totalViewports }, (_, i) => i) : [idx];
        
        targetViewports.forEach(vpIdx => {
            const vp = viewports[vpIdx];
            const currentSeries = seriesData.find(s => s.id === vp.seriesId) || seriesData[0];
            
            if (activeTool === 'scroll' || activeTool === 'localizer') {
                const delta = Math.sign(e.deltaY);
                const nextSlice = Math.min(Math.max(1, vp.sliceIndex + delta), currentSeries.frameCount);
                updateViewport(vpIdx, { sliceIndex: nextSlice });
            } else {
                const delta = e.deltaY * -0.001;
                const nextScale = Math.min(Math.max(0.1, vp.scale + delta), 6);
                updateViewport(vpIdx, { scale: nextScale });
            }
        });
    };

    const getImageCoords = (e: React.MouseEvent, idx: number) => {
        const el = containerRefs.current[idx];
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return {
            x: Math.round(e.clientX - rect.left),
            y: Math.round(e.clientY - rect.top)
        };
    };

    const handleMouseDown = (e: React.MouseEvent, idx: number) => {
        if (e.button !== 0) return; // Only left click
        setActiveViewport(idx);
        const coords = getImageCoords(e, idx);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });

        if (activeTool === 'magnify') {
            setMagnifierPos(coords);
        } else if (activeTool === 'measure' || activeTool === 'area') {
            setTempPoints([coords, coords]);
        } else if (activeTool === 'angle') {
            if (tempPoints.length === 0 || tempPoints.length >= 3) {
                setTempPoints([coords]);
            } else {
                setTempPoints(prev => [...prev, coords]);
            }
        } else if (activeTool === 'text') {
            const textStr = prompt("Nhập nội dung chú thích (Annotation Text):", "Bất thường");
            if (textStr) {
                const newMeasure: Measurement = {
                    id: Date.now(),
                    type: 'text',
                    points: [coords],
                    value: textStr
                };
                updateViewport(idx, { measurements: [...viewports[idx].measurements, newMeasure] });
            }
            setIsDragging(false);
        }
    };

    const handleMouseMove = (e: React.MouseEvent, idx: number) => {
        const coords = getImageCoords(e, idx);
        
        if (activeTool === 'magnify') {
            setMagnifierPos(coords);
        }

        if (!isDragging || activeViewport !== idx) return;

        const vp = viewports[idx];
        const currentSeries = seriesData.find(s => s.id === vp.seriesId) || seriesData[0];

        if ((activeTool === 'measure' || activeTool === 'area') && tempPoints.length > 0) {
            setTempPoints([tempPoints[0], coords]);
        } else if (activeTool === 'angle' && tempPoints.length > 0) {
            setTempPoints(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = coords;
                return copy;
            });
        } else {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            const targetViewports = isSynchronized ? Array.from({ length: totalViewports }, (_, i) => i) : [idx];

            targetViewports.forEach(vpIdx => {
                const targetVp = viewports[vpIdx];
                const targetSeries = seriesData.find(s => s.id === targetVp.seriesId) || seriesData[0];

                if (activeTool === 'pan') {
                    updateViewport(vpIdx, { position: { x: targetVp.position.x + dx, y: targetVp.position.y + dy } });
                } else if (activeTool === 'wl') {
                    updateViewport(vpIdx, {
                        brightness: Math.max(10, targetVp.brightness + dy * 0.4),
                        contrast: Math.max(10, targetVp.contrast + dx * 0.4)
                    });
                } else if (activeTool === 'zoom') {
                    updateViewport(vpIdx, { scale: Math.max(0.1, targetVp.scale + dy * -0.008) });
                } else if (activeTool === 'scroll' || activeTool === 'localizer') {
                    if (Math.abs(dy) > 5) {
                        const change = Math.sign(dy) * -1;
                        const nextSlice = Math.min(Math.max(1, targetVp.sliceIndex + change), targetSeries.frameCount);
                        updateViewport(vpIdx, { sliceIndex: nextSlice });
                    }
                }
            });

            if (activeTool !== 'scroll' && activeTool !== 'localizer') {
                setDragStart({ x: e.clientX, y: e.clientY });
            } else if (Math.abs(dy) > 5) {
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent, idx: number) => {
        setIsDragging(false);
        const vp = viewports[idx];

        if (activeTool === 'measure' && tempPoints.length === 2) {
            const p1 = tempPoints[0];
            const p2 = tempPoints[1];
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            if (dist > 5) {
                const newMeasure: Measurement = {
                    id: Date.now(),
                    type: 'distance',
                    points: [p1, p2],
                    value: `${(dist * 0.18).toFixed(1)} cm` // custom calibrated scale factor
                };
                updateViewport(idx, { measurements: [...vp.measurements, newMeasure] });
            }
            setTempPoints([]);
        } else if (activeTool === 'area' && tempPoints.length === 2) {
            const p1 = tempPoints[0];
            const p2 = tempPoints[1];
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);
            const area = (w * 0.18) * (h * 0.18);
            if (w > 5 && h > 5) {
                const newMeasure: Measurement = {
                    id: Date.now(),
                    type: 'area',
                    points: [p1, p2],
                    value: `${area.toFixed(1)} cm²`
                };
                updateViewport(idx, { measurements: [...vp.measurements, newMeasure] });
            }
            setTempPoints([]);
        } else if (activeTool === 'angle' && tempPoints.length === 3) {
            const [p1, p2, p3] = tempPoints;
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
            updateViewport(idx, { measurements: [...vp.measurements, newMeasure] });
            setTempPoints([]);
        }
    };

    const handleMouseLeave = () => {
        setMagnifierPos(null);
        setIsDragging(false);
    };

    const handleSelectSeries = (seriesId: string) => {
        const viewportToUpdate = activeViewport;
        updateViewport(viewportToUpdate, { 
            seriesId, 
            sliceIndex: 1 
        });
    };

    const handleCaptureKeyImage = () => {
        const idx = activeViewport;
        const vp = viewports[idx];
        const series = seriesData.find(s => s.id === vp.seriesId) || seriesData[0];
        let updated: number[];
        if (vp.keySlices.includes(vp.sliceIndex)) {
            updated = vp.keySlices.filter(s => s !== vp.sliceIndex);
        } else {
            updated = [...vp.keySlices, vp.sliceIndex];
        }
        updateViewport(idx, { keySlices: updated });

        if (onKeyImagesChange) {
            const allUrls: string[] = [];
            viewports.forEach((v, i) => {
                v.keySlices.forEach(s => {
                    allUrls.push(`${series.imageUrl}?v=${i}&slice=${s}`);
                });
            });
            onKeyImagesChange(allUrls);
        }
    };

    const clearAllMeasurements = (idx: number) => {
        updateViewport(idx, { measurements: [] });
        setTempPoints([]);
    };

    const applyPreset = (idx: number, preset: string) => {
        let b = 100, c = 100;
        if (preset === 'Bone') {
            b = 70; c = 180;
        } else if (preset === 'Soft') {
            b = 110; c = 80;
        } else if (preset === 'Lung') {
            b = 130; c = 140;
        }
        updateViewport(idx, { brightness: b, contrast: c, windowPreset: preset });
    };

    // Reference lines coordinates calculation (dynamic based on active slice scroll)
    const renderCrossReferenceLines = (idx: number, isAxial: boolean, width: number, height: number) => {
        if (activeTool !== 'localizer' || totalViewports !== 4) return null;

        // If viewport is Axial, draw vertical lines matching Sagittal slice indices
        if (isAxial) {
            // Find active sagittal viewport (e.g., Viewport 0)
            const sagVp = viewports[0] || viewports[0];
            const percent = sagVp.sliceIndex / 14; // sag has 14 frames
            const xPos = Math.round(width * 0.2 + (width * 0.6) * percent);
            return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <line x1={xPos} y1="0" x2={xPos} y2={height} stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 2" />
                    <text x={xPos + 5} y={height - 20} fill="#eab308" fontSize="11" className="font-mono font-bold" style={{ textShadow: '1px 1px 1px black' }}>L4</text>
                </svg>
            );
        } else {
            // If viewport is Sagittal, draw horizontal lines matching Axial slice index
            const axialVp = viewports[3] || viewports[0]; // axial is in viewport 3
            const percent = axialVp.sliceIndex / 20; // axial has 20 frames
            const yPos = Math.round(height * 0.15 + (height * 0.7) * percent);
            return (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <line x1="0" y1={yPos} x2={width} y2={yPos} stroke="#eab308" strokeWidth="1.5" strokeDasharray="3 2" />
                </svg>
            );
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0D11] text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-900 font-sans">
            
            {/* 1. PMR PACS Viewer Top Header (Match Screenshot exactly) */}
            <div className="bg-[#12161F]/90 px-4 py-2 border-b border-[#090A0F] flex items-center justify-between z-30 select-none">
                <div className="flex items-center gap-3">
                    {/* Brand Logo */}
                    <div className="flex items-center text-sm font-black tracking-tight select-none">
                        <span className="text-white">PMR</span>
                        <span className="text-orange-500 ml-0.5">PACS</span>
                    </div>

                    <div className="w-px h-5 bg-slate-800"></div>

                    {/* Patient Context Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg text-xs font-bold text-slate-200 border border-slate-800 transition cursor-pointer">
                            <span className="uppercase text-orange-400 font-mono tracking-wider font-extrabold">{patientName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">| 11/06/2026 10:17 - {modality}</span>
                            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        
                        {/* Quick dropdown content (hover) */}
                        <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 text-[11px] text-slate-400 space-y-1.5 hidden group-hover:block z-50">
                            <div>Họ và tên: <span className="font-bold text-white uppercase">{patientName}</span></div>
                            <div>Mã bệnh nhân: <span className="font-bold text-white font-mono">{patientId}</span></div>
                            <div>Năm sinh: <span className="font-bold text-white">1987</span></div>
                            <div>Giới tính: <span className="font-bold text-white">Nữ</span></div>
                            <div className="h-px bg-slate-800 my-1"></div>
                            <div>Study UID: <span className="font-bold text-slate-300 font-mono">{studyUid}</span></div>
                            <div>Thiết bị chụp: <span className="font-bold text-slate-300">Siemens Magnetom Aera 1.5T</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Top Actions */}
                <div className="flex items-center gap-1.5">
                    <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Tải ảnh DICOM">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Mở thư mục lưu trữ">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </button>
                    <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Cấu hình hệ thống">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                    <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title="Toàn màn hình">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5m-11 11h4m-4 0v-4m0 4l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* 2. Left vertical tools sidebar (Match icons in screenshot) */}
                <div className="w-[50px] bg-[#12161F] border-r border-[#090A0F] flex flex-col items-center py-3.5 space-y-3 shrink-0 select-none">
                    
                    {/* Layout Selector Grid popup */}
                    <div className="relative group">
                        <SidebarIcon name="layout" title="Bố cục màn hình (Grid Layout)" />
                        <div className="absolute left-full top-0 ml-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 grid grid-cols-2 gap-1.5 hidden group-hover:grid z-50">
                            <button onClick={() => { setGridCols(1); setGridRows(1); setMaximizedViewport(null); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded cursor-pointer">1x1</button>
                            <button onClick={() => { setGridCols(2); setGridRows(1); setMaximizedViewport(null); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded cursor-pointer">1x2</button>
                            <button onClick={() => { setGridCols(2); setGridRows(2); setMaximizedViewport(null); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded cursor-pointer">2x2</button>
                            <button onClick={() => { setGridCols(3); setGridRows(3); setMaximizedViewport(null); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded cursor-pointer">3x3</button>
                        </div>
                    </div>

                    {/* Series toggle button */}
                    <SidebarIcon 
                        name="series" 
                        active={showSeriesList} 
                        onClick={() => setShowSeriesList(!showSeriesList)} 
                        title="Ẩn/Hiện danh sách Series" 
                    />

                    <div className="w-[60%] h-px bg-slate-800 my-1"></div>

                    {/* standard tools */}
                    <SidebarIcon name="pan" active={activeTool === 'pan'} onClick={() => { setActiveTool('pan'); setMagnifierPos(null); }} title="Dịch chuyển ảnh (Pan)" />
                    <SidebarIcon name="zoom" active={activeTool === 'zoom'} onClick={() => { setActiveTool('zoom'); setMagnifierPos(null); }} title="Thu phóng ảnh (Zoom)" />
                    <SidebarIcon name="wl" active={activeTool === 'wl'} onClick={() => { setActiveTool('wl'); setMagnifierPos(null); }} title="Window Level (Cân bằng độ sáng/tương phản)" />
                    <SidebarIcon name="magnify" active={activeTool === 'magnify'} onClick={() => setActiveTool('magnify')} title="Kính lúp hội tụ (Magnifier Glass)" />
                    <SidebarIcon name="scroll" active={activeTool === 'scroll'} onClick={() => { setActiveTool('scroll'); setMagnifierPos(null); }} title="Cuộn lát cắt ảnh (Stack Scroll)" />
                    <SidebarIcon name="localizer" active={activeTool === 'localizer'} onClick={() => { setActiveTool('localizer'); setMagnifierPos(null); }} title="Đường định vị liên kết (Cross-Reference Lines)" />

                    <div className="w-[60%] h-px bg-slate-800 my-1"></div>

                    {/* measurement tools */}
                    <SidebarIcon name="ruler" active={activeTool === 'measure'} onClick={() => { setActiveTool('measure'); setMagnifierPos(null); }} title="Thước đo khoảng cách (Distance Line)" />
                    <SidebarIcon name="angle" active={activeTool === 'angle'} onClick={() => { setActiveTool('angle'); setMagnifierPos(null); }} title="Đo góc 3 điểm (Angle)" />
                    <SidebarIcon name="area" active={activeTool === 'area'} onClick={() => { setActiveTool('area'); setMagnifierPos(null); }} title="Đo diện tích vùng (Area ROI Rectangle)" />
                    <SidebarIcon name="text" active={activeTool === 'text'} onClick={() => { setActiveTool('text'); setMagnifierPos(null); }} title="Ghi chú chữ trên hình (Text Callout)" />
                    <SidebarIcon name="trash" onClick={() => clearAllMeasurements(activeViewport)} title="Xóa toàn bộ thước đo (Clear Measurements)" />

                    <div className="w-[60%] h-px bg-slate-800 my-1"></div>

                    {/* play/pause cine stack */}
                    <SidebarIcon 
                        name={cinePlaying ? 'pause' : 'play'} 
                        onClick={() => setCinePlaying(!cinePlaying)} 
                        title={cinePlaying ? 'Dừng Cine Stack' : 'Phát Cine Stack (Auto Scroll)'} 
                    />

                    {/* sync scrolling */}
                    <SidebarIcon 
                        name="sync" 
                        active={isSynchronized} 
                        onClick={() => setIsSynchronized(!isSynchronized)} 
                        title="Đồng bộ cuộn lát cắt liên kết" 
                    />
                </div>

                {/* 3. Series Sidebar: Next to toolbar (Collapsible, Match screenshot series view) */}
                {showSeriesList && (
                    <div className="w-[185px] bg-[#12161F] border-r border-[#090A0F] flex flex-col p-2 shrink-0 select-none overflow-y-auto z-20">
                        <div className="text-[10px] font-black tracking-wider text-slate-500 uppercase px-1 mb-2 font-mono">
                            Series ({seriesData.length})
                        </div>
                        <div className="space-y-2">
                            {seriesData.map((s) => {
                                // check if loaded in any viewport to show indicators
                                const isLoaded = viewports.some(vp => vp.seriesId === s.id);
                                const isActive = viewports[activeViewport].seriesId === s.id;
                                
                                return (
                                    <div 
                                        key={s.id}
                                        onClick={() => handleSelectSeries(s.id)}
                                        className={`group relative p-1.5 border-2 rounded-xl transition cursor-pointer flex flex-col bg-slate-900/50 ${
                                            isActive 
                                                ? 'border-orange-500 shadow-md shadow-orange-500/10' 
                                                : isLoaded 
                                                    ? 'border-slate-700 hover:border-slate-600'
                                                    : 'border-slate-900 hover:border-slate-800'
                                        }`}
                                    >
                                        {/* Frame / Slice Count Badge */}
                                        <div className="absolute top-2 left-2 px-1 bg-green-900/90 text-green-400 border border-green-700 rounded text-[9px] font-mono leading-none">
                                            {s.frameCount}
                                        </div>

                                        {/* Series Thumbnail Container */}
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-950/40 relative">
                                            <img 
                                                src={s.thumbnailUrl} 
                                                alt={s.name} 
                                                className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition duration-200" 
                                            />
                                        </div>

                                        {/* Title below */}
                                        <div className="mt-1 flex items-center justify-between text-[10px] leading-tight px-0.5">
                                            <span className="font-bold text-slate-300 font-mono truncate">{s.seriesDesc}</span>
                                            {isLoaded && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 4. Main Viewport Grid layout (Charcoal background, premium grid gap) */}
                <div 
                    className="flex-1 grid gap-1 p-1 bg-[#090A0F] select-none overflow-hidden relative"
                    style={{
                        gridTemplateColumns: maximizedViewport !== null ? '1fr' : `repeat(${gridCols}, minmax(0, 1fr))`,
                        gridTemplateRows: maximizedViewport !== null ? '1fr' : `repeat(${gridRows}, minmax(0, 1fr))`
                    }}
                >
                    {Array(totalViewports).fill(null).map((_, gridIdx) => {
                        const idx = maximizedViewport !== null ? maximizedViewport : gridIdx;
                        const vp = viewports[idx] || viewports[0];
                        const series = seriesData.find(s => s.id === vp.seriesId) || seriesData[0];
                        const isActive = idx === activeViewport;
                        const isAxial = series.seriesDesc.includes('tra') || series.seriesDesc.includes('Axial');

                        // Slice Scroll Shift simulation parameters to fake 3D depth shifting
                        const sliceShiftX = (vp.sliceIndex - (series.frameCount / 2)) * 1.6;
                        const sliceShiftY = (vp.sliceIndex - (series.frameCount / 2)) * 0.9;
                        
                        return (
                            <div 
                                key={idx}
                                ref={el => { containerRefs.current[idx] = el; }}
                                onMouseDown={(e) => handleMouseDown(e, idx)}
                                onMouseMove={(e) => handleMouseMove(e, idx)}
                                onMouseUp={(e) => handleMouseUp(e, idx)}
                                onMouseLeave={handleMouseLeave}
                                onWheel={(e) => handleWheel(e, idx)}
                                onDoubleClick={() => setMaximizedViewport(maximizedViewport === null ? idx : null)}
                                className={`relative bg-[#0E1118] border overflow-hidden flex flex-col justify-between cursor-crosshair transition-all duration-150 ${
                                    isActive 
                                        ? 'border-orange-500 ring-2 ring-orange-500/10 shadow-inner' 
                                        : 'border-[#1C2330]'
                                }`}
                            >
                                
                                {/* A. Viewport Header (Series Name, quick actions bar) */}
                                <div className="h-7 bg-[#141822]/80 border-b border-[#0B0D11] flex items-center justify-between px-3 select-none z-30 shrink-0 text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-200 font-mono tracking-wider">
                                            {series.name}
                                        </span>
                                    </div>

                                    {/* Quick toolbar shortcuts inside Viewport Header */}
                                    <div className="flex items-center gap-1">
                                        {/* Modality badge */}
                                        <span className="text-[8px] font-black px-1 py-0.5 rounded bg-slate-900 text-orange-400 border border-slate-800 font-mono flex items-center gap-0.5 select-none">
                                            2D <svg className="w-2 h-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                        
                                        {/* Quick rotate & flip buttons */}
                                        <button onClick={() => updateViewport(idx, { rotation: (vp.rotation + 90) % 360 })} className="p-0.5 hover:bg-slate-800 rounded transition cursor-pointer" title="Xoay ảnh 90°">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" /></svg>
                                        </button>
                                        <button onClick={() => updateViewport(idx, { flipH: !vp.flipH })} className="p-0.5 hover:bg-slate-800 rounded transition cursor-pointer" title="Lật ảnh nằm ngang">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        </button>
                                        <button onClick={() => updateViewport(idx, { showInfo: !vp.showInfo })} className="p-0.5 hover:bg-slate-800 rounded transition cursor-pointer" title="Ẩn/Hiện thông tin HUD">
                                            <span className="text-[10px] font-black font-mono">i</span>
                                        </button>

                                        {/* Window presets dropdown */}
                                        <div className="relative group/preset">
                                            <button className="px-1 py-0.5 rounded hover:bg-slate-800 text-[10px] font-black font-mono transition flex items-center gap-0.5 select-none cursor-pointer">
                                                {vp.windowPreset}...
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-1 space-y-0.5 hidden group-hover/preset:block z-50 w-24">
                                                <button onClick={() => applyPreset(idx, 'Nor')} className="w-full text-left px-2 py-1 hover:bg-slate-800 text-[9px] font-bold rounded">Normal</button>
                                                <button onClick={() => applyPreset(idx, 'Bone')} className="w-full text-left px-2 py-1 hover:bg-slate-800 text-[9px] font-bold rounded">Bone W/L</button>
                                                <button onClick={() => applyPreset(idx, 'Soft')} className="w-full text-left px-2 py-1 hover:bg-slate-800 text-[9px] font-bold rounded">Soft Tissue</button>
                                                <button onClick={() => applyPreset(idx, 'Lung')} className="w-full text-left px-2 py-1 hover:bg-slate-800 text-[9px] font-bold rounded">Lung W/L</button>
                                            </div>
                                        </div>

                                        <button onClick={() => resetView()} className="p-0.5 hover:bg-slate-800 rounded transition cursor-pointer" title="Đặt lại ảnh">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" /></svg>
                                        </button>
                                        <button onClick={() => setMaximizedViewport(maximizedViewport === null ? idx : null)} className="p-0.5 hover:bg-slate-800 rounded transition cursor-pointer">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* B. Main Interactive canvas canvas viewport simulator */}
                                <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-4 bg-[#090A0E]">
                                    
                                    {/* Info text overlays HUD (Green/Gray, monospace, top-left/right, bottom-left/right) */}
                                    {vp.showInfo && (
                                        <>
                                            {/* HUD Top Left */}
                                            <div className="absolute top-2 left-2 text-[10px] font-medium text-slate-400 font-mono pointer-events-none z-10 leading-tight space-y-0.5 select-none">
                                                <div className="text-white font-black tracking-wide uppercase">{patientName} | 1987</div>
                                                <div>F, 39Y, {patientId}</div>
                                                <div>12/06/2026</div>
                                                <div>10:17 - {modality}</div>
                                            </div>

                                            {/* HUD Top Right */}
                                            <div className="absolute top-2 right-12 text-[10px] font-medium text-slate-400 font-mono pointer-events-none z-10 leading-tight text-right space-y-0.5 select-none">
                                                <div className="text-slate-300">Ninh Binh-Thang Long Clinic</div>
                                                <div>Siemens Healthineers</div>
                                            </div>

                                            {/* HUD Middle Left */}
                                            <div className="absolute top-[45%] left-2 text-[10px] font-medium text-slate-400 font-mono pointer-events-none z-10 leading-tight space-y-0.5 select-none">
                                                <div>SL: 4.8</div>
                                                <div>{isAxial ? 'Ax: F22.7' : 'Sag: L10.4'}</div>
                                                <div>PP: HFS</div>
                                            </div>

                                            {/* HUD Bottom Left */}
                                            <div className="absolute bottom-2 left-2 text-[10px] font-medium text-slate-400 font-mono pointer-events-none z-10 leading-tight space-y-0.5 select-none">
                                                <div className="text-green-500 font-black">{series.seriesDesc} {vp.sliceIndex}/{series.frameCount}</div>
                                                <div>Coil: {series.coil}</div>
                                                <div>FA {series.fa} | AC 2</div>
                                                <div>TR {series.tr} | TE {series.te}</div>
                                            </div>

                                            {/* HUD Bottom Right */}
                                            <div className="absolute bottom-2 right-12 text-[10px] font-medium text-slate-400 font-mono pointer-events-none z-10 leading-tight text-right space-y-0.5 select-none">
                                                <div>Thickness: {series.sliceThickness}</div>
                                                <div>WL: {Math.round(vp.contrast * 3.45)} WW: {Math.round(vp.brightness * 7.56)}</div>
                                            </div>
                                        </>
                                    )}

                                    {/* Main DICOM Image renderer */}
                                    <div 
                                        className="w-full h-full flex items-center justify-center relative pointer-events-none"
                                        style={{
                                            transform: `translate(${vp.position.x + sliceShiftX}px, ${vp.position.y + sliceShiftY}px) scale(${vp.scale}) rotate(${vp.rotation}deg) scaleX(${vp.flipH ? -1 : 1})`,
                                            filter: `brightness(${vp.brightness}%) contrast(${vp.contrast}%) invert(${vp.isInvert ? 1 : 0})`,
                                        }}
                                    >
                                        <img 
                                            src={series.imageUrl} 
                                            alt="DICOM Slice" 
                                            className="max-w-[95%] max-h-[95%] object-contain select-none pointer-events-none shadow-2xl rounded"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                    </div>

                                    {/* Magnifier glass circle overlay (HTML magnifier) */}
                                    {activeTool === 'magnify' && isActive && magnifierPos && (
                                        <div 
                                            className="absolute border-2 border-slate-500 rounded-full overflow-hidden shadow-2xl pointer-events-none z-30 bg-[#090A0E]"
                                            style={{
                                                left: `${magnifierPos.x - 70}px`,
                                                top: `${magnifierPos.y - 70}px`,
                                                width: '140px',
                                                height: '140px',
                                                boxShadow: '0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            <div 
                                                className="w-[450px] h-[450px] flex items-center justify-center relative absolute"
                                                style={{
                                                    // Zoom offset formulas centered around cursor
                                                    transform: `translate(${-magnifierPos.x * 2.5 + 70}px, ${-magnifierPos.y * 2.5 + 70}px) scale(${vp.scale * 2.5}) rotate(${vp.rotation}deg) scaleX(${vp.flipH ? -1 : 1})`,
                                                    filter: `brightness(${vp.brightness}%) contrast(${vp.contrast}%) invert(${vp.isInvert ? 1 : 0})`,
                                                    transformOrigin: 'top left'
                                                }}
                                            >
                                                <img 
                                                    src={series.imageUrl} 
                                                    alt="Zoomed" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Render Cross-Reference lines (PMR reference localizers) */}
                                    {renderCrossReferenceLines(idx, isAxial, containerRefs.current[idx]?.clientWidth || 400, containerRefs.current[idx]?.clientHeight || 300)}

                                    {/* Calibration scale ruler overlay (10cm right side ruler) */}
                                    {vp.showInfo && (
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none select-none">
                                            {/* Rulers scale marks */}
                                            <div className="flex flex-col items-end gap-1.5 h-36 border-r-2 border-slate-500/40 pr-1 text-[9px] font-mono text-slate-500">
                                                <div className="h-px w-2 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-2 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-1 bg-slate-500/40"></div>
                                                <div className="h-px w-2 bg-slate-500/40 flex items-center mr-1">10cm</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SVG measurement overlays */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                        {tempPoints.length > 0 && activeViewport === idx && activeTool === 'measure' && (
                                            <g>
                                                <line x1={tempPoints[0].x} y1={tempPoints[0].y} x2={tempPoints[1].x} y2={tempPoints[1].y} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3"/>
                                                <circle cx={tempPoints[0].x} cy={tempPoints[0].y} r="3" fill="#38bdf8" />
                                                <circle cx={tempPoints[1].x} cy={tempPoints[1].y} r="3" fill="#38bdf8" />
                                            </g>
                                        )}
                                        {tempPoints.length > 0 && activeViewport === idx && activeTool === 'area' && (
                                            <g>
                                                <rect 
                                                    x={Math.min(tempPoints[0].x, tempPoints[1].x)} 
                                                    y={Math.min(tempPoints[0].y, tempPoints[1].y)} 
                                                    width={Math.abs(tempPoints[1].x - tempPoints[0].x)}
                                                    height={Math.abs(tempPoints[1].y - tempPoints[0].y)}
                                                    stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" fill="rgba(56, 189, 248, 0.08)"
                                                />
                                            </g>
                                        )}
                                        {tempPoints.length > 0 && activeViewport === idx && activeTool === 'angle' && (
                                            <g>
                                                {tempPoints.map((pt, i) => (
                                                    <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#38bdf8" />
                                                ))}
                                                {tempPoints.length >= 2 && (
                                                    <line x1={tempPoints[0].x} y1={tempPoints[0].y} x2={tempPoints[1].x} y2={tempPoints[1].y} stroke="#38bdf8" strokeWidth="1.5" />
                                                )}
                                                {tempPoints.length === 3 && (
                                                    <line x1={tempPoints[1].x} y1={tempPoints[1].y} x2={tempPoints[2].x} y2={tempPoints[2].y} stroke="#38bdf8" strokeWidth="1.5" />
                                                )}
                                            </g>
                                        )}

                                        {vp.measurements.map(m => {
                                            if (m.type === 'distance') {
                                                const [p1, p2] = m.points;
                                                return (
                                                    <g key={m.id}>
                                                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#eab308" strokeWidth="1.5"/>
                                                        <circle cx={p1.x} cy={p1.y} r="2.5" fill="#eab308" />
                                                        <circle cx={p2.x} cy={p2.y} r="2.5" fill="#eab308" />
                                                        <text x={(p1.x + p2.x)/2} y={(p1.y + p2.y)/2 - 6} fill="#eab308" fontSize="10" className="font-mono font-bold" textAnchor="middle" style={{ textShadow: '1px 1px 2px black' }}>
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
                                                        <rect x={x} y={y} width={w} height={h} stroke="#eab308" strokeWidth="1.5" fill="none"/>
                                                        <text x={x + w/2} y={y + h/2} fill="#eab308" fontSize="10" className="font-mono font-bold" textAnchor="middle" style={{ textShadow: '1px 1px 2px black' }}>
                                                            {m.value}
                                                        </text>
                                                    </g>
                                                );
                                            }
                                            if (m.type === 'angle') {
                                                const [p1, p2, p3] = m.points;
                                                return (
                                                    <g key={m.id}>
                                                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#eab308" strokeWidth="1.5"/>
                                                        <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="#eab308" strokeWidth="1.5"/>
                                                        <circle cx={p2.x} cy={p2.y} r="3" fill="#eab308" />
                                                        <text x={p2.x} y={p2.y - 10} fill="#eab308" fontSize="10" className="font-mono font-bold" textAnchor="middle" style={{ textShadow: '1px 1px 2px black' }}>
                                                            {m.value}
                                                        </text>
                                                    </g>
                                                );
                                            }
                                            if (m.type === 'text') {
                                                const [p1] = m.points;
                                                return (
                                                    <g key={m.id}>
                                                        <circle cx={p1.x} cy={p1.y} r="3" fill="#eab308" />
                                                        <text x={p1.x + 6} y={p1.y + 3} fill="#eab308" fontSize="10" className="font-mono font-bold" style={{ textShadow: '1px 1px 2px black' }}>
                                                            {m.value}
                                                        </text>
                                                    </g>
                                                );
                                            }
                                            return null;
                                        })}
                                    </svg>

                                    {/* Slice Scroll Progress track scrollbar overlay (Right side, blue indicator like PMR) */}
                                    {series.frameCount > 1 && (
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-30 bg-slate-950/60 py-2.5 px-1 rounded-full border border-slate-800 pointer-events-auto shadow-xl">
                                            <span className="text-[8px] font-mono text-slate-400 font-bold select-none leading-none mb-1">{vp.sliceIndex}</span>
                                            
                                            {/* Stack Indicator track bar */}
                                            <div className="relative w-1.5 h-24 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center">
                                                {/* Blue active bar position indicator */}
                                                <div 
                                                    className="absolute w-full bg-blue-500 rounded-full transition-all duration-75"
                                                    style={{ 
                                                        height: '8px', 
                                                        top: `${((vp.sliceIndex - 1) / (series.frameCount - 1)) * 92}%` 
                                                    }}
                                                />
                                                <input 
                                                    type="range"
                                                    min="1"
                                                    max={series.frameCount}
                                                    value={vp.sliceIndex}
                                                    onChange={(e) => {
                                                        const targetViewports = isSynchronized ? Array.from({ length: totalViewports }, (_, i) => i) : [idx];
                                                        targetViewports.forEach(vpIdx => {
                                                            const targetSeries = seriesData.find(s => s.id === viewports[vpIdx].seriesId) || seriesData[0];
                                                            const newIdx = Math.min(parseInt(e.target.value), targetSeries.frameCount);
                                                            updateViewport(vpIdx, { sliceIndex: newIdx });
                                                        });
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                                    style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' } as any}
                                                />
                                            </div>
                                            <span className="text-[8px] font-mono text-slate-500 font-bold select-none leading-none mt-1">{series.frameCount}</span>
                                        </div>
                                    )}

                                    {/* Key Image Bookmark badge */}
                                    {vp.keySlices.includes(vp.sliceIndex) && (
                                        <div className="absolute top-2 left-[50%] -translate-x-1/2 bg-red-600 border border-red-500 text-[8px] font-black uppercase px-2 py-0.5 rounded shadow z-40 flex items-center gap-1 select-none animate-pulse">
                                            ★ KEY IMAGE
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CornerstoneViewer;

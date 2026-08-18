import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ActiveTool, Measurement, RealInstance, ReportData, FindingPreset } from '../types';
import { ViewerToolbar } from './ViewerToolbar';
import { ViewerCanvas } from './ViewerCanvas';
import { SliceThumbnailList } from './SliceThumbnailList';
import { ReportFindingsPanel } from './ReportFindingsPanel';
import { HotkeysModal } from './HotkeysModal';
import { UltrasoundReportModal } from './UltrasoundReportModal';
import { PatientQrModal } from './PatientQrModal';
import { MediaCaptureModal } from '../../reports/components/MediaCaptureModal';

export interface QuickViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studyId?: string;
  patientName?: string;
  patientId?: string;
  modality?: string;
  accessionNumber?: string;
  studyDate?: string;
}

export const QuickViewerDialog: React.FC<QuickViewerDialogProps> = ({
  isOpen,
  onClose,
  studyId = '1.3.6.1.4.1.5962.1.2.1.20040119072730.12322',
  patientName = 'NGUYỄN VĂN AN',
  patientId = 'BN_TEST_001',
  modality = 'CT',
  accessionNumber = 'ACC-99201',
  studyDate = new Date().toLocaleDateString('vi-VN'),
}) => {
  // State công cụ & thao tác ảnh
  const [activeTool, setActiveTool] = useState<ActiveTool>('wl');
  const [showReportPanel, setShowReportPanel] = useState<boolean>(true);
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);
  const [showUltrasoundModal, setShowUltrasoundModal] = useState<boolean>(false);
  const [isMediaCaptureOpen, setIsMediaCaptureOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Danh sách ảnh DICOM thực từ Orthanc PACS
  const [instances, setInstances] = useState<RealInstance[]>([]);
  const [currentSliceIndex, setCurrentSliceIndex] = useState<number>(0);
  const [secondSliceIndex, setSecondSliceIndex] = useState<number>(0);

  // Cine Loop Player
  const [isCinePlaying, setIsCinePlaying] = useState<boolean>(false);
  const [cineFps, setCineFps] = useState<number>(10);

  // Biến đổi hình ảnh
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // 🌟 Quản lý Thước Đo & Vùng ROI Phân Lập Theo Từng Lát Cắt
  const [measurementsBySlice, setMeasurementsBySlice] = useState<Record<string, Measurement[]>>({});
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);

  // Dữ liệu Báo cáo chẩn đoán
  const [reportData, setReportData] = useState<ReportData>({
    findings: 'Hình ảnh các phế trường thông thoáng tốt, không thấy tổn thương đông đặc hay nốt mờ bất thường. Bóng tim kích thước trong giới hạn sinh lý bình thường.',
    impression: 'Chưa phát hiện tổn thương bệnh lý cấp tính trên hình ảnh chụp CĐHA.',
    recommendation: 'Tiếp tục theo dõi lâm sàng và điều trị theo phác đồ nội trú/ngoại trú.',
    readingDoctor: 'BS. CKII Nguyễn Văn An',
    status: 'T',
    signedAt: studyDate || new Date().toLocaleDateString('vi-VN'),
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Key định danh lát cắt hiện tại (dùng SOPInstanceUID hoặc index)
  const currentInstance = instances[currentSliceIndex];
  const currentSliceKey = currentInstance?.sopInstanceUid || `slice_${currentSliceIndex}`;
  const currentSliceMeasurements = measurementsBySlice[currentSliceKey] || [];

  // Key định danh lát cắt thứ 2 trong chế độ Split
  const secondInstance = instances[secondSliceIndex];
  const secondSliceKey = secondInstance?.sopInstanceUid || `slice_${secondSliceIndex}`;
  const secondSliceMeasurements = measurementsBySlice[secondSliceKey] || [];

  // Danh sách ảnh chụp / Media từ Card Capture
  const [studyMedia, setStudyMedia] = useState<any[]>([]);

  const loadStudyInstances = useCallback(async () => {
    if (!studyId) return;
    try {
      const res = await axios.get(`/api/studies/${encodeURIComponent(studyId)}/instances`);
      if (res.data?.success && Array.isArray(res.data.instances) && res.data.instances.length > 0) {
        setInstances(res.data.instances);
        if (res.data.instances.length > 1) {
          setSecondSliceIndex(Math.min(1, res.data.instances.length - 1));
        }
      }
    } catch (err) {}
  }, [studyId]);

  const loadStudyMedia = useCallback(async () => {
    if (!studyId) return;
    try {
      const res = await axios.get(`/api/studies/${encodeURIComponent(studyId)}/media`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setStudyMedia(res.data.data);
      }
    } catch (err) {}
  }, [studyId]);

  // 1. Tải danh sách ảnh DICOM thực & Báo cáo CĐHA
  useEffect(() => {
    if (!isOpen || !studyId) return;

    resetView();
    setMeasurementsBySlice({});
    setSelectedMeasurementId(null);
    setIsCinePlaying(false);

    loadStudyInstances();
    loadStudyMedia();

    const fetchDicomData = async () => {
      try {
        const repRes = await axios.get(`/api/his/reports?studyInstanceUid=${encodeURIComponent(studyId)}`);
        if (repRes.data?.success && repRes.data.data) {
          setReportData({
            findings: repRes.data.data.findings || 'Chưa có mô tả chi tiết.',
            impression: repRes.data.data.impression || 'Theo dõi lâm sàng.',
            recommendation: repRes.data.data.recommendation || 'Không.',
            readingDoctor: repRes.data.data.readingDoctor || 'BS. Chẩn Đoán Hình Ảnh',
            status: repRes.data.data.status || 'T',
            signedAt: repRes.data.data.signedAt || studyDate || new Date().toLocaleDateString('vi-VN'),
          });
        }
      } catch (err) {}
    };

    fetchDicomData();
  }, [isOpen, studyId, loadStudyInstances, loadStudyMedia, studyDate]);

  // 2. Cine Loop Animation Player
  useEffect(() => {
    if (!isCinePlaying || instances.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSliceIndex((prev) => (prev + 1) % instances.length);
    }, 1000 / cineFps);

    return () => clearInterval(interval);
  }, [isCinePlaying, cineFps, instances.length]);

  // 3. Vẽ hình ảnh DICOM thực tế lên Canvas chính (Left Viewport)
  const drawRealImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentInst = instances[currentSliceIndex];
    if (!currentInst) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentInst.imageUrl;

    img.onload = () => {
      const W = img.naturalWidth || 512;
      const H = img.naturalHeight || 512;
      canvas.width = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? 'invert(100%)' : ''}`;
      ctx.drawImage(img, 0, 0, W, H);
      ctx.filter = 'none';
    };

    img.onerror = () => {
      const W = 512, H = 512;
      canvas.width = W;
      canvas.height = H;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`DICOM Image: ${modality} - ${patientName}`, W / 2, H / 2 - 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`Slice #${currentSliceIndex + 1}/${instances.length || 1}`, W / 2, H / 2 + 15);
    };
  }, [instances, currentSliceIndex, brightness, contrast, isInverted, modality, patientName]);

  // 3b. Vẽ hình ảnh DICOM lên Canvas phụ (Right Viewport - Split Mode)
  const drawSecondRealImage = useCallback(() => {
    const canvas = secondCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const inst = instances[secondSliceIndex] || instances[0];
    if (!inst) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = inst.imageUrl;

    img.onload = () => {
      const W = img.naturalWidth || 512;
      const H = img.naturalHeight || 512;
      canvas.width = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) ${isInverted ? 'invert(100%)' : ''}`;
      ctx.drawImage(img, 0, 0, W, H);
      ctx.filter = 'none';
    };
  }, [instances, secondSliceIndex, brightness, contrast, isInverted]);

  useEffect(() => {
    if (isOpen && instances.length > 0) {
      drawRealImage();
      if (isSplitView) {
        drawSecondRealImage();
      }
    }
  }, [isOpen, instances, currentSliceIndex, secondSliceIndex, brightness, contrast, isInverted, isSplitView, drawRealImage, drawSecondRealImage]);

  // 4. Phím tắt bàn phím
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (instances.length > 1) setIsCinePlaying((v) => !v);
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(3.5, z + 0.15));
          break;
        case '-':
        case '_':
          setZoom((z) => Math.max(0.3, z - 0.15));
          break;
        case 'r':
          resetView();
          break;
        case 'i':
          setIsInverted((v) => !v);
          break;
        case 'w':
          setActiveTool('wl');
          break;
        case 'z':
          setActiveTool('zoom');
          break;
        case 'p':
          setActiveTool('pan');
          break;
        case 'm':
          setActiveTool('ruler');
          break;
        case 'o':
          setActiveTool('roi');
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowup':
        case 'arrowleft':
          e.preventDefault();
          if (instances.length > 0) {
            setCurrentSliceIndex((prev) => (prev - 1 + instances.length) % instances.length);
          }
          break;
        case 'arrowdown':
        case 'arrowright':
          e.preventDefault();
          if (instances.length > 0) {
            setCurrentSliceIndex((prev) => (prev + 1) % instances.length);
          }
          break;
        case 'escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case '?':
          setShowHotkeysModal((v) => !v);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, instances.length, isFullscreen, onClose]);

  // Quản lý đo đạc theo từng lát cắt
  const handleAddMeasurement = (newMeas: Measurement) => {
    setMeasurementsBySlice((prev) => {
      const sliceKey = currentSliceKey;
      const currentList = prev[sliceKey] || [];
      return {
        ...prev,
        [sliceKey]: [...currentList, newMeas],
      };
    });
    setSelectedMeasurementId(newMeas.id);
  };

  const handleDeleteSelectedMeasurement = (idToDelete?: string) => {
    const targetId = idToDelete || selectedMeasurementId;
    if (!targetId) return;

    setMeasurementsBySlice((prev) => {
      const sliceKey = currentSliceKey;
      const currentList = prev[sliceKey] || [];
      return {
        ...prev,
        [sliceKey]: currentList.filter((m) => m.id !== targetId),
      };
    });
    if (selectedMeasurementId === targetId) {
      setSelectedMeasurementId(null);
    }
  };

  const handleClearAllMeasurements = () => {
    setMeasurementsBySlice((prev) => ({
      ...prev,
      [currentSliceKey]: [],
    }));
    setSelectedMeasurementId(null);
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setIsInverted(false);
    setFlipH(false);
    setFlipV(false);
  };

  const handleFitScreen = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${patientId}_${modality}_slice${currentSliceIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-hidden font-sans select-none"
      >
        {/* Top Control Bar */}
        <ViewerToolbar
          patientName={patientName}
          patientId={patientId}
          modality={modality}
          studyId={studyId}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onZoomIn={() => setZoom((z) => Math.min(3.8, +(z + 0.15).toFixed(2)))}
          onZoomOut={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))}
          onFitScreen={handleFitScreen}
          onZoom100={() => setZoom(1)}
          onRotate={() => setRotation((r) => (r + 90) % 360)}
          isInverted={isInverted}
          onToggleInvert={() => setIsInverted((v) => !v)}
          onReset={resetView}
          onDeleteSelectedMeasurement={() => handleDeleteSelectedMeasurement()}
          onClearAllMeasurements={handleClearAllMeasurements}
          hasSelectedMeasurement={!!selectedMeasurementId}
          totalMeasurementsOnSlice={currentSliceMeasurements.length}
          onDownload={downloadImage}
          onPrint={() => setShowUltrasoundModal(true)}
          onOpenCapture={() => setIsMediaCaptureOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          isSplitView={isSplitView}
          onToggleSplitView={() => setIsSplitView((v) => !v)}
          showReportPanel={showReportPanel}
          onToggleReportPanel={() => setShowReportPanel((v) => !v)}
          onOpenHotkeys={() => setShowHotkeysModal(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onClose={onClose}
          isPopup={true}
        />

        {/* Main Workspace Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Slice Thumbnails & Cine Player */}
          <SliceThumbnailList
            instances={instances}
            currentSliceIndex={currentSliceIndex}
            onSelectSlice={(idx) => {
              setCurrentSliceIndex(idx);
              setSelectedMeasurementId(null);
            }}
            isCinePlaying={isCinePlaying}
            onToggleCine={() => setIsCinePlaying((v) => !v)}
            cineFps={cineFps}
            onChangeCineFps={setCineFps}
          />

          {/* Center: Interactive DICOM Viewport(s) */}
          <div className={`flex-1 flex ${isSplitView ? 'flex-row divide-x divide-slate-800' : ''} overflow-hidden`}>
            {/* Viewport 1 (Primary) */}
            <ViewerCanvas
              canvasRef={canvasRef}
              patientName={patientName}
              patientId={patientId}
              modality={modality}
              accessionNumber={accessionNumber}
              studyDate={studyDate}
              currentSliceIndex={currentSliceIndex}
              totalSlices={instances.length}
              zoom={zoom}
              rotation={rotation}
              panOffset={panOffset}
              brightness={brightness}
              contrast={contrast}
              flipH={flipH}
              flipV={flipV}
              activeTool={activeTool}
              pixelSpacing={currentInstance?.pixelSpacing}
              measurements={currentSliceMeasurements}
              selectedMeasurementId={selectedMeasurementId}
              onSelectMeasurement={setSelectedMeasurementId}
              onDeleteMeasurement={handleDeleteSelectedMeasurement}
              onAddMeasurement={handleAddMeasurement}
              onUpdateBrightnessContrast={(b, c) => {
                setBrightness(b);
                setContrast(c);
              }}
              onUpdatePan={(dx, dy) => {
                setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
              }}
              onUpdateZoom={(delta) => {
                setZoom((z) => Math.max(0.3, Math.min(3.8, +(z + delta).toFixed(2))));
              }}
              onSliceChange={(nextIdx) => {
                setCurrentSliceIndex(nextIdx);
                setSelectedMeasurementId(null);
              }}
              onFitScreen={handleFitScreen}
              onApplyPreset={(b, c) => {
                setBrightness(b);
                setContrast(c);
              }}
            />

            {/* Viewport 2 (Split Mode Comparison) */}
            {isSplitView && (
              <ViewerCanvas
                canvasRef={secondCanvasRef}
                patientName={`${patientName} (Đối Chiếu)`}
                patientId={patientId}
                modality={modality}
                accessionNumber={accessionNumber}
                studyDate={studyDate}
                currentSliceIndex={secondSliceIndex}
                totalSlices={instances.length}
                zoom={zoom}
                rotation={rotation}
                panOffset={panOffset}
                brightness={brightness}
                contrast={contrast}
                flipH={flipH}
                flipV={flipV}
                activeTool={activeTool}
                pixelSpacing={secondInstance?.pixelSpacing}
                measurements={secondSliceMeasurements}
                selectedMeasurementId={selectedMeasurementId}
                onSelectMeasurement={setSelectedMeasurementId}
                onDeleteMeasurement={handleDeleteSelectedMeasurement}
                onAddMeasurement={handleAddMeasurement}
                onUpdateBrightnessContrast={(b, c) => {
                  setBrightness(b);
                  setContrast(c);
                }}
                onUpdatePan={(dx, dy) => {
                  setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                }}
                onUpdateZoom={(delta) => {
                  setZoom((z) => Math.max(0.3, Math.min(3.8, +(z + delta).toFixed(2))));
                }}
                onSliceChange={(nextIdx) => {
                  setSecondSliceIndex(nextIdx);
                }}
                onFitScreen={handleFitScreen}
                onApplyPreset={(b, c) => {
                  setBrightness(b);
                  setContrast(c);
                }}
              />
            )}
          </div>

          {/* Right: Diagnostic Findings Panel with 1-Click Fast Templates */}
          <ReportFindingsPanel
            show={showReportPanel}
            onClose={() => setShowReportPanel(false)}
            reportData={reportData}
            modality={modality}
            onOpenUltrasoundPrint={() => setShowUltrasoundModal(true)}
            onApplyPreset={(preset: FindingPreset) => {
              setReportData((prev) => ({
                ...prev,
                findings: preset.findings,
                impression: preset.impression,
                recommendation: preset.recommendation,
              }));
            }}
          />
        </div>

        {/* Hotkeys Modal */}
        <HotkeysModal
          isOpen={showHotkeysModal}
          onClose={() => setShowHotkeysModal(false)}
        />

        {/* Ultrasound 4-Image Print Preview Modal (A4 Standard) */}
        <UltrasoundReportModal
          isOpen={showUltrasoundModal}
          onClose={() => setShowUltrasoundModal(false)}
          patientName={patientName}
          patientId={patientId}
          modality={modality}
          accessionNumber={accessionNumber}
          studyDate={studyDate}
          reportData={reportData}
          instances={instances}
          studyId={studyId}
        />

        {/* Patient QR Code Online Viewer Modal */}
        <PatientQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          studyId={studyId}
          patientName={patientName}
          patientId={patientId}
          modality={modality}
          studyDate={studyDate}
        />

        {/* Live Video Capture Card & Foot Pedal Modal */}
        <MediaCaptureModal
          isOpen={isMediaCaptureOpen}
          onClose={() => {
            setIsMediaCaptureOpen(false);
            loadStudyInstances();
            loadStudyMedia();
          }}
          studyInstanceUid={studyId}
          patientName={patientName}
          modality={modality}
          studyMedia={studyMedia}
          onMediaUpdated={() => {
            loadStudyInstances();
            loadStudyMedia();
          }}
        />
      </div>
    </div>
  );
};

export default QuickViewerDialog;

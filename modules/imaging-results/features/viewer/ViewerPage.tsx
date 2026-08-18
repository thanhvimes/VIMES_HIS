import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ActiveTool, Measurement, RealInstance, ReportData } from './types';
import { ViewerToolbar } from './components/ViewerToolbar';
import { ViewerCanvas } from './components/ViewerCanvas';
import { SliceThumbnailList } from './components/SliceThumbnailList';
import { ReportFindingsPanel } from './components/ReportFindingsPanel';
import { HotkeysModal } from './components/HotkeysModal';

export const ViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const studyUID = searchParams.get('studyId') || searchParams.get('studyUID') || '1.3.6.1.4.1.5962.1.2.1.20040119072730.12322';
  const paramPatientName = searchParams.get('patientName') || 'NGUYỄN VĂN AN';
  const paramPatientId = searchParams.get('patientId') || 'BN_TEST_001';
  const paramModality = searchParams.get('modality') || 'CT';
  const paramAccession = searchParams.get('accessionNumber') || 'ACC-99201';
  const isPopup = searchParams.get('popup') === 'true' || searchParams.get('embed') === 'true' || (typeof window !== 'undefined' && window.opener !== null);

  // State công cụ & thao tác ảnh
  const [activeTool, setActiveTool] = useState<ActiveTool>('wl');
  const [showReportPanel, setShowReportPanel] = useState<boolean>(true);
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Danh sách ảnh DICOM thực từ Orthanc PACS
  const [instances, setInstances] = useState<RealInstance[]>([]);
  const [currentSliceIndex, setCurrentSliceIndex] = useState<number>(0);

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

  // 🌟 Quản lý Thước Đo Phân Lập Theo Từng Lát Cắt (Per-slice Measurement Storage)
  const [measurementsBySlice, setMeasurementsBySlice] = useState<Record<string, Measurement[]>>({});
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);

  // Dữ liệu Báo cáo chẩn đoán
  const [reportData, setReportData] = useState<ReportData>({
    findings: 'Hình ảnh các phế trường thông thoáng tốt, không thấy tổn thương đông đặc hay nốt mờ bất thường. Bóng tim kích thước trong giới hạn sinh lý bình thường.',
    impression: 'Chưa phát hiện tổn thương bệnh lý cấp tính trên hình ảnh chụp CĐHA.',
    recommendation: 'Tiếp tục theo dõi lâm sàng và điều trị theo phác đồ nội trú/ngoại trú.',
    readingDoctor: 'BS. CKII Nguyễn Văn An',
    status: 'T',
    signedAt: new Date().toLocaleDateString('vi-VN'),
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentInstance = instances[currentSliceIndex];
  const currentSliceKey = currentInstance?.sopInstanceUid || `slice_${currentSliceIndex}`;
  const currentSliceMeasurements = measurementsBySlice[currentSliceKey] || [];

  // 1. Tải danh sách ảnh DICOM thực từ PACS
  useEffect(() => {
    if (!studyUID) return;

    resetView();
    setMeasurementsBySlice({});
    setSelectedMeasurementId(null);
    setIsCinePlaying(false);

    const fetchDicomData = async () => {
      try {
        const res = await axios.get(`/api/studies/${encodeURIComponent(studyUID)}/instances`);
        if (res.data?.success && Array.isArray(res.data.instances) && res.data.instances.length > 0) {
          setInstances(res.data.instances);
          setCurrentSliceIndex(0);
        } else {
          setInstances([
            {
              instanceId: 'default-inst-1',
              sopInstanceUid: studyUID,
              instanceNumber: 1,
              imageUrl: `/api/pacs/instances/${encodeURIComponent(studyUID)}/preview`,
            }
          ]);
        }
      } catch (err) {
        setInstances([
          {
            instanceId: 'default-inst-1',
            sopInstanceUid: studyUID,
            instanceNumber: 1,
            imageUrl: `/api/pacs/instances/${encodeURIComponent(studyUID)}/preview`,
          }
        ]);
      }

      try {
        const repRes = await axios.get(`/api/his/reports?studyInstanceUid=${encodeURIComponent(studyUID)}`);
        if (repRes.data?.success && repRes.data.data) {
          setReportData({
            findings: repRes.data.data.findings || 'Chưa có mô tả chi tiết.',
            impression: repRes.data.data.impression || 'Theo dõi lâm sàng.',
            recommendation: repRes.data.data.recommendation || 'Không.',
            readingDoctor: repRes.data.data.readingDoctor || 'BS. Chẩn Đoán Hình Ảnh',
            status: repRes.data.data.status || 'T',
            signedAt: repRes.data.data.signedAt || new Date().toLocaleDateString('vi-VN'),
          });
        }
      } catch (e) {}
    };

    fetchDicomData();
  }, [studyUID]);

  // 2. Cine Loop Animation Timer
  useEffect(() => {
    if (!isCinePlaying || instances.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSliceIndex((prev) => (prev + 1) % instances.length);
    }, 1000 / cineFps);

    return () => clearInterval(interval);
  }, [isCinePlaying, cineFps, instances.length]);

  // 3. Vẽ hình ảnh DICOM thực tế lên Canvas
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
      ctx.fillText(`DICOM Image: ${paramModality} - ${paramPatientName}`, W / 2, H / 2 - 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`Slice #${currentSliceIndex + 1}/${instances.length || 1}`, W / 2, H / 2 + 15);
    };
  }, [instances, currentSliceIndex, brightness, contrast, isInverted, paramModality, paramPatientName]);

  useEffect(() => {
    if (instances.length > 0) {
      drawRealImage();
    }
  }, [instances, currentSliceIndex, brightness, contrast, isInverted, drawRealImage]);

  // 4. Phím tắt bàn phím
  useEffect(() => {
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
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowup':
        case 'pageup':
          setCurrentSliceIndex((idx) => Math.max(0, idx - 1));
          break;
        case 'arrowdown':
        case 'pagedown':
          setCurrentSliceIndex((idx) => Math.min(instances.length - 1, idx + 1));
          break;
        case '?':
          setShowHotkeysModal((v) => !v);
          break;
        case 'escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
            setIsFullscreen(false);
          } else if (showHotkeysModal) {
            setShowHotkeysModal(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showHotkeysModal, instances.length]);

  // 5. Thao tác Thước Đo theo lát cắt
  const handleAddMeasurement = (newMeas: Measurement) => {
    setMeasurementsBySlice((prev) => ({
      ...prev,
      [currentSliceKey]: [...(prev[currentSliceKey] || []), newMeas],
    }));
  };

  const handleDeleteSelectedMeasurement = (idToDelete?: string) => {
    const targetId = idToDelete || selectedMeasurementId;
    if (!targetId) return;

    setMeasurementsBySlice((prev) => ({
      ...prev,
      [currentSliceKey]: (prev[currentSliceKey] || []).filter((m) => m.id !== targetId),
    }));
    setSelectedMeasurementId(null);
  };

  const handleClearAllMeasurements = () => {
    setMeasurementsBySlice((prev) => ({
      ...prev,
      [currentSliceKey]: [],
    }));
    setSelectedMeasurementId(null);
  };

  // 6. Reset & Viewport controls
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

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `DICOM_${paramPatientId}_${paramModality}_Slice${currentSliceIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleClose = () => {
    if (isPopup) {
      window.close();
    } else {
      navigate('/studies');
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex flex-col bg-[#070a10] text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* Toolbar Header */}
      <ViewerToolbar
        patientName={paramPatientName}
        patientId={paramPatientId}
        modality={paramModality}
        studyId={studyUID}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onZoomIn={() => setZoom((z) => Math.min(3.5, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.15))}
        onFitScreen={handleFitScreen}
        onZoom100={() => setZoom(1.0)}
        onRotate={() => setRotation((r) => (r + 90) % 360)}
        isInverted={isInverted}
        onToggleInvert={() => setIsInverted((v) => !v)}
        onReset={resetView}
        onDeleteSelectedMeasurement={() => handleDeleteSelectedMeasurement()}
        onClearAllMeasurements={handleClearAllMeasurements}
        hasSelectedMeasurement={!!selectedMeasurementId}
        totalMeasurementsOnSlice={currentSliceMeasurements.length}
        onDownload={downloadImage}
        onPrint={() => window.print()}
        showReportPanel={showReportPanel}
        onToggleReportPanel={() => setShowReportPanel((v) => !v)}
        onOpenHotkeys={() => setShowHotkeysModal(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onClose={handleClose}
        isPopup={isPopup}
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

        {/* Center: Interactive DICOM Viewport Pro */}
        <ViewerCanvas
          canvasRef={canvasRef}
          patientName={paramPatientName}
          patientId={paramPatientId}
          modality={paramModality}
          accessionNumber={paramAccession}
          studyDate={reportData.signedAt || new Date().toLocaleDateString('vi-VN')}
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

        {/* Right: Diagnostic Findings Panel */}
        <ReportFindingsPanel
          show={showReportPanel}
          onClose={() => setShowReportPanel(false)}
          reportData={reportData}
        />
      </div>

      {/* Hotkeys Modal */}
      <HotkeysModal
        isOpen={showHotkeysModal}
        onClose={() => setShowHotkeysModal(false)}
      />
    </div>
  );
};

export default ViewerPage;

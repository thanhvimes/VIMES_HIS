import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  CheckCircle,
  Trash2,
  Video,
  VideoOff,
  Image as ImageIcon,
  Check,
  RefreshCw,
  FolderOpen,
  Eye,
  Maximize2,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  CloudUpload,
  Database
} from 'lucide-react';
import api, { getMediaUrl } from '../../../services/api';

export interface StudyMediaItem {
  id: string;
  study_instance_uid: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size_bytes: number;
  url: string;
  is_key_image: boolean;
  order_index: number;
  created_at: string;
}

interface MediaCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyInstanceUid: string;
  patientName: string;
  modality: string;
  studyMedia: StudyMediaItem[];
  onMediaUpdated: () => void;
}

export const MediaCaptureModal: React.FC<MediaCaptureModalProps> = ({
  isOpen,
  onClose,
  studyInstanceUid,
  patientName,
  modality,
  studyMedia,
  onMediaUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'capture' | 'upload' | 'gallery'>('capture');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [previewImage, setPreviewImage] = useState<StudyMediaItem | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play synthetic camera shutter sound
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  };

  // Enumerate video devices (Capture card / USB camera)
  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Error listing devices:', err);
      }
    };

    getDevices();
  }, [isOpen]);

  // Start / Stop Video Stream
  useEffect(() => {
    if (!isOpen || activeTab !== 'capture') {
      stopStream();
      return;
    }

    startStream();

    return () => {
      stopStream();
    };
  }, [isOpen, selectedDeviceId, activeTab]);

  const startStream = async () => {
    stopStream();
    setStreamError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    } catch (err: any) {
      console.warn('Cannot open webcam / capture card:', err);
      setStreamError(
        'Không thể mở Video Capture Card / Camera: ' +
          (err.message || 'Thiết bị đang bận hoặc chưa cấp quyền')
      );
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Keyboard shortcut Spacebar to take Snapshot
  useEffect(() => {
    if (!isOpen || activeTab !== 'capture') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (e.target as HTMLElement)?.tagName !== 'INPUT' &&
        (e.target as HTMLElement)?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        takeSnapshot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isStreaming, activeTab]);

  // Take Snapshot from live video stream
  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;
    setCaptureLoading(true);

    // Audio & Visual feedback
    playShutterSound();
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.95);

      const res = await api.post(`/studies/${studyInstanceUid}/media/capture`, {
        imageBase64: base64,
        title: `Chụp từ máy ${modality} (${new Date().toLocaleTimeString('vi-VN')})`
      });

      if (res.data?.success) {
        setFeedbackToast(`📸 Đã lưu thành công ảnh lúc ${new Date().toLocaleTimeString('vi-VN')}`);
        setTimeout(() => setFeedbackToast(null), 3000);
      }

      onMediaUpdated();
    } catch (err: any) {
      alert('Lỗi khi chụp ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setCaptureLoading(false);
    }
  };

  // Upload files from disk
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append('files', f));

      await api.post(`/studies/${studyInstanceUid}/media/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadFiles([]);
      onMediaUpdated();
      setActiveTab('gallery');
    } catch (err: any) {
      alert('Lỗi tải ảnh lên: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Toggle Key Image for print template
  const handleToggleKeyImage = async (item: StudyMediaItem) => {
    try {
      const currentKeyIds = studyMedia.filter((m) => m.is_key_image).map((m) => m.id);
      let newKeyIds: string[];

      if (item.is_key_image) {
        newKeyIds = currentKeyIds.filter((id) => id !== item.id);
      } else {
        if (currentKeyIds.length >= 6) {
          alert('Đã chọn tối đa 6 ảnh in. Vui lòng bỏ chọn bớt một ảnh trước!');
          return;
        }
        newKeyIds = [...currentKeyIds, item.id];
      }

      await api.put(`/studies/${studyInstanceUid}/media/key-images`, {
        keyImageIds: newKeyIds
      });

      onMediaUpdated();
    } catch (err: any) {
      console.error('Error toggling key image:', err);
    }
  };

  // Quick select first 4 or 6 images
  const handleSelectBatch = async (count: number) => {
    try {
      const targetIds = studyMedia.slice(0, count).map((m) => m.id);
      await api.put(`/studies/${studyInstanceUid}/media/key-images`, {
        keyImageIds: targetIds
      });
      onMediaUpdated();
    } catch (err: any) {
      console.error('Error batch selecting:', err);
    }
  };

  const [isPushingDicom, setIsPushingDicom] = useState(false);

  // Push all images to Orthanc DICOM
  const handlePushAllDicom = async () => {
    if (!studyMedia.length) return;
    setIsPushingDicom(true);
    try {
      const res = await api.post(`/studies/${studyInstanceUid}/media/push-all-dicom`, {
        patientName,
        patientId: studyInstanceUid.slice(-6),
        modality
      });
      setFeedbackToast(res.data?.message || 'Đã đóng gói & đẩy thành công tất cả ảnh lên PACS DICOM!');
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      alert('Lỗi đẩy ảnh lên PACS DICOM: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPushingDicom(false);
    }
  };

  // Push single image to Orthanc DICOM
  const handlePushSingleDicom = async (mediaId: string) => {
    try {
      const res = await api.post(`/studies/${studyInstanceUid}/media/${mediaId}/push-dicom`, {
        patientName,
        patientId: studyInstanceUid.slice(-6),
        modality
      });
      setFeedbackToast('✅ ' + (res.data?.message || 'Đã đóng gói và đẩy ảnh vào PACS DICOM'));
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err: any) {
      alert('Lỗi đẩy ảnh lên PACS DICOM: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete image
  const handleDeleteImage = async (mediaId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi ca chụp?')) return;
    try {
      await api.delete(`/studies/${studyInstanceUid}/media/${mediaId}`);
      if (previewImage?.id === mediaId) setPreviewImage(null);
      onMediaUpdated();
    } catch (err: any) {
      alert('Lỗi xóa ảnh: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!isOpen) return null;

  const keyImages = studyMedia.filter((m) => m.is_key_image);
  const keyImagesCount = keyImages.length;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-[#0b1329] border border-[#1b2d56] text-white w-full max-w-6xl rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2d56] pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide text-white">
                  Trạm Chụp &amp; Nạp Hình Ảnh Ca Bệnh
                </h3>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  {modality}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Đã chọn {keyImagesCount}/6 ảnh in
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bệnh nhân: <b className="text-white uppercase font-black">{patientName}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title="Đóng cửa sổ (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Quick Hints */}
        <div className="flex items-center justify-between border-b border-[#18284d] pb-2 text-xs font-bold shrink-0">
          <div className="flex items-center gap-1.5 bg-[#070d1d] p-1 rounded-2xl border border-[#18284d]">
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'capture'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Chụp Trực Tiếp (Capture Card)</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Nạp Từ Thư Mục</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Thư Viện Ảnh ({studyMedia.length})</span>
              {keyImagesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-black">
                  {keyImagesCount} in
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-amber-400 bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-800/40">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Phím <b>Space</b> hoặc <b>Bàn Đạp Chân</b> để chụp tức thì</span>
          </div>
        </div>

        {/* Notification Toast */}
        {feedbackToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{feedbackToast}</span>
            </span>
            <button onClick={() => setFeedbackToast(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── TAB 1: LIVE CAPTURE ── */}
        {activeTab === 'capture' && (
          <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
            
            {/* Left: Video Monitor Box */}
            <div className="flex-1 flex flex-col bg-black rounded-3xl overflow-hidden border border-[#1b2d56] shadow-2xl relative min-h-0">
              
              {/* Top Source Toolbar */}
              <div className="p-2.5 bg-gradient-to-r from-slate-900 via-[#0a152d] to-slate-900 border-b border-[#1b2d56] flex items-center justify-between gap-2 z-10 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 text-[10px] font-black border border-rose-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> LIVE HD
                  </span>

                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-[#0e1b38] text-white text-xs border border-[#22396e] font-sans cursor-pointer max-w-[200px] sm:max-w-xs truncate focus:outline-none focus:border-sky-500"
                  >
                    {videoDevices.length > 0 ? (
                      videoDevices.map((d, idx) => (
                        <option key={d.deviceId || idx} value={d.deviceId}>
                          {d.label || `Thiết bị Video Input ${idx + 1}`}
                        </option>
                      ))
                    ) : (
                      <option value="">Không tìm thấy thiết bị Video</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={startStream}
                    className="px-2.5 py-1 rounded-xl bg-[#0e1b38] hover:bg-[#152750] text-slate-300 text-xs flex items-center gap-1.5 border border-[#22396e] transition cursor-pointer"
                    title="Khởi động lại nguồn video"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Làm Mới</span>
                  </button>

                  <button
                    onClick={takeSnapshot}
                    disabled={!isStreaming || captureLoading}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp Nhanh</span>
                  </button>
                </div>
              </div>

              {/* Live Video Canvas */}
              <div className="flex-1 relative flex items-center justify-center bg-black min-h-0 overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain max-h-[500px]"
                />

                {/* Visual Flash */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white/95 z-30 transition-opacity duration-150 pointer-events-none" />
                )}

                {streamError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#070f22]/95 space-y-3 z-20">
                    <VideoOff className="w-12 h-12 text-rose-500" />
                    <p className="text-sm font-bold text-rose-400 max-w-md">{streamError}</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Nếu phòng khám dùng máy tính nhận ảnh qua thư mục, vui lòng bấm tab <b>"Nạp Từ Thư Mục"</b>.
                    </p>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Bottom Big Capture Bar */}
              <div className="p-3 bg-gradient-to-r from-slate-950 via-[#071024] to-slate-950 border-t border-[#1b2d56] flex items-center justify-center gap-4 shrink-0">
                <button
                  onClick={takeSnapshot}
                  disabled={!isStreaming || captureLoading}
                  className="px-10 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition active:scale-95 disabled:opacity-50 cursor-pointer border border-emerald-400/30"
                >
                  <Camera className="w-5 h-5 text-emerald-100" />
                  <span>{captureLoading ? 'ĐANG LƯU ẢNH...' : '📷 CHỤP ẢNH (Phím Space / Bàn Đạp)'}</span>
                </button>
              </div>
            </div>

            {/* Right: Side Thumbnail Gallery */}
            <div className="w-full md:w-80 shrink-0 bg-[#070f22] rounded-3xl p-3.5 border border-[#1b2d56] flex flex-col min-h-0">
              
              {/* Header with Quick Actions */}
              <div className="flex items-center justify-between border-b border-[#18284d] pb-2.5 mb-2.5 shrink-0">
                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Ảnh đã chụp</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px]">
                      {studyMedia.length}
                    </span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                    {keyImagesCount}/6 ảnh được in
                  </span>
                </div>

                {studyMedia.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSelectBatch(4)}
                      className="px-2 py-1 rounded-lg bg-[#0e1b38] hover:bg-[#172c5c] text-[10px] font-bold text-sky-300 border border-[#22396e] transition cursor-pointer"
                      title="Tự động chọn 4 ảnh đầu để in"
                    >
                      Chọn 4 ảnh
                    </button>
                    <button
                      onClick={() => handleSelectBatch(6)}
                      className="px-2 py-1 rounded-lg bg-[#0e1b38] hover:bg-[#172c5c] text-[10px] font-bold text-sky-300 border border-[#22396e] transition cursor-pointer"
                      title="Tự động chọn 6 ảnh đầu để in"
                    >
                      Chọn 6 ảnh
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails Grid List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {studyMedia.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs italic space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                    <p>Chưa có ảnh nào.</p>
                    <p className="text-[11px]">Bấm nút "Chụp Ảnh" hoặc nhấn phím Space.</p>
                  </div>
                ) : (
                  studyMedia.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`relative rounded-2xl overflow-hidden border transition-all duration-200 group bg-[#0a152d] ${
                        m.is_key_image
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50'
                          : 'border-[#1b2d56] hover:border-sky-500'
                      }`}
                    >
                      <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => setPreviewImage(m)}>
                        <img
                          src={getMediaUrl(m.url)}
                          alt={m.original_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400';
                          }}
                        />

                        {/* Order Index Badge */}
                        {m.is_key_image ? (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black font-mono shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ảnh {m.order_index}
                          </span>
                        ) : (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 text-slate-400 text-[9px] font-mono backdrop-blur">
                            Chưa in
                          </span>
                        )}

                        {/* Hover Overlay Buttons */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(m);
                            }}
                            className="p-2 rounded-xl bg-slate-800/90 hover:bg-white text-white hover:text-slate-900 transition cursor-pointer"
                            title="Xem kích thước lớn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleKeyImage(m);
                            }}
                            className={`p-2 rounded-xl font-bold transition cursor-pointer ${
                              m.is_key_image
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800/90 hover:bg-emerald-600 text-white'
                            }`}
                            title={m.is_key_image ? 'Bỏ chọn ảnh in' : 'Chọn in ảnh này'}
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(m.id);
                            }}
                            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Card Bottom Info */}
                      <div className="p-2 flex items-center justify-between text-[11px]">
                        <span className="truncate text-slate-300 font-medium max-w-[170px]">
                          {m.original_name}
                        </span>

                        <button
                          onClick={() => handleToggleKeyImage(m)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            m.is_key_image
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m.is_key_image ? `✓ Ảnh ${m.order_index}` : '+ Chọn in'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: FOLDER UPLOAD ── */}
        {activeTab === 'upload' && (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-4">
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-[#22396e] hover:border-sky-500 rounded-3xl p-10 text-center transition-colors bg-[#070f22] cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/bmp,image/webp,.dcm"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FolderOpen className="w-14 h-14 text-sky-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-base font-black text-white">
                  Kéo thả hoặc bấm để chọn ảnh Siêu âm / Nội soi (JPG, PNG, BMP)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ tải lên cùng lúc nhiều tệp ảnh từ máy tính hoặc ổ đĩa mạng LAN
                </p>
              </div>

              {uploadFiles.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#070f22] border border-[#1b2d56] text-xs space-y-2">
                  <p className="font-black text-sky-400">
                    Đã chọn {uploadFiles.length} tệp:
                  </p>
                  <ul className="space-y-1 max-h-36 overflow-y-auto text-slate-300 pr-1 custom-scrollbar">
                    {uploadFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between py-0.5 border-b border-slate-800">
                        <span className="truncate max-w-md">• {f.name}</span>
                        <span className="font-mono text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={uploading || !uploadFiles.length}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Đang nạp ảnh...' : 'Lưu Tất Cả Vào Ca Bệnh'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 3: GALLERY ── */}
        {activeTab === 'gallery' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Bấm vào ảnh để <b>Chọn / Bỏ chọn in</b> lên phiếu kết quả A4 (Tối đa <b>6</b> ảnh).
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-sm text-emerald-300">
                  {keyImagesCount} / 6 ảnh in
                </span>
                <button
                  onClick={() => handleSelectBatch(4)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Chọn 4 ảnh
                </button>
                <button
                  onClick={() => handleSelectBatch(6)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  Chọn 6 ảnh
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pr-1 custom-scrollbar">
              {studyMedia.length === 0 ? (
                <div className="col-span-full p-16 text-center text-slate-500 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="font-bold text-white">Chưa có ảnh nào trong ca chụp này</p>
                  <p className="text-xs">Vui lòng chuyển qua tab "Chụp trực tiếp" hoặc "Nạp từ thư mục" để thêm ảnh.</p>
                </div>
              ) : (
                studyMedia.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleKeyImage(m)}
                    className={`relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 shadow-md group ${
                      m.is_key_image
                        ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-950/20'
                        : 'border-[#1b2d56] hover:border-sky-500 bg-[#070f22]'
                    }`}
                  >
                    <div className="aspect-video relative bg-black overflow-hidden">
                      <img
                        src={getMediaUrl(m.url)}
                        alt={m.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400';
                        }}
                      />

                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        {m.is_key_image ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-black text-[11px] shadow-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ảnh {m.order_index}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-black/70 text-slate-300 font-mono text-[10px] backdrop-blur">
                            Chưa in
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(m.id);
                          }}
                          className="p-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition pointer-events-auto cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 text-[11px] text-slate-300 truncate font-medium flex items-center justify-between">
                      <span className="truncate">{m.original_name}</span>
                      <span className={m.is_key_image ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {m.is_key_image ? `Ảnh ${m.order_index}` : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2.5 border-t border-[#18284d] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePushAllDicom}
              disabled={isPushingDicom || studyMedia.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Đóng gói và đẩy tất cả ảnh thành định dạng DICOM lưu vào máy chủ PACS Orthanc"
            >
              <CloudUpload className="w-4 h-4 text-sky-200" />
              <span>{isPushingDicom ? 'Đang đẩy lên PACS...' : '📤 Đẩy Tất Cả Lên PACS DICOM'}</span>
            </button>
            <span className="hidden sm:inline text-slate-400 text-[11px]">
              Tự động đóng gói chuẩn DICOM Secondary Capture cho máy chủ PACS Orthanc &amp; 3D Viewer.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full bg-[#0a1428] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-white">{previewImage.original_name}</span>
              <button onClick={() => setPreviewImage(null)} className="p-1 rounded text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-black rounded-2xl overflow-hidden">
              <img src={getMediaUrl(previewImage.url)} alt={previewImage.original_name} className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  handleToggleKeyImage(previewImage);
                  setPreviewImage(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewImage.is_key_image ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {previewImage.is_key_image ? 'Bỏ chọn in' : 'Chọn in ảnh này'}
              </button>
              <button onClick={() => setPreviewImage(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

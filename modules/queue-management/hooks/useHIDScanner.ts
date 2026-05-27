
import { useEffect, useRef } from 'react';

interface UseHIDScannerProps {
  onScan: (code: string) => void;
  onInputStart?: () => void;
  enabled?: boolean;
}

const useHIDScanner = ({ onScan, onInputStart, enabled = true }: UseHIDScannerProps) => {
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<any>(null);
  const isReceivingRef = useRef<boolean>(false);

  const onScanRef = useRef(onScan);
  const onInputStartRef = useRef(onInputStart);

  useEffect(() => {
    onScanRef.current = onScan;
    onInputStartRef.current = onInputStart;
  }, [onScan, onInputStart]);

  useEffect(() => {
    if (!enabled) return;

    const finalizeScan = () => {
      const data = bufferRef.current.trim();
      if (data.length > 5) {
        onScanRef.current(data);
      }
      bufferRef.current = '';
      isReceivingRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ vào ô nhập liệu thực tế (ví dụ: màn hình cài đặt)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // 1. Phát hiện BẮT ĐẦU quét
      if (!isReceivingRef.current && e.key !== 'Enter' && e.key.length === 1) {
        isReceivingRef.current = true;
        bufferRef.current = '';
        if (onInputStartRef.current) onInputStartRef.current();
        console.log(`[HID Scanner] Global capture started`);
      }

      // 2. Tích lũy ký tự
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Detect END (Enter)
      if (e.key === 'Enter') {
        e.preventDefault();
        finalizeScan();
        return;
      }

      // Safety Timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isReceivingRef.current) {
          finalizeScan();
        }
      }, 500);
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled]);

  return null;
};

export default useHIDScanner;

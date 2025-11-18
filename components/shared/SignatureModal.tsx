import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import { XIcon } from '../Icons';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  // This effect handles the modal's animation state.
  useEffect(() => {
    if (isOpen) {
      setIsShowing(true);
    } else {
      setIsShowing(false);
    }
  }, [isOpen]);

  // This effect manages the SignaturePad lifecycle once the modal is visible.
  useEffect(() => {
    if (isShowing && canvasRef.current) {
      const canvas = canvasRef.current;
      
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
        }
        // When resizing, we should clear the canvas.
        signaturePadRef.current?.clear();
      };
      
      // We wait for the modal's entry animation to complete before initializing.
      // This ensures we get the correct canvas dimensions.
      const initTimer = setTimeout(() => {
        resizeCanvas();
        signaturePadRef.current = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
        });
        window.addEventListener('resize', resizeCanvas);
      }, 300); // This duration should match the CSS transition duration.

      // Cleanup function to run when the component unmounts or `isShowing` becomes false.
      return () => {
        clearTimeout(initTimer);
        window.removeEventListener('resize', resizeCanvas);
        signaturePadRef.current?.off(); // Important: removes event listeners attached by signature_pad
        signaturePadRef.current = null;
      };
    }
  }, [isShowing]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      onSave(dataUrl);
    } else {
      alert('Please provide a signature first.');
    }
  };
  
  const handleClose = () => {
      setIsShowing(false);
      // Allow animation to finish before calling parent's onClose
      setTimeout(onClose, 300);
  }

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black z-[60] flex justify-center items-center p-4 transition-opacity duration-300 ease-out ${isShowing ? 'bg-opacity-60' : 'bg-opacity-0'}`}
      aria-modal="true"
      role="dialog"
      onClick={handleClose}
    >
      <div 
        className={`bg-slate-100 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col transition-all duration-300 ease-out ${isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Draw Your Signature</h3>
          <button onClick={handleClose} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" aria-label="Close signature pad">
            <XIcon className="w-5 h-5"/>
          </button>
        </header>
        <div className="p-4">
            <div className="bg-white border border-slate-300 dark:border-slate-600 rounded-md touch-none">
                <canvas ref={canvasRef} className="w-full h-48 cursor-crosshair"></canvas>
            </div>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                Use your mouse or finger to draw your signature.
            </p>
        </div>
        <footer className="flex justify-end items-center p-4 border-t border-slate-200 dark:border-slate-700 gap-3">
          <button onClick={handleClear} className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-md transition-colors">
            Clear
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary hover:bg-secondary text-white font-semibold rounded-md transition-colors">
            Apply Signature
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SignatureModal;

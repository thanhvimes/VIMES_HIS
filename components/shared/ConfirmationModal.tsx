import React, { useEffect, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsShowing(true);
    } else {
      setIsShowing(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  const handleClose = () => {
      setIsShowing(false);
      setTimeout(onClose, 300);
  }

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black z-[70] flex justify-center items-center p-4 transition-opacity duration-300 ease-out ${isShowing ? 'bg-opacity-60' : 'bg-opacity-0'}`}
      aria-modal="true"
      role="dialog"
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md flex flex-col transition-all duration-300 ease-out ${isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        <footer className="flex justify-end items-center p-4 bg-slate-50 dark:bg-slate-700/50 gap-3 rounded-b-lg">
          <button onClick={handleClose} className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors">
            Confirm
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;

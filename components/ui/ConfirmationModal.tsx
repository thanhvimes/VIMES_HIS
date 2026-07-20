import React from 'react';
import Card from './Card';
import { ExclamationCircleIcon } from '../Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'danger' | 'warning' | 'success' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  severity = 'danger',
}) => {
  if (!isOpen) return null;

  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'danger':
      default:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
  };

  const getIconColor = () => {
    switch (severity) {
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      case 'danger':
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getIconBg = () => {
    switch (severity) {
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/50';
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-900/50';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/50';
      case 'danger':
      default:
        return 'bg-red-100 dark:bg-red-900/50';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getIconBg()} sm:mx-0 sm:h-10 sm:w-10`}>
                <ExclamationCircleIcon className={`h-6 w-6 ${getIconColor()}`} />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-slate-100" id="modal-title">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                    {message}
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${getConfirmButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;
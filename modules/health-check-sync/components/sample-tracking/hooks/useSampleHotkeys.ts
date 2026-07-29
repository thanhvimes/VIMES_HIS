import { useEffect } from 'react';

interface HotkeyHandlers {
    onConfirmReceipt?: () => void;
    onOpenBatchModal?: () => void;
    onOpenRejectionModal?: () => void;
    onReloadData?: () => void;
    onBackToList?: () => void;
    onToggleHotkeyGuide?: () => void;
    isModalOpen?: boolean;
}

export const useSampleHotkeys = ({
    onConfirmReceipt,
    onOpenBatchModal,
    onOpenRejectionModal,
    onReloadData,
    onBackToList,
    onToggleHotkeyGuide,
    isModalOpen = false
}: HotkeyHandlers) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if key is pressed inside an input/textarea, EXCEPT function keys (F2, F4...) and Escape
            const target = e.target as HTMLElement;
            const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

            // Help Dialog: Shift + ? or /
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                if (!isInput && onToggleHotkeyGuide) {
                    e.preventDefault();
                    onToggleHotkeyGuide();
                    return;
                }
            }

            // F2: Open Batch Receiving Modal
            if (e.key === 'F2') {
                e.preventDefault();
                if (onOpenBatchModal) onOpenBatchModal();
                return;
            }

            // F4 or Ctrl + Enter: Confirm Receipt
            if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                if (onConfirmReceipt) onConfirmReceipt();
                return;
            }

            // F8 or Alt + R: Reject Sample
            if (e.key === 'F8' || (e.altKey && (e.key === 'r' || e.key === 'R'))) {
                e.preventDefault();
                if (onOpenRejectionModal) onOpenRejectionModal();
                return;
            }

            // F5 or Ctrl + Shift + R: Reload Data
            if (e.key === 'F5') {
                e.preventDefault();
                if (onReloadData) onReloadData();
                return;
            }

            // Escape: Close modals or return to slip list
            if (e.key === 'Escape') {
                if (!isModalOpen && onBackToList) {
                    e.preventDefault();
                    onBackToList();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onConfirmReceipt, onOpenBatchModal, onOpenRejectionModal, onReloadData, onBackToList, onToggleHotkeyGuide, isModalOpen]);
};
